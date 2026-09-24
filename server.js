const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const DEFAULT_BASE_URLS = {
  custom: 'http://localhost:8000/v1',
  custom_anthropic: 'http://localhost:8000',
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://127.0.0.1:11434/v1',
  lmstudio: 'http://127.0.0.1:1234/v1'
};

/**
 * Normalizes provider endpoint URL
 */
function resolveChatEndpoint(baseUrl, provider) {
  let url = (baseUrl || '').trim().replace(/\/+$/, '');
  
  if (!url) {
    url = DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.custom || DEFAULT_BASE_URLS.openai;
  }

  // Windows IPv4 normalization: prevent Node.js from attempting ::1 on local servers
  if (url.includes('localhost:1234')) {
    url = url.replace('localhost:1234', '127.0.0.1:1234');
  } else if (url.includes('localhost:11434')) {
    url = url.replace('localhost:11434', '127.0.0.1:11434');
  }

  if (provider === 'claude' || provider === 'anthropic' || provider === 'custom_anthropic') {
    if (url === 'https://api.anthropic.com' || url === 'https://api.anthropic.com/v1') {
      return 'https://api.anthropic.com/v1/messages';
    }
    if (url.endsWith('/messages')) return url;
    if (url.endsWith('/v1')) return `${url}/messages`;
    return `${url}/v1/messages`;
  }

  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }
  if (url.includes(':1234') || url.includes(':11434')) {
    return `${url}/v1/chat/completions`;
  }
  return `${url}/chat/completions`;
}

/**
 * Model Detection Route - queries local or remote /models endpoint with loaded/on-disk awareness
 */
app.get('/api/models', async (req, res) => {
  const { provider = 'custom', baseUrl = '', apiKey = '' } = req.query;
  let url = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    url = DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.custom;
  }
  if (provider === 'lmstudio' || url.includes(':1234')) {
    url = url.replace('localhost:1234', '127.0.0.1:1234');
  } else if (provider === 'ollama' || url.includes(':11434')) {
    url = url.replace('localhost:11434', '127.0.0.1:11434');
  }

  // 1. LM Studio Native REST API (returns rich metadata including loaded_instances)
  if (provider === 'lmstudio' || url.includes(':1234')) {
    const lmHost = url.match(/^https?:\/\/[^/]+/)?.[0] || 'http://127.0.0.1:1234';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const nativeRes = await fetch(`${lmHost}/api/v1/models`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (nativeRes.ok) {
        const nativeData = await nativeRes.json();
        if (Array.isArray(nativeData.models)) {
          const modelList = nativeData.models.map(m => {
            const isLoaded = Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0;
            return {
              id: m.key || m.id || m.name,
              name: m.display_name || m.name || m.key || m.id,
              isLoaded,
              type: m.type || 'llm',
              params: m.params_string || '',
              quantization: m.quantization?.name || '',
              size: m.size_bytes ? `${(m.size_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : ''
            };
          });

          // Sort so loaded models appear first
          modelList.sort((a, b) => (b.isLoaded ? 1 : 0) - (a.isLoaded ? 1 : 0));
          const activeLoaded = modelList.find(m => m.isLoaded && m.type !== 'embedding');

          return res.json({
            success: true,
            provider: 'lmstudio',
            models: modelList,
            activeLoadedModel: activeLoaded ? activeLoaded.id : (modelList[0]?.id || null),
            endpoint: `${lmHost}/api/v1/models`
          });
        }
      }
    } catch {
      // Fallback to standard OpenAI /v1/models below
    }
  }

  // 2. Ollama API (cross-reference /api/tags and running models from /api/ps)
  if (provider === 'ollama' || url.includes(':11434')) {
    const ollamaHost = url.match(/^https?:\/\/[^/]+/)?.[0] || 'http://127.0.0.1:11434';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      let runningModels = [];
      try {
        const psRes = await fetch(`${ollamaHost}/api/ps`, { signal: controller.signal });
        if (psRes.ok) {
          const psData = await psRes.json();
          runningModels = (psData.models || []).map(m => m.name || m.model);
        }
      } catch {
        // ps optional
      }

      const tagsRes = await fetch(`${ollamaHost}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (Array.isArray(tagsData.models)) {
          const modelList = tagsData.models.map(m => {
            const id = m.name || m.model;
            const isLoaded = runningModels.some(r => r === id || r.startsWith(id));
            return {
              id,
              name: id,
              isLoaded,
              type: 'llm',
              size: m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : ''
            };
          });

          modelList.sort((a, b) => (b.isLoaded ? 1 : 0) - (a.isLoaded ? 1 : 0));
          const activeLoaded = modelList.find(m => m.isLoaded);

          return res.json({
            success: true,
            provider: 'ollama',
            models: modelList,
            activeLoadedModel: activeLoaded ? activeLoaded.id : (modelList[0]?.id || null),
            endpoint: `${ollamaHost}/api/tags`
          });
        }
      }
    } catch {
      // Fallback to standard /v1/models below
    }
  }

  // 3. Standard OpenAI / Anthropic compatible /models endpoint
  let modelsEndpoint = '';
  if (provider === 'claude' || provider === 'anthropic' || provider === 'custom_anthropic') {
    modelsEndpoint = `${url}/v1/models`;
  } else if (url.endsWith('/v1')) {
    modelsEndpoint = `${url}/models`;
  } else if (url.endsWith('/models')) {
    modelsEndpoint = url;
  } else {
    modelsEndpoint = `${url}/v1/models`;
  }

  try {
    const headers = {};
    if (apiKey && apiKey.trim()) {
      if (provider === 'claude' || provider === 'anthropic') {
        headers['x-api-key'] = apiKey.trim();
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Server returned HTTP ${response.status}: ${errText.slice(0, 150)}`
      });
    }

    const data = await response.json();
    let rawList = [];
    if (Array.isArray(data.data)) {
      rawList = data.data;
    } else if (Array.isArray(data.models)) {
      rawList = data.models;
    } else if (Array.isArray(data)) {
      rawList = data;
    }

    const modelList = rawList.map(m => {
      const id = typeof m === 'string' ? m : (m.id || m.key || m.name || '');
      return {
        id,
        name: typeof m === 'string' ? m : (m.display_name || m.name || m.id || ''),
        isLoaded: true, // Cloud models are always accessible
        type: 'llm'
      };
    });

    return res.json({
      success: true,
      provider,
      models: modelList,
      activeLoadedModel: modelList[0]?.id || null,
      endpoint: modelsEndpoint
    });
  } catch (err) {
    let message = err.message;
    if (err.name === 'AbortError') {
      message = `Connection timed out after 7s to ${modelsEndpoint}`;
    } else if (err.code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
      if (provider === 'lmstudio' || modelsEndpoint.includes(':1234')) {
        message = `Could not connect to LM Studio at ${modelsEndpoint}. Ensure LM Studio Local Server is started (Developer tab -> Start Server on port 1234).`;
      } else if (provider === 'ollama' || modelsEndpoint.includes(':11434')) {
        message = `Could not connect to Ollama at ${modelsEndpoint}. Ensure Ollama is running ('ollama serve').`;
      } else {
        message = `Connection refused at ${modelsEndpoint}. Target local server is offline.`;
      }
    }
    return res.status(502).json({
      success: false,
      error: message,
      endpoint: modelsEndpoint
    });
  }
});

/**
 * Model Load Route - dynamically load a downloaded model into LM Studio memory/GPU
 */
app.post('/api/models/load', async (req, res) => {
  const { provider = 'lmstudio', baseUrl = '', model } = req.body;
  if (!model) {
    return res.status(400).json({ success: false, error: 'Model identifier is required.' });
  }

  let base = (baseUrl || '').trim().replace(/\/+$/, '') || DEFAULT_BASE_URLS[provider] || 'http://127.0.0.1:1234';
  base = base.replace('localhost:1234', '127.0.0.1:1234');
  const match = base.match(/^https?:\/\/[^/]+/);
  const host = match ? match[0] : 'http://127.0.0.1:1234';

  try {
    const loadRes = await fetch(`${host}/api/v1/models/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });

    const data = await loadRes.json();
    if (!loadRes.ok) {
      return res.status(loadRes.status).json({
        success: false,
        error: data.error?.message || `Failed to load model "${model}" into LM Studio.`
      });
    }

    return res.json({
      success: true,
      model,
      status: data.status || 'loaded',
      instance_id: data.instance_id
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Could not connect to LM Studio at ${host}: ${err.message}`
    });
  }
});

/**
 * Model Unload/Eject Route - dynamically unload an active model from LM Studio VRAM
 */
app.post('/api/models/unload', async (req, res) => {
  const { provider = 'lmstudio', baseUrl = '', model } = req.body;
  if (!model) {
    return res.status(400).json({ success: false, error: 'Model identifier is required.' });
  }

  let base = (baseUrl || '').trim().replace(/\/+$/, '') || DEFAULT_BASE_URLS[provider] || 'http://127.0.0.1:1234';
  base = base.replace('localhost:1234', '127.0.0.1:1234');
  const match = base.match(/^https?:\/\/[^/]+/);
  const host = match ? match[0] : 'http://127.0.0.1:1234';

  try {
    const unloadRes = await fetch(`${host}/api/v1/models/unload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance_id: model })
    });

    const data = await unloadRes.json();
    if (!unloadRes.ok) {
      return res.status(unloadRes.status).json({
        success: false,
        error: data.error?.message || `Failed to unload model "${model}".`
      });
    }

    return res.json({
      success: true,
      model,
      status: 'unloaded'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Could not connect to LM Studio at ${host}: ${err.message}`
    });
  }
});

/**
 * Universal Proxy Route
 */
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const abortController = new AbortController();

  // If client disconnects or aborts the request, terminate upstream LLM request
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  let timeoutTimer = null;

  try {
    const {
      provider = 'custom',
      baseUrl,
      apiKey = '',
      model,
      messages = [],
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
      customHeaders = {},
      tools,
      toolChoice,
      responseFormat,
      topP,
      seed,
      stop,
      timeout = 60000
    } = req.body;

    if (timeout && timeout > 0) {
      timeoutTimer = setTimeout(() => {
        abortController.abort(new Error(`TIMEOUT_${timeout}`));
      }, timeout);
    }

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Model name is required.'
      });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one message is required.'
      });
    }

    const isAnthropic = provider === 'claude' || provider === 'anthropic' || provider === 'custom_anthropic';

    const requestConfig = {
      provider,
      baseUrl,
      apiKey,
      model,
      messages,
      temperature,
      maxTokens,
      stream,
      customHeaders,
      tools,
      toolChoice,
      responseFormat,
      topP,
      seed,
      stop,
      startTime,
      signal: abortController.signal
    };

    if (isAnthropic) {
      return await handleAnthropicRequest(req, res, requestConfig);
    } else {
      return await handleOpenAICompatibleRequest(req, res, requestConfig);
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    if (err.name === 'AbortError' || err.message?.startsWith('TIMEOUT_')) {
      const isTimeout = err.message?.startsWith('TIMEOUT_');
      const sec = isTimeout ? parseInt(err.message.split('_')[1], 10) / 1000 : null;
      return res.status(408).json({
        success: false,
        error: isTimeout ? `Request timed out after ${sec}s.` : 'Request was cancelled by client.',
        latency
      });
    }

    console.error('API Chat Error:', err);
    let errorMsg = err.message || 'Internal Server Error';
    if (err.code === 'ECONNREFUSED' || errorMsg.includes('ECONNREFUSED')) {
      if (req.body?.provider === 'lmstudio' || (req.body?.baseUrl && req.body.baseUrl.includes(':1234'))) {
        errorMsg = `Cannot connect to LM Studio at ${req.body.baseUrl || 'http://127.0.0.1:1234'}. Ensure LM Studio Local Server is started (Developer tab -> Start Server on port 1234).`;
      } else if (req.body?.provider === 'ollama' || (req.body?.baseUrl && req.body.baseUrl.includes(':11434'))) {
        errorMsg = `Cannot connect to Ollama at ${req.body.baseUrl || 'http://127.0.0.1:11434'}. Ensure Ollama is running ('ollama serve').`;
      } else {
        errorMsg = `Connection refused at ${req.body?.baseUrl || 'target endpoint'}. Server is not reachable.`;
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMsg,
      latency
    });
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }
});

/**
 * Handler for Anthropic Messages API
 */
async function handleAnthropicRequest(req, res, config) {
  const { provider, baseUrl, apiKey, model, messages, temperature, maxTokens, stream, customHeaders, tools, startTime } = config;

  const endpoint = resolveChatEndpoint(baseUrl, provider || 'claude');

  // Anthropic requires separating system message from conversation messages
  let systemPrompt = undefined;
  const filteredMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + msg.content;
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      filteredMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  // Ensure first message is user role
  if (filteredMessages.length === 0 || filteredMessages[0].role !== 'user') {
    filteredMessages.unshift({ role: 'user', content: 'Hello' });
  }

  const payload = {
    model: model.trim(),
    messages: filteredMessages,
    max_tokens: Number(maxTokens) || 2048,
    temperature: Number(temperature) ?? 0.7,
    stream: Boolean(stream)
  };

  if (systemPrompt) {
    payload.system = systemPrompt;
  }

  if (tools && Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
  }

  const cleanKey = (apiKey || '').trim();
  const headers = {
    'content-type': 'application/json',
    'x-api-key': cleanKey,
    'anthropic-version': '2023-06-01',
    ...customHeaders
  };

  // Support custom Anthropic-compatible proxies that require standard Bearer authorization
  if (cleanKey && !headers['authorization']) {
    headers['authorization'] = `Bearer ${cleanKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: config.signal
  });

  const latency = Date.now() - startTime;
  const responseHeaders = {};
  response.headers.forEach((val, key) => {
    responseHeaders[key] = val;
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    return res.status(response.status).json({
      success: false,
      status: response.status,
      statusText: response.statusText,
      error: errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)),
      rawError: errorData,
      headers: responseHeaders,
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Notify client of initial response headers and status
    res.write(`data: ${JSON.stringify({ init: true, status: response.status, headers: responseHeaders })}\n\n`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'content_block_delta') {
              if (parsed.delta?.type === 'thinking_delta' && parsed.delta?.thinking) {
                res.write(`data: ${JSON.stringify({ reasoning: parsed.delta.thinking })}\n\n`);
              } else if (parsed.delta?.text) {
                res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
              }
            } else if (parsed.type === 'message_delta' && parsed.usage) {
              res.write(`data: ${JSON.stringify({ usage: parsed.usage })}\n\n`);
            }
          } catch {
            // Ignore parse errors on partial frames
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, latency: Date.now() - startTime })}\n\n`);
      res.end();
    } catch (streamErr) {
      res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      res.end();
    }
    return;
  }

  // Non-streaming response
  const data = await response.json();
  const textContent = Array.isArray(data.content)
    ? data.content.filter(c => c.type === 'text').map(c => c.text || '').join('')
    : (data.content || '');

  const reasoningContent = Array.isArray(data.content)
    ? data.content.filter(c => c.type === 'thinking').map(c => c.thinking || '').join('')
    : '';

  return res.json({
    success: true,
    status: response.status,
    content: textContent,
    reasoning: reasoningContent,
    model: data.model || model,
    headers: responseHeaders,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    },
    latency,
    raw: data,
    endpoint
  });
}

/**
 * Handler for OpenAI-compatible API endpoints
 */
async function handleOpenAICompatibleRequest(req, res, config) {
  const { provider, baseUrl, apiKey, model, messages, temperature, maxTokens, stream, customHeaders, tools, toolChoice, responseFormat, topP, seed, stop, startTime } = config;

  const endpoint = resolveChatEndpoint(baseUrl, provider);

  const payload = {
    model: model.trim(),
    messages,
    temperature: Number(temperature) ?? 0.7,
    max_tokens: Number(maxTokens) || 2048,
    stream: Boolean(stream)
  };

  if (tools && Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
  }
  if (toolChoice) {
    payload.tool_choice = toolChoice;
  }
  if (responseFormat) {
    payload.response_format = responseFormat;
  }
  if (topP !== undefined && topP !== '' && topP !== null) {
    payload.top_p = Number(topP);
  }
  if (seed !== undefined && seed !== '' && seed !== null) {
    payload.seed = Number(seed);
  }
  if (stop && stop.length > 0) {
    payload.stop = stop;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: config.signal
  });

  const latency = Date.now() - startTime;
  const responseHeaders = {};
  response.headers.forEach((val, key) => {
    responseHeaders[key] = val;
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    return res.status(response.status).json({
      success: false,
      status: response.status,
      statusText: response.statusText,
      error: errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)),
      rawError: errorData,
      headers: responseHeaders,
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Notify client of initial response headers and status
    res.write(`data: ${JSON.stringify({ init: true, status: response.status, headers: responseHeaders })}\n\n`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            res.write(`data: ${JSON.stringify({ done: true, latency: Date.now() - startTime })}\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            const deltaText = delta?.content || '';
            const reasoningText = delta?.reasoning_content || delta?.reasoning || '';
            const toolCalls = delta?.tool_calls || null;
            const usage = parsed.usage || null;

            if (reasoningText) {
              res.write(`data: ${JSON.stringify({ reasoning: reasoningText })}\n\n`);
            }
            if (deltaText) {
              res.write(`data: ${JSON.stringify({ text: deltaText })}\n\n`);
            }
            if (toolCalls) {
              res.write(`data: ${JSON.stringify({ tool_calls: toolCalls })}\n\n`);
            }
            if (usage) {
              res.write(`data: ${JSON.stringify({ usage })}\n\n`);
            }
          } catch {
            // Ignore parse errors on raw chunk
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, latency: Date.now() - startTime })}\n\n`);
      res.end();
    } catch (streamErr) {
      res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      res.end();
    }
    return;
  }

  // Non-streaming response
  const data = await response.json();
  const choice = data.choices?.[0];
  const textContent = choice?.message?.content || '';
  const reasoningContent = choice?.message?.reasoning_content || choice?.message?.reasoning || '';
  const toolCalls = choice?.message?.tool_calls || null;

  return res.json({
    success: true,
    status: response.status,
    content: textContent,
    reasoning: reasoningContent,
    tool_calls: toolCalls,
    model: data.model || model,
    headers: responseHeaders,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    },
    latency,
    raw: data,
    endpoint
  });
}

app.listen(PORT, () => {
  console.log(`OmniLLM Studio running at http://localhost:${PORT}`);
});
