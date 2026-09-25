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

// Helper to filter and prioritize chat/LLM models for better UX
function filterAndSortModels(provider, rawList) {
  if (!Array.isArray(rawList)) return [];

  let list = rawList.map(m => {
    if (typeof m === 'string') {
      return { id: m, name: m, isLoaded: true, type: 'llm' };
    }
    const id = m.id || m.key || m.name || '';
    const cleanId = id.replace(/^models\//, '');
    const name = m.display_name || m.displayName || m.name || cleanId;
    return {
      id: cleanId,
      name: name.replace(/^models\//, ''),
      isLoaded: typeof m.isLoaded === 'boolean' ? m.isLoaded : true,
      type: m.type || 'llm'
    };
  }).filter(m => m.id);

  if (provider === 'openai') {
    // Filter non-chat models (embeddings, audio, moderation, older base models)
    const nonChatPrefixes = ['text-embedding', 'whisper', 'tts', 'dall-e', 'text-moderation', 'babbage', 'davinci', 'canary'];
    list = list.filter(m => !nonChatPrefixes.some(prefix => m.id.toLowerCase().startsWith(prefix)));

    const priority = ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'gpt-4-turbo', 'chatgpt-4o-latest'];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  } else if (provider === 'gemini') {
    list = list.filter(m => !m.id.includes('embedding') && !m.id.includes('aqa'));
    const priority = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  } else if (provider === 'claude') {
    const priority = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  } else if (provider === 'groq') {
    list = list.filter(m => !m.id.toLowerCase().includes('whisper'));
    const priority = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  } else if (provider === 'openrouter') {
    const priority = [
      'anthropic/claude-3.7-sonnet',
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-r1',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct'
    ];
    list.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
    if (list.length > 30) {
      list = list.slice(0, 30);
    }
  }

  return list;
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

  // 3. Google Gemini (both OpenAI compatibility layer and Native v1beta fallback)
  if (provider === 'gemini' || url.includes('generativelanguage.googleapis.com')) {
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is required to query models. Please enter your API key (starts with AIzaSy) above.'
      });
    }

    const cleanUrl = url.replace(/\/+$/, '');
    let geminiEndpoint = cleanUrl.endsWith('/openai') ? `${cleanUrl}/models` : 'https://generativelanguage.googleapis.com/v1beta/openai/models';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const geminiRes = await fetch(geminiEndpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawList = geminiData.data || geminiData.models || [];
        const modelList = filterAndSortModels('gemini', rawList);
        return res.json({
          success: true,
          provider: 'gemini',
          models: modelList,
          activeLoadedModel: modelList[0]?.id || 'gemini-2.5-flash',
          endpoint: geminiEndpoint
        });
      }
    } catch {
      // Try native Gemini models endpoint fallback below
    }

    try {
      const nativeEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const nativeRes = await fetch(nativeEndpoint, { signal: controller.signal });
      clearTimeout(timeout);

      if (nativeRes.ok) {
        const nativeData = await nativeRes.json();
        const rawList = nativeData.models || [];
        const modelList = filterAndSortModels('gemini', rawList);
        return res.json({
          success: true,
          provider: 'gemini',
          models: modelList,
          activeLoadedModel: modelList[0]?.id || 'gemini-2.5-flash',
          endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
        });
      } else {
        const errText = await nativeRes.text();
        return res.status(nativeRes.status).json({
          success: false,
          error: `Gemini API returned HTTP ${nativeRes.status}: ${errText.slice(0, 150)}`
        });
      }
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Could not connect to Gemini models endpoint: ${err.message}`
      });
    }
  }

  // 4. Anthropic Claude Official Models API
  if (provider === 'claude' || provider === 'anthropic') {
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key is required to query models. Please enter your API key (starts with sk-ant-) above.'
      });
    }
    const claudeEndpoint = 'https://api.anthropic.com/v1/models';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const claudeRes = await fetch(claudeEndpoint, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!claudeRes.ok) {
        let errText = await claudeRes.text();
        try {
          const errJson = JSON.parse(errText);
          errText = errJson.error?.message || errJson.message || errText;
        } catch {}
        return res.status(claudeRes.status).json({
          success: false,
          error: `Anthropic API returned HTTP ${claudeRes.status}: ${errText.slice(0, 150)}`
        });
      }

      const claudeData = await claudeRes.json();
      const modelList = filterAndSortModels('claude', claudeData.data || []);
      return res.json({
        success: true,
        provider: 'claude',
        models: modelList,
        activeLoadedModel: modelList[0]?.id || 'claude-3-7-sonnet-20250219',
        endpoint: claudeEndpoint
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Could not connect to Anthropic models endpoint: ${err.message}`
      });
    }
  }

  // 5. Cloud Keys Validation for OpenAI, Groq, DeepSeek
  if (['openai', 'groq', 'deepseek'].includes(provider) && (!apiKey || !apiKey.trim())) {
    const keyHint = provider === 'openai' ? 'starts with sk-' : (provider === 'groq' ? 'starts with gsk_' : 'DeepSeek platform key');
    return res.status(400).json({
      success: false,
      error: `API key is required to query ${provider.toUpperCase()} models. Please enter your API key (${keyHint}) above.`
    });
  }

  // 6. Standard OpenAI-compatible / Custom Anthropic /models endpoint
  let modelsEndpoint = '';
  const cleanUrl = url.replace(/\/+$/, '');
  if (provider === 'custom_anthropic') {
    modelsEndpoint = cleanUrl.endsWith('/messages')
      ? cleanUrl.replace('/messages', '/models')
      : (cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`);
  } else if (cleanUrl.endsWith('/models')) {
    modelsEndpoint = cleanUrl;
  } else if (cleanUrl.endsWith('/chat/completions')) {
    modelsEndpoint = cleanUrl.replace('/chat/completions', '/models');
  } else if (cleanUrl.endsWith('/v1')) {
    modelsEndpoint = `${cleanUrl}/models`;
  } else {
    modelsEndpoint = `${cleanUrl}/v1/models`;
  }

  try {
    const headers = { 'Accept': 'application/json' };
    if (apiKey && apiKey.trim()) {
      if (provider === 'custom_anthropic') {
        headers['x-api-key'] = apiKey.trim();
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
    }
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'OmniLLM Studio';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      let errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        errText = errJson.error?.message || errJson.message || errText;
      } catch {}
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

    const modelList = filterAndSortModels(provider, rawList);

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
      message = `Connection timed out after 8s to ${modelsEndpoint}`;
    } else if (err.code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
      if (provider === 'lmstudio' || modelsEndpoint.includes(':1234')) {
        message = `Could not connect to LM Studio at ${modelsEndpoint}. Ensure LM Studio Local Server is started (Developer tab -> Start Server on port 1234).`;
      } else if (provider === 'ollama' || modelsEndpoint.includes(':11434')) {
        message = `Could not connect to Ollama at ${modelsEndpoint}. Ensure Ollama is running ('ollama serve').`;
      } else {
        message = `Connection refused at ${modelsEndpoint}. Target server is offline.`;
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
 * Model Unload/Eject Route - dynamically unload an active model from LM Studio or Ollama VRAM
 */
app.post('/api/models/unload', async (req, res) => {
  const { provider = 'lmstudio', baseUrl = '', model } = req.body;
  if (!model) {
    return res.status(400).json({ success: false, error: 'Model identifier is required.' });
  }

  let base = (baseUrl || '').trim().replace(/\/+$/, '') || DEFAULT_BASE_URLS[provider] || (provider === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:1234');
  base = base.replace('localhost:1234', '127.0.0.1:1234').replace('localhost:11434', '127.0.0.1:11434');
  const match = base.match(/^https?:\/\/[^/]+/);
  const host = match ? match[0] : (provider === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:1234');

  if (provider === 'ollama' || host.includes(':11434')) {
    try {
      const unloadRes = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, keep_alive: 0 })
      });
      if (!unloadRes.ok) {
        const errData = await unloadRes.text();
        return res.status(unloadRes.status).json({ success: false, error: `Ollama unload error: ${errData}` });
      }
      return res.json({ success: true, model, status: 'unloaded' });
    } catch (err) {
      return res.status(500).json({ success: false, error: `Could not connect to Ollama at ${host}: ${err.message}` });
    }
  }

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
      customHeaders: reqCustomHeaders,
      headers: reqHeaders,
      tools,
      toolChoice,
      responseFormat,
      topP,
      seed,
      stop,
      timeout = 60000
    } = req.body;

    const customHeaders = reqCustomHeaders || reqHeaders || {};

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
      systemPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      let content = msg.content;
      // Convert OpenAI-style multimodal image_url to Anthropic base64 source format
      if (Array.isArray(content)) {
        content = content.map(part => {
          if (part.type === 'text') return { type: 'text', text: part.text };
          if (part.type === 'image_url' && part.image_url?.url) {
            const url = part.image_url.url;
            const match = url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: match[1],
                  data: match[2]
                }
              };
            }
          }
          return part;
        });
      }
      filteredMessages.push({
        role: msg.role,
        content
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
      upstreamHeaders: responseHeaders,
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Notify client of initial response headers and status
    res.write(`data: ${JSON.stringify({ init: true, status: response.status, headers: responseHeaders, upstreamHeaders: responseHeaders })}\n\n`);

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

  const toolCalls = Array.isArray(data.content)
    ? data.content
        .filter(c => c.type === 'tool_use')
        .map(t => ({
          id: t.id,
          type: 'function',
          function: {
            name: t.name,
            arguments: typeof t.input === 'string' ? t.input : JSON.stringify(t.input || {})
          }
        }))
    : null;

  return res.json({
    success: true,
    status: response.status,
    content: textContent,
    reasoning: reasoningContent,
    tool_calls: toolCalls && toolCalls.length > 0 ? toolCalls : null,
    model: data.model || model,
    headers: responseHeaders,
    upstreamHeaders: responseHeaders,
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
 * Helper to identify OpenAI reasoning models (o1, o3, etc.) that require
 * max_completion_tokens and disallow legacy max_tokens or custom temperature.
 */
function isOpenAIReasoningModel(modelName) {
  if (!modelName || typeof modelName !== 'string') return false;
  const m = modelName.trim().toLowerCase();
  const baseName = m.includes('/') ? m.split('/').pop() : m;
  return (
    baseName === 'o1' ||
    baseName.startsWith('o1-') ||
    baseName === 'o3' ||
    baseName.startsWith('o3-') ||
    baseName.startsWith('o4-') ||
    baseName.includes('-o1') ||
    baseName.includes('-o3')
  );
}

/**
 * Handler for OpenAI-compatible API endpoints
 */
async function handleOpenAICompatibleRequest(req, res, config) {
  const { provider, baseUrl, apiKey, model, messages, temperature, maxTokens, stream, customHeaders, tools, toolChoice, responseFormat, topP, seed, stop, startTime } = config;

  const endpoint = resolveChatEndpoint(baseUrl, provider);
  const isReasoning = isOpenAIReasoningModel(model);

  // OpenAI reasoning models require developer role rather than system role for instructions
  let processedMessages = messages;
  if (isReasoning && Array.isArray(messages)) {
    processedMessages = messages.map(msg => msg.role === 'system' ? { ...msg, role: 'developer' } : msg);
  }

  const payload = {
    model: model.trim(),
    messages: processedMessages,
    stream: Boolean(stream)
  };

  if (isReasoning) {
    // OpenAI o1/o3 reasoning models enforce max_completion_tokens and forbid max_tokens/temperature/top_p
    payload.max_completion_tokens = Number(maxTokens) || 2048;
  } else {
    payload.temperature = Number(temperature) ?? 0.7;
    payload.max_tokens = Number(maxTokens) || 2048;
    if (topP !== undefined && topP !== '' && topP !== null) {
      payload.top_p = Number(topP);
    }
  }

  if (tools && Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
  }
  if (toolChoice) {
    payload.tool_choice = toolChoice;
  }
  if (responseFormat) {
    payload.response_format = responseFormat;
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

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: config.signal
  });

  let errorData = null;

  // Self-healing automatic parameter reconciliation:
  // If endpoint returns HTTP 400 due to parameter constraints (e.g. max_tokens vs max_completion_tokens, temperature),
  // automatically reconcile parameters and retry transparently!
  if (!response.ok && response.status === 400) {
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {}
    }

    const errStr = (
      errorData?.error?.message ||
      errorData?.message ||
      (typeof errorData === 'string' ? errorData : '')
    ).toLowerCase();

    let retryNeeded = false;

    // Reconciliation 1: Swap max_tokens -> max_completion_tokens
    if (errStr.includes('max_completion_tokens') && payload.max_tokens !== undefined) {
      payload.max_completion_tokens = payload.max_tokens;
      delete payload.max_tokens;
      retryNeeded = true;
    }

    // Reconciliation 2: Strip unsupported temperature
    if (errStr.includes('temperature') && errStr.includes('not supported') && payload.temperature !== undefined) {
      delete payload.temperature;
      retryNeeded = true;
    }

    // Reconciliation 3: Strip unsupported top_p
    if (errStr.includes('top_p') && errStr.includes('not supported') && payload.top_p !== undefined) {
      delete payload.top_p;
      retryNeeded = true;
    }

    // Reconciliation 4: Convert system message to developer message
    if ((errStr.includes('system') && (errStr.includes('developer') || errStr.includes('not supported'))) && Array.isArray(payload.messages)) {
      payload.messages = payload.messages.map(m => m.role === 'system' ? { ...m, role: 'developer' } : m);
      retryNeeded = true;
    }

    if (retryNeeded) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: config.signal
      });

      if (!response.ok) {
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
      } else {
        errorData = null;
      }
    }
  }

  const latency = Date.now() - startTime;
  const responseHeaders = {};
  response.headers.forEach((val, key) => {
    responseHeaders[key] = val;
  });

  if (!response.ok) {
    if (!errorData) {
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
    }
    return res.status(response.status).json({
      success: false,
      status: response.status,
      statusText: response.statusText,
      error: errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)),
      rawError: errorData,
      headers: responseHeaders,
      upstreamHeaders: responseHeaders,
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Notify client of initial response headers and status
    res.write(`data: ${JSON.stringify({ init: true, status: response.status, headers: responseHeaders, upstreamHeaders: responseHeaders })}\n\n`);

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
            const delta = parsed.choices?.[0]?.delta || parsed.choices?.[0]?.message;
            let deltaText = '';
            if (typeof delta?.content === 'string') {
              deltaText = delta.content;
            } else if (Array.isArray(delta?.content)) {
              deltaText = delta.content.map(c => (typeof c === 'string' ? c : (c?.text || ''))).join('');
            } else if (typeof parsed.choices?.[0]?.text === 'string') {
              deltaText = parsed.choices[0].text;
            }

            const reasoningText = delta?.reasoning_content || delta?.reasoning || delta?.thinking || parsed.choices?.[0]?.reasoning_content || '';
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
    upstreamHeaders: responseHeaders,
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
