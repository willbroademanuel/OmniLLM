/**
 * OmniLLM Studio - Universal LLM Diagnostic & Testing Controller
 * Strict compliance: Zero emojis, zero sparkles, zero wands.
 */

const PROVIDER_PRESETS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    endpointHint: 'Endpoint: https://api.openai.com/v1/chat/completions',
    keyHint: 'Format: starts with sk-... Held in memory/browser.',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'gpt-4-turbo']
  },
  claude: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    endpointHint: 'Endpoint: https://api.anthropic.com/v1/messages',
    keyHint: 'Format: starts with sk-ant-... Handled via proxy to avoid CORS.',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ]
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    endpointHint: 'Endpoint: Google Generative Language OpenAI compatibility layer',
    keyHint: 'Format: starts with AIzaSy... API key from Google AI Studio.',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    endpointHint: 'Endpoint: https://api.deepseek.com/v1/chat/completions',
    keyHint: 'DeepSeek API Platform key.',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  groq: {
    name: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    endpointHint: 'Endpoint: https://api.groq.com/openai/v1/chat/completions',
    keyHint: 'Format: starts with gsk_... Ultra fast inference.',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    endpointHint: 'Endpoint: https://openrouter.ai/api/v1/chat/completions',
    keyHint: 'Universal API gateway key (sk-or-...).',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: ['anthropic/claude-3.5-sonnet', 'deepseek/deepseek-r1', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct']
  },
  ollama: {
    name: 'Ollama (Localhost)',
    baseUrl: 'http://localhost:11434/v1',
    endpointHint: 'Endpoint: http://localhost:11434/v1/chat/completions',
    keyHint: 'Local model server. API key is optional.',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'deepseek-r1', 'phi3']
  },
  lmstudio: {
    name: 'LM Studio (Localhost)',
    baseUrl: 'http://localhost:1234/v1',
    endpointHint: 'Endpoint: http://localhost:1234/v1/chat/completions',
    keyHint: 'Local inference server. API key is not required.',
    defaultModel: 'local-model',
    models: ['local-model']
  },
  custom: {
    name: 'Custom Endpoint',
    baseUrl: 'http://localhost:8000/v1',
    endpointHint: 'Custom OpenAI-compatible /chat/completions target',
    keyHint: 'Bearer token or custom API key as needed.',
    defaultModel: 'custom-model',
    models: ['custom-model']
  }
};

// Application State
const state = {
  provider: 'openai',
  apiKey: '',
  baseUrl: PROVIDER_PRESETS.openai.baseUrl,
  model: PROVIDER_PRESETS.openai.defaultModel,
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
  systemPrompt: '',
  history: [],
  isExecuting: false,
  savedKeys: {},
  lastRunDetails: null
};

// DOM Elements
const elements = {
  providerSelect: document.getElementById('providerSelect'),
  baseUrlInput: document.getElementById('baseUrlInput'),
  resetUrlBtn: document.getElementById('resetUrlBtn'),
  endpointHint: document.getElementById('endpointHint'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveKeyCheck: document.getElementById('saveKeyCheck'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  keyHint: document.getElementById('keyHint'),
  modelInput: document.getElementById('modelInput'),
  modelChipsContainer: document.getElementById('modelChipsContainer'),
  paramsToggle: document.getElementById('paramsToggle'),
  paramsArrow: document.getElementById('paramsArrow'),
  paramsBody: document.getElementById('paramsBody'),
  tempSlider: document.getElementById('tempSlider'),
  tempValue: document.getElementById('tempValue'),
  maxTokensInput: document.getElementById('maxTokensInput'),
  maxTokensValue: document.getElementById('maxTokensValue'),
  streamToggle: document.getElementById('streamToggle'),
  systemPromptInput: document.getElementById('systemPromptInput'),
  userPromptInput: document.getElementById('userPromptInput'),
  charCount: document.getElementById('charCount'),
  clearPromptBtn: document.getElementById('clearPromptBtn'),
  submitPromptBtn: document.getElementById('submitPromptBtn'),
  submitBtnText: document.getElementById('submitBtnText'),
  runReadyTestBtn: document.getElementById('runReadyTestBtn'),
  statusBadge: document.getElementById('statusBadge'),
  latencyValue: document.getElementById('latencyValue'),
  tokensValue: document.getElementById('tokensValue'),
  totalTokensValue: document.getElementById('totalTokensValue'),
  renderedOutput: document.getElementById('renderedOutput'),
  rawJsonViewer: document.getElementById('rawJsonViewer'),
  curlViewer: document.getElementById('curlViewer'),
  detailsGrid: document.getElementById('detailsGrid'),
  detailUrl: document.getElementById('detailUrl'),
  detailProvider: document.getElementById('detailProvider'),
  detailModel: document.getElementById('detailModel'),
  detailHttpCode: document.getElementById('detailHttpCode'),
  detailMode: document.getElementById('detailMode'),
  detailTimestamp: document.getElementById('detailTimestamp'),
  historyList: document.getElementById('historyList'),
  historyCount: document.getElementById('historyCount'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  copyRenderedBtn: document.getElementById('copyRenderedBtn'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  copyCurlBtn: document.getElementById('copyCurlBtn'),
  toastContainer: document.getElementById('toastContainer'),
  serverStatusBadge: document.getElementById('serverStatusBadge'),
  serverStatusText: document.getElementById('serverStatusText')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedPreferences();
  bindEventListeners();
  updateProviderUI(state.provider);
  checkServerHealth();
});

// Load preferences from localStorage
function loadSavedPreferences() {
  try {
    const savedKeys = localStorage.getItem('omnilm_api_keys');
    if (savedKeys) {
      state.savedKeys = JSON.parse(savedKeys);
    }
    const savedConfig = localStorage.getItem('omnilm_last_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.provider && PROVIDER_PRESETS[config.provider]) {
        state.provider = config.provider;
        elements.providerSelect.value = config.provider;
      }
      if (config.temperature !== undefined) {
        state.temperature = config.temperature;
        elements.tempSlider.value = config.temperature;
        elements.tempValue.textContent = config.temperature;
      }
      if (config.maxTokens !== undefined) {
        state.maxTokens = config.maxTokens;
        elements.maxTokensInput.value = config.maxTokens;
        elements.maxTokensValue.textContent = config.maxTokens;
      }
      if (config.stream !== undefined) {
        state.stream = config.stream;
        elements.streamToggle.checked = config.stream;
      }
    }
    const savedSaveKeyCheck = localStorage.getItem('omnilm_save_keys_enabled');
    if (savedSaveKeyCheck === 'true') {
      elements.saveKeyCheck.checked = true;
    }
  } catch (e) {
    console.warn('Error loading localStorage preferences:', e);
  }
}

// Bind all DOM events
function bindEventListeners() {
  // Provider Select Change
  elements.providerSelect.addEventListener('change', (e) => {
    state.provider = e.target.value;
    updateProviderUI(state.provider);
    saveConfigPreference();
  });

  // Base URL Change
  elements.baseUrlInput.addEventListener('input', (e) => {
    state.baseUrl = e.target.value;
    updateCurlPreview();
  });

  // Reset Base URL Button
  elements.resetUrlBtn.addEventListener('click', () => {
    const preset = PROVIDER_PRESETS[state.provider];
    if (preset) {
      elements.baseUrlInput.value = preset.baseUrl;
      state.baseUrl = preset.baseUrl;
      updateCurlPreview();
      showToast('Base URL reset to default', 'info');
    }
  });

  // API Key Change
  elements.apiKeyInput.addEventListener('input', (e) => {
    state.apiKey = e.target.value;
    if (elements.saveKeyCheck.checked) {
      state.savedKeys[state.provider] = state.apiKey;
      localStorage.setItem('omnilm_api_keys', JSON.stringify(state.savedKeys));
    }
    updateCurlPreview();
  });

  // Save Key Checkbox
  elements.saveKeyCheck.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('omnilm_save_keys_enabled', isChecked ? 'true' : 'false');
    if (isChecked) {
      state.savedKeys[state.provider] = state.apiKey;
      localStorage.setItem('omnilm_api_keys', JSON.stringify(state.savedKeys));
      showToast('Key saved locally in browser storage', 'info');
    } else {
      delete state.savedKeys[state.provider];
      localStorage.setItem('omnilm_api_keys', JSON.stringify(state.savedKeys));
      showToast('Key removed from browser storage', 'info');
    }
  });

  // Toggle Password Visibility
  elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
    const currentType = elements.apiKeyInput.getAttribute('type');
    const newType = currentType === 'password' ? 'text' : 'password';
    elements.apiKeyInput.setAttribute('type', newType);
  });

  // Model Input Change
  elements.modelInput.addEventListener('input', (e) => {
    state.model = e.target.value;
    updateModelChipSelection();
    updateCurlPreview();
  });

  // Parameters Accordion
  elements.paramsToggle.addEventListener('click', () => {
    const isCollapsed = elements.paramsBody.classList.toggle('collapsed');
    elements.paramsArrow.classList.toggle('rotated', !isCollapsed);
  });

  // Temperature Slider
  elements.tempSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.temperature = val;
    elements.tempValue.textContent = val.toFixed(1);
    saveConfigPreference();
    updateCurlPreview();
  });

  // Max Tokens Input
  elements.maxTokensInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) || 2048;
    state.maxTokens = val;
    elements.maxTokensValue.textContent = val;
    saveConfigPreference();
    updateCurlPreview();
  });

  // Stream Toggle
  elements.streamToggle.addEventListener('change', (e) => {
    state.stream = e.target.checked;
    saveConfigPreference();
    updateCurlPreview();
  });

  // System Prompt Input
  elements.systemPromptInput.addEventListener('input', (e) => {
    state.systemPrompt = e.target.value;
    updateCurlPreview();
  });

  // User Prompt Input
  elements.userPromptInput.addEventListener('input', (e) => {
    const text = e.target.value;
    elements.charCount.textContent = `${text.length} chars`;
    updateCurlPreview();
  });

  // Shortcut: Ctrl+Enter to execute prompt
  elements.userPromptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executePromptRequest();
    }
  });

  // Quick-test Ready-made Button: "Test: What is life?"
  elements.runReadyTestBtn.addEventListener('click', () => {
    elements.userPromptInput.value = 'What is life?';
    elements.charCount.textContent = '14 chars';
    executePromptRequest();
  });

  // Submit Prompt Button
  elements.submitPromptBtn.addEventListener('click', () => {
    executePromptRequest();
  });

  // Clear Prompt Button
  elements.clearPromptBtn.addEventListener('click', () => {
    elements.userPromptInput.value = '';
    elements.charCount.textContent = '0 chars';
    elements.userPromptInput.focus();
    updateCurlPreview();
  });

  // Sample prompt chips in console
  document.querySelectorAll('.sample-prompts .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-fill');
      elements.userPromptInput.value = text;
      elements.charCount.textContent = `${text.length} chars`;
      updateCurlPreview();
    });
  });

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');
    });
  });

  // Copy Buttons
  elements.copyRenderedBtn.addEventListener('click', () => {
    const text = elements.renderedOutput.innerText;
    copyToClipboard(text, 'Output copied to clipboard');
  });

  elements.copyJsonBtn.addEventListener('click', () => {
    const text = elements.rawJsonViewer.textContent;
    copyToClipboard(text, 'JSON copied to clipboard');
  });

  elements.copyCurlBtn.addEventListener('click', () => {
    const text = elements.curlViewer.textContent;
    copyToClipboard(text, 'cURL command copied to clipboard');
  });

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    renderHistory();
    showToast('History cleared', 'info');
  });
}

// Update UI when provider changes
function updateProviderUI(providerKey) {
  const preset = PROVIDER_PRESETS[providerKey] || PROVIDER_PRESETS.custom;

  // Update Base URL
  elements.baseUrlInput.value = preset.baseUrl;
  state.baseUrl = preset.baseUrl;

  // Update Hints
  elements.endpointHint.textContent = preset.endpointHint;
  elements.keyHint.textContent = preset.keyHint;

  // Restore API key if saved
  if (state.savedKeys[providerKey]) {
    elements.apiKeyInput.value = state.savedKeys[providerKey];
    state.apiKey = state.savedKeys[providerKey];
  } else {
    elements.apiKeyInput.value = '';
    state.apiKey = '';
  }

  // Update Model
  elements.modelInput.value = preset.defaultModel;
  state.model = preset.defaultModel;

  // Render Model Preset Chips
  renderModelChips(preset.models);

  // Update cURL preview
  updateCurlPreview();
}

// Render model preset chips
function renderModelChips(models) {
  elements.modelChipsContainer.innerHTML = '';
  if (!models || models.length === 0) return;

  models.forEach(modelName => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (modelName === state.model ? ' active' : '');
    chip.textContent = modelName;
    chip.addEventListener('click', () => {
      elements.modelInput.value = modelName;
      state.model = modelName;
      updateModelChipSelection();
      updateCurlPreview();
    });
    elements.modelChipsContainer.appendChild(chip);
  });
}

function updateModelChipSelection() {
  const chips = elements.modelChipsContainer.querySelectorAll('.chip');
  chips.forEach(chip => {
    if (chip.textContent === elements.modelInput.value.trim()) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function saveConfigPreference() {
  try {
    const config = {
      provider: state.provider,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      stream: state.stream
    };
    localStorage.setItem('omnilm_last_config', JSON.stringify(config));
  } catch (e) {
    // Ignore storage errors
  }
}

// Check server health
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      elements.serverStatusBadge.querySelector('.status-dot').classList.remove('offline');
      elements.serverStatusText.textContent = 'Server: Online';
    } else {
      throw new Error('Server returned non-200');
    }
  } catch {
    elements.serverStatusBadge.querySelector('.status-dot').classList.add('offline');
    elements.serverStatusText.textContent = 'Server: Offline';
  }
}

// Execute prompt request
async function executePromptRequest() {
  if (state.isExecuting) return;

  const promptText = elements.userPromptInput.value.trim();
  if (!promptText) {
    showToast('Please enter a prompt or use "Test: What is life?"', 'error');
    elements.userPromptInput.focus();
    return;
  }

  const modelName = elements.modelInput.value.trim();
  if (!modelName) {
    showToast('Please enter or select a model name', 'error');
    elements.modelInput.focus();
    return;
  }

  const apiKey = elements.apiKeyInput.value.trim();
  const provider = state.provider;

  // Validation warnings for providers requiring keys
  if (['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(provider) && !apiKey) {
    showToast(`Note: ${PROVIDER_PRESETS[provider].name} requires an API key. Testing without key may return 401.`, 'error');
  }

  // Update State & UI for Execution
  setExecutionState(true);
  updateStatusBadge('loading', 'REQUESTING...');
  elements.latencyValue.textContent = 'Measuring...';
  elements.tokensValue.textContent = '-- / --';
  elements.totalTokensValue.textContent = '--';
  elements.renderedOutput.innerHTML = '<div class="placeholder-state"><p>Connecting to endpoint and awaiting response stream...</p></div>';
  elements.rawJsonViewer.textContent = '// Awaiting payload...';

  const startTime = Date.now();
  let latencyTimer = setInterval(() => {
    elements.latencyValue.textContent = `${Date.now() - startTime} ms`;
  }, 50);

  // Prepare payload
  const messages = [];
  if (state.systemPrompt && state.systemPrompt.trim()) {
    messages.push({ role: 'system', content: state.systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: promptText });

  const requestBody = {
    provider,
    baseUrl: elements.baseUrlInput.value.trim(),
    apiKey,
    model: modelName,
    messages,
    temperature: state.temperature,
    maxTokens: state.maxTokens,
    stream: state.stream
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');

    if (isSSE && response.ok) {
      await handleStreamResponse(response, startTime, latencyTimer, promptText);
    } else {
      await handleJsonResponse(response, startTime, latencyTimer, promptText);
    }
  } catch (err) {
    clearInterval(latencyTimer);
    const finalLatency = Date.now() - startTime;
    elements.latencyValue.textContent = `${finalLatency} ms`;
    updateStatusBadge('error', 'CLIENT ERROR');
    renderErrorOutput(`Network or Client Error: ${err.message}`);
    logHistoryItem({
      prompt: promptText,
      model: modelName,
      status: 'ERR',
      statusCode: 0,
      latency: finalLatency,
      success: false
    });
    showToast(`Execution failed: ${err.message}`, 'error');
  } finally {
    setExecutionState(false);
  }
}

// Handle Server-Sent Events (Streaming)
async function handleStreamResponse(response, startTime, latencyTimer, promptText) {
  updateStatusBadge('loading', 'STREAMING...');
  elements.renderedOutput.innerHTML = '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';
  let usageData = null;
  let finalLatency = 0;
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
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const payload = JSON.parse(jsonStr);
          if (payload.text) {
            accumulatedText += payload.text;
            renderMarkdown(accumulatedText);
          }
          if (payload.usage) {
            usageData = payload.usage;
          }
          if (payload.done) {
            finalLatency = payload.latency || (Date.now() - startTime);
          }
          if (payload.error) {
            throw new Error(payload.error);
          }
        } catch (e) {
          // Ignore parse errors on chunk
        }
      }
    }
  } finally {
    clearInterval(latencyTimer);
  }

  finalLatency = finalLatency || (Date.now() - startTime);
  elements.latencyValue.textContent = `${finalLatency} ms`;
  updateStatusBadge('success', '200 OK (STREAM)');

  if (usageData) {
    updateTokensUI(usageData);
  } else {
    // Approximate completion tokens if not provided
    const approxTokens = Math.ceil(accumulatedText.split(/\s+/).length * 1.3);
    elements.tokensValue.textContent = `-- / ~${approxTokens}`;
    elements.totalTokensValue.textContent = `~${approxTokens}`;
  }

  // Update raw JSON preview
  elements.rawJsonViewer.textContent = JSON.stringify({
    success: true,
    model: state.model,
    streamedContent: accumulatedText,
    latencyMs: finalLatency,
    usage: usageData
  }, null, 2);

  // Update Diagnostic metadata
  updateDiagnosticDetails(200, 'Streaming SSE', finalLatency);

  // Record History
  logHistoryItem({
    prompt: promptText,
    model: state.model,
    status: '200 OK',
    statusCode: 200,
    latency: finalLatency,
    success: true,
    content: accumulatedText
  });

  showToast('Response received successfully', 'success');
}

// Handle non-streaming JSON response
async function handleJsonResponse(response, startTime, latencyTimer, promptText) {
  clearInterval(latencyTimer);
  const data = await response.json().catch(() => ({ error: 'Unable to parse server JSON response' }));
  const latency = data.latency || (Date.now() - startTime);
  elements.latencyValue.textContent = `${latency} ms`;

  // Display raw JSON
  elements.rawJsonViewer.textContent = JSON.stringify(data, null, 2);

  if (response.ok && data.success) {
    updateStatusBadge('success', `${data.status || 200} OK`);
    renderMarkdown(data.content || '(Empty content returned)');
    if (data.usage) {
      updateTokensUI(data.usage);
    }
    updateDiagnosticDetails(data.status || 200, 'Non-Streaming JSON', latency);

    logHistoryItem({
      prompt: promptText,
      model: data.model || state.model,
      status: `${data.status || 200} OK`,
      statusCode: data.status || 200,
      latency,
      success: true,
      content: data.content
    });

    showToast('Response completed successfully', 'success');
  } else {
    const statusCode = data.status || response.status;
    updateStatusBadge('error', `ERROR ${statusCode}`);
    const errorMessage = data.error || data.statusText || 'Unknown error occurred.';
    renderErrorOutput(`HTTP ${statusCode} Error from ${state.provider}:\n\n${errorMessage}\n\nEndpoint: ${data.endpoint || elements.baseUrlInput.value}`);
    updateDiagnosticDetails(statusCode, 'Error Response', latency);

    logHistoryItem({
      prompt: promptText,
      model: state.model,
      status: `ERR ${statusCode}`,
      statusCode,
      latency,
      success: false,
      error: errorMessage
    });

    showToast(`Error ${statusCode}: ${errorMessage.slice(0, 60)}...`, 'error');
  }
}

// Markdown parser & renderer
function renderMarkdown(content) {
  if (window.marked) {
    try {
      elements.renderedOutput.innerHTML = marked.parse(content);
      return;
    } catch {
      // Fallback
    }
  }
  elements.renderedOutput.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
}

function renderErrorOutput(message) {
  elements.renderedOutput.innerHTML = `
    <div style="color: #f87171; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 16px; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">
${escapeHtml(message)}
    </div>
  `;
}

// Update Token Counters
function updateTokensUI(usage) {
  const pTokens = usage.prompt_tokens ?? usage.promptTokens ?? usage.input_tokens ?? '--';
  const cTokens = usage.completion_tokens ?? usage.completionTokens ?? usage.output_tokens ?? '--';
  const tTokens = usage.total_tokens ?? usage.totalTokens ?? (pTokens !== '--' && cTokens !== '--' ? Number(pTokens) + Number(cTokens) : '--');

  elements.tokensValue.textContent = `${pTokens} / ${cTokens}`;
  elements.totalTokensValue.textContent = `${tTokens}`;
}

// Update Status Badge UI
function updateStatusBadge(type, text) {
  elements.statusBadge.className = `diag-badge ${type}`;
  elements.statusBadge.textContent = text;
}

// Set loading / execution state
function setExecutionState(isExecuting) {
  state.isExecuting = isExecuting;
  elements.submitPromptBtn.disabled = isExecuting;
  elements.runReadyTestBtn.disabled = isExecuting;
  elements.submitBtnText.textContent = isExecuting ? 'Running...' : 'Send Request';
}

// Update Diagnostic Details Pane
function updateDiagnosticDetails(httpCode, mode, latency) {
  elements.detailUrl.textContent = elements.baseUrlInput.value.trim();
  elements.detailProvider.textContent = PROVIDER_PRESETS[state.provider]?.name || state.provider;
  elements.detailModel.textContent = elements.modelInput.value.trim();
  elements.detailHttpCode.textContent = httpCode;
  elements.detailMode.textContent = mode;
  elements.detailTimestamp.textContent = new Date().toLocaleTimeString();
}

// Dynamically generate copyable cURL command
function updateCurlPreview() {
  const provider = state.provider;
  const baseUrl = elements.baseUrlInput.value.trim();
  const model = elements.modelInput.value.trim() || 'gpt-4o';
  const apiKey = elements.apiKeyInput.value.trim() || 'YOUR_API_KEY';
  const prompt = elements.userPromptInput.value.trim() || 'What is life?';

  let curl = '';

  if (provider === 'claude') {
    curl = `curl https://api.anthropic.com/v1/messages \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${model}",
    "max_tokens": ${state.maxTokens},
    "messages": [
      {"role": "user", "content": ${JSON.stringify(prompt)}}
    ]
  }'`;
  } else {
    const endpoint = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    curl = `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": ${JSON.stringify(prompt)}}
    ],
    "temperature": ${state.temperature},
    "max_tokens": ${state.maxTokens}
  }'`;
  }

  elements.curlViewer.textContent = curl;
}

// Test History management
function logHistoryItem(item) {
  item.time = new Date().toLocaleTimeString();
  state.history.unshift(item);
  if (state.history.length > 25) {
    state.history.pop();
  }
  renderHistory();
}

function renderHistory() {
  elements.historyCount.textContent = state.history.length;
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<div class="empty-history">No tests executed yet</div>';
    return;
  }

  elements.historyList.innerHTML = '';
  state.history.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span class="history-model" title="${escapeHtml(item.prompt)}">${escapeHtml(item.model)}</span>
      <span class="history-status-tag ${item.success ? 'success' : 'error'}">${item.status} (${item.latency}ms)</span>
    `;
    div.addEventListener('click', () => {
      elements.userPromptInput.value = item.prompt;
      elements.charCount.textContent = `${item.prompt.length} chars`;
      elements.modelInput.value = item.model;
      if (item.content) {
        renderMarkdown(item.content);
        updateStatusBadge('success', item.status);
      }
      showToast(`Restored prompt for ${item.model}`, 'info');
    });
    elements.historyList.appendChild(div);
  });
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

// Copy to clipboard helper
function copyToClipboard(text, successMessage) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage, 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// HTML escape helper
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
