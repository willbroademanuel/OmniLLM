const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1'
};

/**
 * Normalizes provider endpoint URL
 */
function resolveChatEndpoint(baseUrl, provider) {
  let url = (baseUrl || '').trim().replace(/\/+$/, '');
  
  if (!url) {
    url = DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.openai;
  }

  if (provider === 'claude' || provider === 'anthropic') {
    if (url === 'https://api.anthropic.com' || url === 'https://api.anthropic.com/v1') {
      return 'https://api.anthropic.com/v1/messages';
    }
    if (url.endsWith('/messages')) return url;
    return `${url}/v1/messages`;
  }

  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }
  return `${url}/chat/completions`;
}

/**
 * Universal Proxy Route
 */
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      provider = 'openai',
      baseUrl,
      apiKey = '',
      model,
      messages = [],
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
      customHeaders = {}
    } = req.body;

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

    const isAnthropic = provider === 'claude' || provider === 'anthropic';

    if (isAnthropic) {
      return await handleAnthropicRequest(req, res, {
        baseUrl,
        apiKey,
        model,
        messages,
        temperature,
        maxTokens,
        stream,
        customHeaders,
        startTime
      });
    } else {
      return await handleOpenAICompatibleRequest(req, res, {
        provider,
        baseUrl,
        apiKey,
        model,
        messages,
        temperature,
        maxTokens,
        stream,
        customHeaders,
        startTime
      });
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error('API Chat Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      latency
    });
  }
});

/**
 * Handler for Anthropic Messages API
 */
async function handleAnthropicRequest(req, res, config) {
  const { baseUrl, apiKey, model, messages, temperature, maxTokens, stream, customHeaders, startTime } = config;

  const endpoint = resolveChatEndpoint(baseUrl, 'claude');

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

  const headers = {
    'content-type': 'application/json',
    'x-api-key': apiKey.trim(),
    'anthropic-version': '2023-06-01',
    ...customHeaders
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const latency = Date.now() - startTime;

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
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
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
    ? data.content.map(c => c.text || '').join('')
    : (data.content || '');

  return res.json({
    success: true,
    status: response.status,
    content: textContent,
    model: data.model || model,
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
  const { provider, baseUrl, apiKey, model, messages, temperature, maxTokens, stream, customHeaders, startTime } = config;

  const endpoint = resolveChatEndpoint(baseUrl, provider);

  const payload = {
    model: model.trim(),
    messages,
    temperature: Number(temperature) ?? 0.7,
    max_tokens: Number(maxTokens) || 2048,
    stream: Boolean(stream)
  };

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
    body: JSON.stringify(payload)
  });

  const latency = Date.now() - startTime;

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
      latency,
      endpoint
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
            const deltaText = parsed.choices?.[0]?.delta?.content || '';
            const usage = parsed.usage || null;

            if (deltaText) {
              res.write(`data: ${JSON.stringify({ text: deltaText })}\n\n`);
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
  const textContent = data.choices?.[0]?.message?.content || '';

  return res.json({
    success: true,
    status: response.status,
    content: textContent,
    model: data.model || model,
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
