/**
 * OmniLLM Studio - Universal LLM Diagnostic & Testing Controller
 * Strict compliance: Zero emojis, zero sparkles, zero wands.
 * Themes: Cream Latte and Creamy Espresso with strict square-edge design tokens.
 */

const PROVIDER_PRESETS = {
  custom: {
    name: 'Custom OpenAI-Compatible',
    baseUrl: 'http://localhost:8000/v1',
    endpointHint: 'Endpoint: http://localhost:8000/v1/chat/completions (OpenAI Compatible)',
    keyHint: 'Bearer token or custom API key as needed.',
    defaultModel: 'custom-model',
    models: ['custom-model', 'gpt-4o', 'llama-3.3-70b', 'deepseek-r1']
  },
  custom_anthropic: {
    name: 'Custom Anthropic-Compatible',
    baseUrl: 'http://localhost:8000',
    endpointHint: 'Endpoint: http://localhost:8000/v1/messages (Anthropic Messages API)',
    keyHint: 'Anthropic API key / Bearer token for custom proxy.',
    defaultModel: 'claude-3-5-sonnet',
    models: ['claude-3-5-sonnet', 'claude-3-7-sonnet', 'custom-model']
  },
  openai: {
    name: 'OpenAI (Official)',
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
    baseUrl: 'http://127.0.0.1:11434/v1',
    endpointHint: 'Endpoint: http://127.0.0.1:11434/v1/chat/completions (Ollama API)',
    keyHint: 'Local model server. API key is optional.',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'deepseek-r1', 'phi3']
  },
  lmstudio: {
    name: 'LM Studio (Localhost)',
    baseUrl: 'http://127.0.0.1:1234/v1',
    endpointHint: 'Endpoint: http://127.0.0.1:1234/v1/chat/completions (LM Studio Local Server)',
    keyHint: 'LM Studio runs locally without API key (leave blank). Start server in Developer tab.',
    defaultModel: 'local-model',
    models: ['local-model']
  }
};

// Application State
const state = {
  provider: 'custom',
  apiKey: '',
  baseUrl: PROVIDER_PRESETS.custom.baseUrl,
  model: PROVIDER_PRESETS.custom.defaultModel,
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
  systemPrompt: '',
  timeout: 60,
  activeAbortController: null,
  activeReader: null,
  latencyTimer: null,
  activeArenaAbortA: null,
  activeArenaAbortB: null,
  activeArenaReaderA: null,
  activeArenaReaderB: null,
  activeChatAbort: null,
  activeChatReader: null,
  history: [],
  isExecuting: false,
  savedKeys: {},
  lastRunDetails: null,

  // Studio Extensions
  currentMode: 'playground', // 'playground' | 'arena' | 'chat'
  customHeaders: {},
  toolsEnabled: false,
  toolsSchema: '',
  chatMessages: [],
  isArenaExecuting: false,
  isChatExecuting: false,
  lastUpstreamHeaders: null,
  lastReasoningText: ''
};

// DOM Elements Mapping
const elements = {
  // Top Header & Status
  themeSelect: document.getElementById('themeSelect'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  serverStatusBadge: document.getElementById('serverStatusBadge'),
  serverStatusText: document.getElementById('serverStatusText'),
  toastContainer: document.getElementById('toastContainer'),

  // Config Sidebar
  providerSelect: document.getElementById('providerSelect'),
  baseUrlInput: document.getElementById('baseUrlInput'),
  resetUrlBtn: document.getElementById('resetUrlBtn'),
  endpointHint: document.getElementById('endpointHint'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveKeyCheck: document.getElementById('saveKeyCheck'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  keyHint: document.getElementById('keyHint'),
  modelInput: document.getElementById('modelInput'),
  detectModelsBtn: document.getElementById('detectModelsBtn'),
  modelChipsContainer: document.getElementById('modelChipsContainer'),
  localModelStatusBar: document.getElementById('localModelStatusBar'),
  modelStatusIndicator: document.getElementById('modelStatusIndicator'),
  modelStatusLabel: document.getElementById('modelStatusLabel'),
  loadModelBtn: document.getElementById('loadModelBtn'),
  ejectModelBtn: document.getElementById('ejectModelBtn'),
  paramsToggle: document.getElementById('paramsToggle'),
  paramsArrow: document.getElementById('paramsArrow'),
  paramsBody: document.getElementById('paramsBody'),
  tempSlider: document.getElementById('tempSlider'),
  tempValue: document.getElementById('tempValue'),
  maxTokensInput: document.getElementById('maxTokensInput'),
  maxTokensValue: document.getElementById('maxTokensValue'),
  streamToggle: document.getElementById('streamToggle'),
  timeoutSelect: document.getElementById('timeoutSelect'),
  timeoutValue: document.getElementById('timeoutValue'),
  systemPromptInput: document.getElementById('systemPromptInput'),

  // Drawer Triggers in Sidebar
  openHeadersDrawerBtn: document.getElementById('openHeadersDrawerBtn'),
  headersBadgeCount: document.getElementById('headersBadgeCount'),
  openToolsDrawerBtn: document.getElementById('openToolsDrawerBtn'),
  toolsBadgeCount: document.getElementById('toolsBadgeCount'),

  // Mode 1: Playground Elements
  userPromptInput: document.getElementById('userPromptInput'),
  charCount: document.getElementById('charCount'),
  clearPromptBtn: document.getElementById('clearPromptBtn'),
  stopPromptBtn: document.getElementById('stopPromptBtn'),
  submitPromptBtn: document.getElementById('submitPromptBtn'),
  submitBtnText: document.getElementById('submitBtnText'),
  runReadyTestBtn: document.getElementById('runReadyTestBtn'),

  // Diagnostics & Results Bar
  statusBadge: document.getElementById('statusBadge'),
  latencyValue: document.getElementById('latencyValue'),
  tokensValue: document.getElementById('tokensValue'),
  totalTokensValue: document.getElementById('totalTokensValue'),
  tpsValue: document.getElementById('tpsValue'),

  // Result Tabs & Content
  renderedOutput: document.getElementById('renderedOutput'),
  reasoningTabBtn: document.getElementById('reasoningTabBtn'),
  reasoningOutput: document.getElementById('reasoningOutput'),
  copyReasoningBtn: document.getElementById('copyReasoningBtn'),
  statPromptTokens: document.getElementById('statPromptTokens'),
  statCompletionTokens: document.getElementById('statCompletionTokens'),
  statTps: document.getElementById('statTps'),
  statTtft: document.getElementById('statTtft'),
  rawJsonViewer: document.getElementById('rawJsonViewer'),
  curlViewer: document.getElementById('curlViewer'),
  headersViewerContainer: document.getElementById('headersViewerContainer'),
  copyHeadersBtn: document.getElementById('copyHeadersBtn'),
  detailsGrid: document.getElementById('detailsGrid'),
  detailUrl: document.getElementById('detailUrl'),
  detailProvider: document.getElementById('detailProvider'),
  detailModel: document.getElementById('detailModel'),
  detailHttpCode: document.getElementById('detailHttpCode'),
  detailMode: document.getElementById('detailMode'),
  detailTimestamp: document.getElementById('detailTimestamp'),
  copyRenderedBtn: document.getElementById('copyRenderedBtn'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  copyCurlBtn: document.getElementById('copyCurlBtn'),

  // History
  historyList: document.getElementById('historyList'),
  historyCount: document.getElementById('historyCount'),

  // Mode 2: A/B Arena Elements
  arenaPromptInput: document.getElementById('arenaPromptInput'),
  runArenaBtn: document.getElementById('runArenaBtn'),
  arenaSummaryBanner: document.getElementById('arenaSummaryBanner'),
  arenaSummaryText: document.getElementById('arenaSummaryText'),
  arenaSummaryTags: document.getElementById('arenaSummaryTags'),
  // Model A
  arenaCardA: document.getElementById('arenaCardA'),
  arenaModelAName: document.getElementById('arenaModelAName'),
  arenaToggleAdvancedA: document.getElementById('arenaToggleAdvancedA'),
  arenaStatusA: document.getElementById('arenaStatusA'),
  arenaModelAProvider: document.getElementById('arenaModelAProvider'),
  arenaModelAInput: document.getElementById('arenaModelAInput'),
  arenaAdvancedPanelA: document.getElementById('arenaAdvancedPanelA'),
  arenaKeyA: document.getElementById('arenaKeyA'),
  arenaUrlA: document.getElementById('arenaUrlA'),
  arenaChipsA: document.getElementById('arenaChipsA'),
  arenaOutputA: document.getElementById('arenaOutputA'),
  arenaTtftA: document.getElementById('arenaTtftA'),
  arenaLatencyA: document.getElementById('arenaLatencyA'),
  arenaTpsA: document.getElementById('arenaTpsA'),
  arenaTokensA: document.getElementById('arenaTokensA'),
  // Model B
  arenaCardB: document.getElementById('arenaCardB'),
  arenaModelBName: document.getElementById('arenaModelBName'),
  arenaToggleAdvancedB: document.getElementById('arenaToggleAdvancedB'),
  arenaStatusB: document.getElementById('arenaStatusB'),
  arenaModelBProvider: document.getElementById('arenaModelBProvider'),
  arenaModelBInput: document.getElementById('arenaModelBInput'),
  arenaAdvancedPanelB: document.getElementById('arenaAdvancedPanelB'),
  arenaKeyB: document.getElementById('arenaKeyB'),
  arenaUrlB: document.getElementById('arenaUrlB'),
  arenaChipsB: document.getElementById('arenaChipsB'),
  arenaOutputB: document.getElementById('arenaOutputB'),
  arenaTtftB: document.getElementById('arenaTtftB'),
  arenaLatencyB: document.getElementById('arenaLatencyB'),
  arenaTpsB: document.getElementById('arenaTpsB'),
  arenaTokensB: document.getElementById('arenaTokensB'),

  // Mode 3: Chat Thread Elements
  chatTurnCount: document.getElementById('chatTurnCount'),
  exportChatBtn: document.getElementById('exportChatBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  chatMessagesStream: document.getElementById('chatMessagesStream'),
  chatSystemPill: document.getElementById('chatSystemPill'),
  chatSystemText: document.getElementById('chatSystemText'),
  emptyChatPlaceholder: document.getElementById('emptyChatPlaceholder'),
  chatInputText: document.getElementById('chatInputText'),
  chatSendBtn: document.getElementById('chatSendBtn'),

  // Drawers
  drawerOverlay: document.getElementById('drawerOverlay'),
  headersDrawer: document.getElementById('headersDrawer'),
  closeHeadersDrawerBtn: document.getElementById('closeHeadersDrawerBtn'),
  headersListContainer: document.getElementById('headersListContainer'),
  addHeaderRowBtn: document.getElementById('addHeaderRowBtn'),
  clearAllHeadersBtn: document.getElementById('clearAllHeadersBtn'),
  saveHeadersBtn: document.getElementById('saveHeadersBtn'),
  toolsDrawer: document.getElementById('toolsDrawer'),
  closeToolsDrawerBtn: document.getElementById('closeToolsDrawerBtn'),
  toolsEnableToggle: document.getElementById('toolsEnableToggle'),
  templateWeatherBtn: document.getElementById('templateWeatherBtn'),
  templateSqlBtn: document.getElementById('templateSqlBtn'),
  templateClearBtn: document.getElementById('templateClearBtn'),
  toolsSchemaTextarea: document.getElementById('toolsSchemaTextarea'),
  toolsValidationNotice: document.getElementById('toolsValidationNotice'),
  saveToolsBtn: document.getElementById('saveToolsBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedPreferences();
  bindEventListeners();
  initModeSwitcher();
  initDrawers();
  initChatThread();
  initArenaMode();
  updateProviderUI(state.provider);
  checkServerHealth();
});

// Theme Management
function setTheme(themeName, showNotification = false) {
  const validThemes = ['theme-cream-latte', 'theme-espresso'];
  const theme = validThemes.includes(themeName) ? themeName : 'theme-cream-latte';
  document.body.classList.remove('theme-cream-latte', 'theme-espresso', 'theme-oat', 'dark-theme');
  document.body.classList.add(theme);
  if (elements.themeSelect) {
    elements.themeSelect.value = theme;
  }
  try {
    localStorage.setItem('omnilm_theme', theme);
  } catch (e) {
    console.warn('Could not save theme preference:', e);
  }
  if (showNotification && elements.themeSelect) {
    const selectedOption = elements.themeSelect.options[elements.themeSelect.selectedIndex];
    if (selectedOption) {
      showToast(`Theme switched to ${selectedOption.text}`, 'info');
    }
  }
}

// Load preferences from localStorage
function loadSavedPreferences() {
  try {
    const savedTheme = localStorage.getItem('omnilm_theme') || 'theme-cream-latte';
    setTheme(savedTheme, false);

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

    // Load timeout setting
    const savedTimeout = localStorage.getItem('omnilm_timeout');
    if (savedTimeout !== null) {
      state.timeout = parseInt(savedTimeout, 10);
      if (elements.timeoutSelect) elements.timeoutSelect.value = state.timeout;
      if (elements.timeoutValue) elements.timeoutValue.textContent = state.timeout === 0 ? 'No limit' : `${state.timeout}s`;
    }

    // Load custom headers
    const savedHeaders = localStorage.getItem('omnilm_custom_headers');
    if (savedHeaders) {
      state.customHeaders = JSON.parse(savedHeaders);
      renderSavedHeaderRows();
      updateHeadersBadge();
    }

    // Load tools config
    const savedToolsEnabled = localStorage.getItem('omnilm_tools_enabled');
    if (savedToolsEnabled === 'true') {
      state.toolsEnabled = true;
      if (elements.toolsEnableToggle) elements.toolsEnableToggle.checked = true;
    }
    const savedToolsSchema = localStorage.getItem('omnilm_tools_schema');
    if (savedToolsSchema) {
      state.toolsSchema = savedToolsSchema;
      if (elements.toolsSchemaTextarea) elements.toolsSchemaTextarea.value = savedToolsSchema;
      validateToolsSchema(false);
    }
    updateToolsBadge();
  } catch (e) {
    console.warn('Error loading localStorage preferences:', e);
  }
}

// Bind all DOM events
function bindEventListeners() {
  // Theme Select Change
  if (elements.themeSelect) {
    elements.themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value, true);
    });
  }

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
    if (elements.arenaModelAName) {
      elements.arenaModelAName.textContent = state.model || 'Model A (Primary)';
    }
  });

  // Timeout Selector Change
  if (elements.timeoutSelect) {
    elements.timeoutSelect.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      state.timeout = val;
      if (elements.timeoutValue) {
        elements.timeoutValue.textContent = val === 0 ? 'No limit' : `${val}s`;
      }
      try {
        localStorage.setItem('omnilm_timeout', val);
      } catch (e) {}
    });
  }

  // Detect Models Button
  if (elements.detectModelsBtn) {
    elements.detectModelsBtn.addEventListener('click', detectModelsFromServer);
  }

  // Local Model Load / Eject Actions
  if (elements.loadModelBtn) {
    elements.loadModelBtn.addEventListener('click', loadSelectedModelIntoMemory);
  }
  if (elements.ejectModelBtn) {
    elements.ejectModelBtn.addEventListener('click', ejectSelectedModelFromMemory);
  }

  // Stop Request Button
  if (elements.stopPromptBtn) {
    elements.stopPromptBtn.addEventListener('click', () => {
      stopActiveExecution();
    });
  }

  // Parameters Accordion
  elements.paramsToggle.addEventListener('click', () => {
    const isCollapsed = elements.paramsBody.classList.toggle('collapsed');
    elements.paramsArrow.classList.toggle('rotated', !isCollapsed);
    if (!isCollapsed) {
      setTimeout(() => {
        elements.paramsToggle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
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
    if (elements.chatSystemText) {
      const sys = state.systemPrompt.trim();
      elements.chatSystemText.textContent = sys ? (sys.length > 60 ? sys.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
    }
  });

  // User Prompt Input
  elements.userPromptInput.addEventListener('input', (e) => {
    const text = e.target.value;
    elements.charCount.textContent = `${text.length} chars`;
    updateCurlPreview();
  });

  // Shortcut: Ctrl+Enter to execute prompt in Playground
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

  // Diagnostic Results Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.blur();
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

  if (elements.copyReasoningBtn) {
    elements.copyReasoningBtn.addEventListener('click', () => {
      const text = elements.reasoningOutput.innerText;
      copyToClipboard(text, 'Reasoning process copied to clipboard');
    });
  }

  elements.copyJsonBtn.addEventListener('click', () => {
    const text = elements.rawJsonViewer.textContent;
    copyToClipboard(text, 'JSON copied to clipboard');
  });

  elements.copyCurlBtn.addEventListener('click', () => {
    const text = elements.curlViewer.textContent;
    copyToClipboard(text, 'cURL command copied to clipboard');
  });

  if (elements.copyHeadersBtn) {
    elements.copyHeadersBtn.addEventListener('click', () => {
      if (!state.lastUpstreamHeaders) {
        showToast('No upstream headers captured yet', 'info');
        return;
      }
      copyToClipboard(JSON.stringify(state.lastUpstreamHeaders, null, 2), 'Headers JSON copied to clipboard');
    });
  }

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    renderHistory();
    showToast('History cleared', 'info');
  });
}

// ----------------------------------------------------
// Mode Switcher (Playground | A/B Arena | Chat Thread)
// ----------------------------------------------------
function initModeSwitcher() {
  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeViews = document.querySelectorAll('.mode-view');

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetMode = btn.getAttribute('data-mode');
      if (!targetMode) return;
      state.currentMode = targetMode;

      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      modeViews.forEach(v => v.classList.remove('active'));
      const activeView = document.getElementById(`${targetMode}ModeView`);
      if (activeView) activeView.classList.add('active');

      if (targetMode === 'arena') {
        syncArenaWithCurrentConfig();
      } else if (targetMode === 'chat') {
        if (elements.chatSystemText) {
          const sys = state.systemPrompt.trim();
          elements.chatSystemText.textContent = sys ? (sys.length > 60 ? sys.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
        }
      }
    });
  });
}

// ----------------------------------------------------
// Off-Canvas Drawers (Headers & Tools)
// ----------------------------------------------------
function initDrawers() {
  const overlay = elements.drawerOverlay;
  const headersDrawer = elements.headersDrawer;
  const toolsDrawer = elements.toolsDrawer;

  function closeAllDrawers() {
    if (headersDrawer) headersDrawer.classList.remove('open');
    if (toolsDrawer) toolsDrawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  // Headers Drawer Open/Close
  if (elements.openHeadersDrawerBtn) {
    elements.openHeadersDrawerBtn.addEventListener('click', () => {
      closeAllDrawers();
      if (headersDrawer) headersDrawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
    });
  }

  if (elements.closeHeadersDrawerBtn) {
    elements.closeHeadersDrawerBtn.addEventListener('click', closeAllDrawers);
  }

  // Tools Drawer Open/Close
  if (elements.openToolsDrawerBtn) {
    elements.openToolsDrawerBtn.addEventListener('click', () => {
      closeAllDrawers();
      if (toolsDrawer) toolsDrawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
    });
  }

  if (elements.closeToolsDrawerBtn) {
    elements.closeToolsDrawerBtn.addEventListener('click', closeAllDrawers);
  }

  if (overlay) {
    overlay.addEventListener('click', closeAllDrawers);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDrawers();
    }
  });

  // Headers row events
  if (elements.addHeaderRowBtn) {
    elements.addHeaderRowBtn.addEventListener('click', () => addHeaderRow('', ''));
  }

  if (elements.clearAllHeadersBtn) {
    elements.clearAllHeadersBtn.addEventListener('click', () => {
      if (elements.headersListContainer) elements.headersListContainer.innerHTML = '';
      state.customHeaders = {};
      updateHeadersBadge();
      saveHeadersPreference();
      showToast('All custom headers cleared', 'info');
    });
  }

  if (elements.saveHeadersBtn) {
    elements.saveHeadersBtn.addEventListener('click', () => {
      saveHeadersFromRows();
      closeAllDrawers();
      showToast('Custom headers applied and active', 'success');
    });
  }

  // Quick preset pills for headers
  document.querySelectorAll('.preset-pills-row .btn-chip[data-header-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-header-key');
      const val = btn.getAttribute('data-header-val');
      addHeaderRow(key, val);
    });
  });

  // Tools toggle and templates
  if (elements.toolsEnableToggle) {
    elements.toolsEnableToggle.addEventListener('change', (e) => {
      state.toolsEnabled = e.target.checked;
      updateToolsBadge();
      saveToolsPreference();
      showToast(state.toolsEnabled ? 'Function/Tools calling enabled' : 'Tools disabled', 'info');
    });
  }

  if (elements.templateWeatherBtn) {
    elements.templateWeatherBtn.addEventListener('click', () => {
      const weatherSchema = [
        {
          type: "function",
          function: {
            name: "get_current_weather",
            description: "Get the current weather in a given location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string", description: "City and state, e.g. San Francisco, CA" },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] }
              },
              required: ["location"]
            }
          }
        }
      ];
      if (elements.toolsSchemaTextarea) {
        elements.toolsSchemaTextarea.value = JSON.stringify(weatherSchema, null, 2);
        validateToolsSchema(true);
      }
    });
  }

  if (elements.templateSqlBtn) {
    elements.templateSqlBtn.addEventListener('click', () => {
      const sqlSchema = [
        {
          type: "function",
          function: {
            name: "query_database",
            description: "Execute a read-only SQL query against the analytical warehouse",
            parameters: {
              type: "object",
              properties: {
                sql: { type: "string", description: "The SELECT query to execute" }
              },
              required: ["sql"]
            }
          }
        }
      ];
      if (elements.toolsSchemaTextarea) {
        elements.toolsSchemaTextarea.value = JSON.stringify(sqlSchema, null, 2);
        validateToolsSchema(true);
      }
    });
  }

  if (elements.templateClearBtn) {
    elements.templateClearBtn.addEventListener('click', () => {
      if (elements.toolsSchemaTextarea) {
        elements.toolsSchemaTextarea.value = '';
        validateToolsSchema(true);
      }
    });
  }

  if (elements.saveToolsBtn) {
    elements.saveToolsBtn.addEventListener('click', () => {
      if (validateToolsSchema(true)) {
        state.toolsSchema = elements.toolsSchemaTextarea.value.trim();
        saveToolsPreference();
        closeAllDrawers();
        showToast('Tool schemas updated and saved', 'success');
      }
    });
  }

  if (elements.toolsSchemaTextarea) {
    elements.toolsSchemaTextarea.addEventListener('input', () => {
      validateToolsSchema(false);
    });
  }
}

function addHeaderRow(key = '', val = '') {
  if (!elements.headersListContainer) return;
  const row = document.createElement('div');
  row.className = 'header-row';
  row.innerHTML = `
    <input type="text" class="header-key-input" placeholder="Header Key (e.g. X-Custom-Auth)" value="${escapeHtml(key)}">
    <input type="text" class="header-val-input" placeholder="Header Value" value="${escapeHtml(val)}">
    <button type="button" class="btn-remove-header" title="Remove header">&times;</button>
  `;
  row.querySelector('.btn-remove-header').addEventListener('click', () => {
    row.remove();
    saveHeadersFromRows(false);
  });
  elements.headersListContainer.appendChild(row);
}

function renderSavedHeaderRows() {
  if (!elements.headersListContainer) return;
  elements.headersListContainer.innerHTML = '';
  for (const [key, val] of Object.entries(state.customHeaders)) {
    addHeaderRow(key, val);
  }
}

function saveHeadersFromRows(showNotification = false) {
  const rows = elements.headersListContainer ? elements.headersListContainer.querySelectorAll('.header-row') : [];
  const headers = {};
  rows.forEach(r => {
    const k = r.querySelector('.header-key-input')?.value.trim();
    const v = r.querySelector('.header-val-input')?.value.trim();
    if (k) {
      headers[k] = v || '';
    }
  });
  state.customHeaders = headers;
  updateHeadersBadge();
  saveHeadersPreference();
  if (showNotification) showToast('Headers updated', 'info');
}

function updateHeadersBadge() {
  const count = Object.keys(state.customHeaders).length;
  if (elements.headersBadgeCount) {
    elements.headersBadgeCount.textContent = count;
    elements.headersBadgeCount.classList.toggle('active', count > 0);
  }
}

function saveHeadersPreference() {
  try {
    localStorage.setItem('omnilm_custom_headers', JSON.stringify(state.customHeaders));
  } catch (e) {
    // Ignore storage errors
  }
}

function updateToolsBadge() {
  if (elements.toolsBadgeCount) {
    if (state.toolsEnabled) {
      elements.toolsBadgeCount.textContent = 'ON';
      elements.toolsBadgeCount.classList.add('active');
    } else {
      elements.toolsBadgeCount.textContent = 'OFF';
      elements.toolsBadgeCount.classList.remove('active');
    }
  }
}

function saveToolsPreference() {
  try {
    localStorage.setItem('omnilm_tools_enabled', state.toolsEnabled ? 'true' : 'false');
    localStorage.setItem('omnilm_tools_schema', state.toolsSchema || '');
  } catch (e) {
    // Ignore storage errors
  }
}

function validateToolsSchema(showToastOnError = false) {
  if (!elements.toolsSchemaTextarea || !elements.toolsValidationNotice) return true;
  const val = elements.toolsSchemaTextarea.value.trim();
  if (!val) {
    elements.toolsValidationNotice.textContent = 'Empty schema (No tools attached)';
    elements.toolsValidationNotice.className = 'schema-notice';
    return true;
  }
  try {
    const parsed = JSON.parse(val);
    if (!Array.isArray(parsed)) {
      throw new Error('Tools schema must be a top-level JSON array of tool objects');
    }
    elements.toolsValidationNotice.textContent = `Valid schema: ${parsed.length} function tool(s) defined`;
    elements.toolsValidationNotice.className = 'schema-notice valid';
    return true;
  } catch (err) {
    elements.toolsValidationNotice.textContent = `Invalid JSON: ${err.message}`;
    elements.toolsValidationNotice.className = 'schema-notice error';
    if (showToastOnError) {
      showToast(`Invalid tools JSON: ${err.message}`, 'error');
    }
    return false;
  }
}

// ----------------------------------------------------
// UI Sync & Provider Updates
// ----------------------------------------------------
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

  if (elements.arenaModelAName) {
    elements.arenaModelAName.textContent = state.model || 'Model A (Primary)';
  }
}

function renderModelChips(models) {
  elements.modelChipsContainer.innerHTML = '';
  if (!models || models.length === 0) {
    if (elements.localModelStatusBar) elements.localModelStatusBar.style.display = 'none';
    return;
  }

  models.forEach(item => {
    const modelObj = typeof item === 'string' ? { id: item, name: item, isLoaded: true } : item;
    const modelId = modelObj.id;
    const modelName = modelObj.name || modelObj.id;
    const isLoaded = Boolean(modelObj.isLoaded);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.modelId = modelId;
    chip.className = 'chip' + (modelId === state.model ? ' active' : '') + (isLoaded ? ' chip-loaded' : ' chip-ondisk');

    let labelHtml = escapeHtml(modelName);
    if (state.provider === 'lmstudio' || state.provider === 'ollama') {
      if (isLoaded) {
        labelHtml = `<span class="chip-status-tag loaded">READY</span> ${escapeHtml(modelName)}`;
      } else {
        labelHtml = `<span class="chip-status-tag ondisk">On Disk</span> ${escapeHtml(modelName)}`;
      }
    }
    chip.innerHTML = labelHtml;

    if (modelObj.size || modelObj.params || modelObj.quantization) {
      const details = [modelObj.params, modelObj.quantization, modelObj.size, isLoaded ? 'Active in Memory' : 'Stored on Disk'].filter(Boolean).join(' · ');
      chip.title = `${modelId} (${details})`;
    }

    chip.addEventListener('click', () => {
      elements.modelInput.value = modelId;
      state.model = modelId;
      updateModelChipSelection();
      updateCurlPreview();
      if (elements.arenaModelAName) {
        elements.arenaModelAName.textContent = modelId;
      }
    });
    elements.modelChipsContainer.appendChild(chip);
  });

  // Update status bar for current active model
  const currentModelId = elements.modelInput.value.trim() || state.model;
  const currentObj = models.find(m => (typeof m === 'string' ? m : m.id) === currentModelId);
  updateModelStatusUI(currentObj || (currentModelId ? { id: currentModelId, name: currentModelId, isLoaded: true } : null));
}

function updateModelChipSelection() {
  const currentVal = elements.modelInput.value.trim();
  const chips = elements.modelChipsContainer.querySelectorAll('.chip');
  chips.forEach(chip => {
    const chipId = chip.dataset.modelId || chip.textContent.trim();
    if (chipId === currentVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  const models = PROVIDER_PRESETS[state.provider]?.models || [];
  const currentObj = models.find(m => (typeof m === 'string' ? m : m.id) === currentVal);
  updateModelStatusUI(currentObj || (currentVal ? { id: currentVal, name: currentVal, isLoaded: true } : null));
}

function updateModelStatusUI(modelObj) {
  if (!elements.localModelStatusBar) return;

  const isLocalProvider = state.provider === 'lmstudio' || state.provider === 'ollama';
  if (!isLocalProvider || !modelObj) {
    elements.localModelStatusBar.style.display = 'none';
    return;
  }

  elements.localModelStatusBar.style.display = 'flex';
  const isLoaded = Boolean(modelObj.isLoaded);
  const name = modelObj.name || modelObj.id;

  if (isLoaded) {
    elements.modelStatusIndicator.className = 'model-status-indicator loaded';
    elements.modelStatusLabel.innerHTML = `<strong>${escapeHtml(name)}</strong> is <span style="color:#22c55e;font-weight:600;">ACTIVE IN MEMORY</span>`;
    if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
    if (elements.ejectModelBtn && state.provider === 'lmstudio') {
      elements.ejectModelBtn.style.display = 'inline-block';
      elements.ejectModelBtn.dataset.modelId = modelObj.id;
    } else if (elements.ejectModelBtn) {
      elements.ejectModelBtn.style.display = 'none';
    }
  } else {
    elements.modelStatusIndicator.className = 'model-status-indicator ondisk';
    elements.modelStatusLabel.innerHTML = `<strong>${escapeHtml(name)}</strong> is <span style="color:var(--text-muted);">ON DISK (Not loaded)</span>`;
    if (elements.loadModelBtn && state.provider === 'lmstudio') {
      elements.loadModelBtn.style.display = 'inline-block';
      elements.loadModelBtn.dataset.modelId = modelObj.id;
    } else if (elements.loadModelBtn) {
      elements.loadModelBtn.style.display = 'none';
    }
    if (elements.ejectModelBtn) elements.ejectModelBtn.style.display = 'none';
  }
}

async function loadSelectedModelIntoMemory() {
  const modelId = elements.loadModelBtn?.dataset.modelId || elements.modelInput.value.trim();
  if (!modelId) return;

  const btn = elements.loadModelBtn;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Loading into GPU...</span>';
  btn.disabled = true;

  try {
    showToast(`Loading "${modelId}" into LM Studio memory... This may take a few seconds.`, 'info');
    const res = await fetch('/api/models/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: state.provider,
        baseUrl: elements.baseUrlInput.value.trim(),
        model: modelId
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    showToast(`Model "${modelId}" is now LOADED in memory and ready for testing!`, 'success');
    await detectModelsFromServer();
  } catch (err) {
    showToast(`Failed to load model: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

async function ejectSelectedModelFromMemory() {
  const modelId = elements.ejectModelBtn?.dataset.modelId || elements.modelInput.value.trim();
  if (!modelId) return;

  const btn = elements.ejectModelBtn;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Ejecting...</span>';
  btn.disabled = true;

  try {
    const res = await fetch('/api/models/unload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: state.provider,
        baseUrl: elements.baseUrlInput.value.trim(),
        model: modelId
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    showToast(`Model "${modelId}" ejected from memory (VRAM freed).`, 'info');
    await detectModelsFromServer();
  } catch (err) {
    showToast(`Failed to eject model: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
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

// Server Health Check
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      if (elements.serverStatusBadge) elements.serverStatusBadge.querySelector('.status-dot')?.classList.remove('offline');
      if (elements.serverStatusText) elements.serverStatusText.textContent = 'Server: Online';
    } else {
      throw new Error('Server returned non-200');
    }
  } catch {
    if (elements.serverStatusBadge) elements.serverStatusBadge.querySelector('.status-dot')?.classList.add('offline');
    if (elements.serverStatusText) elements.serverStatusText.textContent = 'Server: Offline';
  }
}

// Auto-Detect Loaded Models (LM Studio, Ollama, OpenAI-compatible)
async function detectModelsFromServer() {
  const btn = elements.detectModelsBtn;
  if (!btn) return;
  const originalText = btn.textContent;
  btn.textContent = 'Scanning...';
  btn.disabled = true;

  const provider = state.provider;
  const baseUrl = elements.baseUrlInput.value.trim() || PROVIDER_PRESETS[provider]?.baseUrl;
  const apiKey = elements.apiKeyInput.value.trim();

  try {
    const url = `/api/models?provider=${encodeURIComponent(provider)}&baseUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    if (!data.models || data.models.length === 0) {
      showToast(`Connected to server at ${baseUrl}, but no models were found.`, 'info');
      return;
    }

    PROVIDER_PRESETS[provider].models = data.models;
    renderModelChips(data.models);

    // Prefer active loaded model if present, otherwise first available
    const targetModelId = data.activeLoadedModel || (typeof data.models[0] === 'string' ? data.models[0] : data.models[0]?.id);
    if (targetModelId) {
      elements.modelInput.value = targetModelId;
      state.model = targetModelId;
      updateModelChipSelection();
      updateCurlPreview();
      if (elements.arenaModelAName) {
        elements.arenaModelAName.textContent = targetModelId;
      }
    }

    const loadedCount = data.models.filter(m => typeof m === 'object' && m.isLoaded).length;
    if (loadedCount > 0) {
      showToast(`Found ${data.models.length} model(s): ${loadedCount} active in memory, ${data.models.length - loadedCount} on disk.`, 'success');
    } else {
      showToast(`Detected ${data.models.length} model(s) from server!`, 'success');
    }
  } catch (err) {
    showToast(`Model detection failed: ${err.message}`, 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ----------------------------------------------------
// Request Execution & Stop Handling (Playground)
// ----------------------------------------------------
function stopActiveExecution() {
  if (state.latencyTimer) {
    clearInterval(state.latencyTimer);
    state.latencyTimer = null;
  }

  if (state.activeReader) {
    try {
      state.activeReader.cancel();
    } catch (e) {
      console.warn('Active reader cancel error:', e);
    }
    state.activeReader = null;
  }

  if (state.activeAbortController) {
    try {
      state.activeAbortController.abort();
    } catch (e) {
      console.warn('Active controller abort error:', e);
    }
    state.activeAbortController = null;
  }

  updateStatusBadge('error', 'STOPPED');

  if (elements.renderedOutput) {
    const isPlaceholder = elements.renderedOutput.querySelector('.placeholder-state');
    if (!elements.renderedOutput.textContent.trim() || isPlaceholder) {
      renderErrorOutput('[Execution stopped by user]');
    } else {
      const existingNotice = elements.renderedOutput.querySelector('.stopped-notice');
      if (!existingNotice) {
        const notice = document.createElement('div');
        notice.className = 'stopped-notice';
        notice.style.cssText = 'color: var(--text-muted); font-size: 0.8rem; margin-top: 10px; font-style: italic; border-top: 1px dashed var(--border-default); padding-top: 8px;';
        notice.textContent = '[Stream terminated by user]';
        elements.renderedOutput.appendChild(notice);
      }
    }
  }

  setExecutionState(false);
  showToast('Execution stopped by user', 'info');
}

async function executePromptRequest() {
  if (state.isExecuting) return;

  const promptText = elements.userPromptInput ? elements.userPromptInput.value.trim() : '';
  if (!promptText) {
    showToast('Please enter a prompt or use "Test: What is life?"', 'error');
    if (elements.userPromptInput) elements.userPromptInput.focus();
    return;
  }

  const modelName = elements.modelInput ? elements.modelInput.value.trim() : '';
  if (!modelName) {
    showToast('Please enter or select a model name', 'error');
    if (elements.modelInput) elements.modelInput.focus();
    return;
  }

  const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
  const provider = state.provider;

  if (['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(provider) && !apiKey) {
    showToast(`Note: ${PROVIDER_PRESETS[provider]?.name || provider} requires an API key. Testing without key may return 401.`, 'error');
  }

  const abortController = new AbortController();
  state.activeAbortController = abortController;

  setExecutionState(true);

  const startTime = Date.now();

  try {
    updateStatusBadge('loading', 'REQUESTING...');
    if (elements.latencyValue) elements.latencyValue.textContent = 'Measuring...';
    if (elements.tokensValue) elements.tokensValue.textContent = '-- / --';
    if (elements.totalTokensValue) elements.totalTokensValue.textContent = '--';
    if (elements.tpsValue) elements.tpsValue.textContent = '-- TPS';

    if (elements.renderedOutput) {
      elements.renderedOutput.innerHTML = '<div class="placeholder-state"><p>Connecting to endpoint and awaiting response stream...</p></div>';
    }
    if (elements.reasoningOutput) {
      elements.reasoningOutput.innerHTML = '<div class="placeholder-state"><p>Awaiting reasoning or thinking tokens...</p></div>';
    }
    if (elements.rawJsonViewer) elements.rawJsonViewer.textContent = '// Awaiting payload...';
    if (elements.headersViewerContainer) {
      elements.headersViewerContainer.innerHTML = '<div class="placeholder-state"><p>Capturing upstream HTTP response headers...</p></div>';
    }

    if (elements.statPromptTokens) elements.statPromptTokens.textContent = '--';
    if (elements.statCompletionTokens) elements.statCompletionTokens.textContent = '--';
    if (elements.statTps) elements.statTps.textContent = '--';
    if (elements.statTtft) elements.statTtft.textContent = '--';

    if (state.latencyTimer) clearInterval(state.latencyTimer);
    state.latencyTimer = setInterval(() => {
      if (elements.latencyValue) elements.latencyValue.textContent = `${Date.now() - startTime} ms`;
    }, 50);

    // Prepare payload
    const messages = [];
    if (state.systemPrompt && state.systemPrompt.trim()) {
      messages.push({ role: 'system', content: state.systemPrompt.trim() });
    }
    messages.push({ role: 'user', content: promptText });

    const requestBody = {
      provider,
      baseUrl: elements.baseUrlInput ? elements.baseUrlInput.value.trim() : '',
      apiKey,
      model: modelName,
      messages,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      stream: state.stream,
      timeout: state.timeout > 0 ? state.timeout * 1000 : 0
    };

    // Attach custom headers if defined
    if (Object.keys(state.customHeaders).length > 0) {
      requestBody.headers = state.customHeaders;
    }

    // Attach tools if enabled and valid
    if (state.toolsEnabled && state.toolsSchema) {
      try {
        requestBody.tools = JSON.parse(state.toolsSchema);
      } catch {
        // Ignore if parse fails
      }
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');

    if (isSSE && response.ok) {
      await handleStreamResponse(response, startTime, promptText);
    } else {
      await handleJsonResponse(response, startTime, promptText);
    }
  } catch (err) {
    if (state.latencyTimer) {
      clearInterval(state.latencyTimer);
      state.latencyTimer = null;
    }
    const finalLatency = Date.now() - startTime;
    if (elements.latencyValue) elements.latencyValue.textContent = `${finalLatency} ms`;

    if (err.name === 'AbortError') {
      updateStatusBadge('error', 'STOPPED');
      renderErrorOutput(`[Execution stopped by user or timed out after ${state.timeout}s]`);
      showToast('Request was cancelled', 'info');
      logHistoryItem({
        prompt: promptText,
        model: modelName,
        status: 'STOPPED',
        statusCode: 499,
        latency: finalLatency,
        success: false
      });
    } else {
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
    }
  } finally {
    if (state.latencyTimer) {
      clearInterval(state.latencyTimer);
      state.latencyTimer = null;
    }
    state.activeReader = null;
    state.activeAbortController = null;
    setExecutionState(false);
  }
}

// Handle Server-Sent Events (Streaming)
async function handleStreamResponse(response, startTime, promptText) {
  updateStatusBadge('loading', 'STREAMING...');
  if (elements.renderedOutput) elements.renderedOutput.innerHTML = '';

  const reader = response.body.getReader();
  state.activeReader = reader;
  const decoder = new TextDecoder();
  let accumulatedText = '';
  let accumulatedReasoning = '';
  let usageData = null;
  let finalLatency = 0;
  let buffer = '';
  let ttft = null;

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

          // Capture upstream headers from init event
          if (payload.upstreamHeaders) {
            state.lastUpstreamHeaders = payload.upstreamHeaders;
            renderResponseHeaders(payload.upstreamHeaders);
          }

          // Capture reasoning / thinking
          if (payload.reasoning) {
            accumulatedReasoning += payload.reasoning;
            renderReasoning(accumulatedReasoning);
          }

          // Capture content token
          if (payload.text) {
            if (ttft === null) {
              ttft = Date.now() - startTime;
              if (elements.statTtft) elements.statTtft.textContent = `${ttft} ms`;
            }
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
          // Ignore parse errors on individual SSE chunks
        }
      }
    }
  } finally {
    if (state.latencyTimer) {
      clearInterval(state.latencyTimer);
      state.latencyTimer = null;
    }
    if (state.activeReader === reader) {
      state.activeReader = null;
    }
  }

  finalLatency = finalLatency || (Date.now() - startTime);
  if (elements.latencyValue) elements.latencyValue.textContent = `${finalLatency} ms`;
  updateStatusBadge('success', '200 OK (STREAM)');

  // Calculate Tokens & TPS Speed
  let completionTokens = 0;
  let promptTokens = 0;

  if (usageData) {
    updateTokensUI(usageData);
    promptTokens = usageData.prompt_tokens ?? usageData.input_tokens ?? 0;
    completionTokens = usageData.completion_tokens ?? usageData.output_tokens ?? 0;
  } else {
    completionTokens = Math.max(1, Math.ceil(accumulatedText.split(/\s+/).filter(Boolean).length * 1.3));
    promptTokens = Math.max(1, Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 1.3));
    if (elements.tokensValue) elements.tokensValue.textContent = `${promptTokens} / ${completionTokens}`;
    if (elements.totalTokensValue) elements.totalTokensValue.textContent = `${promptTokens + completionTokens}`;
  }

  if (elements.statPromptTokens) elements.statPromptTokens.textContent = promptTokens;
  if (elements.statCompletionTokens) elements.statCompletionTokens.textContent = completionTokens;

  // Throughput Calculation
  const decodeDurationSec = Math.max(0.05, (finalLatency - (ttft || 0)) / 1000);
  const tps = (completionTokens / decodeDurationSec).toFixed(1);
  if (elements.tpsValue) elements.tpsValue.textContent = `${tps} TPS`;
  if (elements.statTps) elements.statTps.textContent = `${tps} TPS`;

  // Update Raw JSON Viewer
  if (elements.rawJsonViewer) {
    elements.rawJsonViewer.textContent = JSON.stringify({
      success: true,
      model: state.model,
      streamedContent: accumulatedText,
      reasoning: accumulatedReasoning || undefined,
      latencyMs: finalLatency,
      ttftMs: ttft,
      tps: Number(tps),
      usage: usageData,
      upstreamHeaders: state.lastUpstreamHeaders
    }, null, 2);
  }

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
async function handleJsonResponse(response, startTime, promptText) {
  if (state.latencyTimer) {
    clearInterval(state.latencyTimer);
    state.latencyTimer = null;
  }
  const data = await response.json().catch(() => ({ error: 'Unable to parse server JSON response' }));
  const latency = data.latency || (Date.now() - startTime);
  if (elements.latencyValue) elements.latencyValue.textContent = `${latency} ms`;

  // Display raw JSON
  if (elements.rawJsonViewer) elements.rawJsonViewer.textContent = JSON.stringify(data, null, 2);

  // Capture upstream headers
  if (data.upstreamHeaders) {
    state.lastUpstreamHeaders = data.upstreamHeaders;
    renderResponseHeaders(data.upstreamHeaders);
  }

  // Capture reasoning
  if (data.reasoning) {
    renderReasoning(data.reasoning);
  }

  if (response.ok && data.success) {
    updateStatusBadge('success', `${data.status || 200} OK`);
    renderMarkdown(data.content || '(Empty content returned)');
    
    let completionTokens = 0;
    let promptTokens = 0;

    if (data.usage) {
      updateTokensUI(data.usage);
      promptTokens = data.usage.prompt_tokens ?? data.usage.input_tokens ?? 0;
      completionTokens = data.usage.completion_tokens ?? data.usage.output_tokens ?? 0;
    } else {
      completionTokens = Math.max(1, Math.ceil((data.content || '').split(/\s+/).filter(Boolean).length * 1.3));
      promptTokens = Math.max(1, Math.ceil(promptText.split(/\s+/).filter(Boolean).length * 1.3));
      if (elements.tokensValue) elements.tokensValue.textContent = `${promptTokens} / ${completionTokens}`;
      if (elements.totalTokensValue) elements.totalTokensValue.textContent = `${promptTokens + completionTokens}`;
    }

    if (elements.statPromptTokens) elements.statPromptTokens.textContent = promptTokens;
    if (elements.statCompletionTokens) elements.statCompletionTokens.textContent = completionTokens;

    const tps = (completionTokens / Math.max(0.1, latency / 1000)).toFixed(1);
    if (elements.tpsValue) elements.tpsValue.textContent = `${tps} TPS`;
    if (elements.statTps) elements.statTps.textContent = `${tps} TPS`;

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
    renderErrorOutput(`HTTP ${statusCode} Error from ${state.provider}:\n\n${errorMessage}\n\nEndpoint: ${data.endpoint || (elements.baseUrlInput ? elements.baseUrlInput.value : '')}`);
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
  if (window.marked && elements.renderedOutput) {
    try {
      elements.renderedOutput.innerHTML = marked.parse(content);
      return;
    } catch {
      // Fallback
    }
  }
  if (elements.renderedOutput) {
    elements.renderedOutput.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
  }
}

function renderReasoning(reasoningText) {
  if (!elements.reasoningOutput) return;
  if (!reasoningText || !reasoningText.trim()) {
    elements.reasoningOutput.innerHTML = '<div class="placeholder-state"><p>No reasoning or thinking tokens returned.</p></div>';
    return;
  }
  state.lastReasoningText = reasoningText;
  elements.reasoningOutput.innerHTML = `<pre class="reasoning-text-block">${escapeHtml(reasoningText)}</pre>`;
}

function renderResponseHeaders(headersObj) {
  if (!elements.headersViewerContainer) return;
  if (!headersObj || Object.keys(headersObj).length === 0) {
    elements.headersViewerContainer.innerHTML = '<div class="placeholder-state"><p>No response headers captured from upstream provider.</p></div>';
    return;
  }
  let html = '<table class="headers-table"><thead><tr><th>Header Name</th><th>Value</th></tr></thead><tbody>';
  for (const [key, value] of Object.entries(headersObj)) {
    html += `<tr><td class="header-name-cell">${escapeHtml(key)}</td><td class="header-value-cell">${escapeHtml(String(value))}</td></tr>`;
  }
  html += '</tbody></table>';
  elements.headersViewerContainer.innerHTML = html;
}

function renderErrorOutput(message) {
  if (!elements.renderedOutput) return;
  elements.renderedOutput.innerHTML = `
    <div style="color: #f87171; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">
${escapeHtml(message)}
    </div>
  `;
}

// Update Token Counters
function updateTokensUI(usage) {
  const pTokens = usage.prompt_tokens ?? usage.promptTokens ?? usage.input_tokens ?? '--';
  const cTokens = usage.completion_tokens ?? usage.completionTokens ?? usage.output_tokens ?? '--';
  const tTokens = usage.total_tokens ?? usage.totalTokens ?? (pTokens !== '--' && cTokens !== '--' ? Number(pTokens) + Number(cTokens) : '--');

  if (elements.tokensValue) elements.tokensValue.textContent = `${pTokens} / ${cTokens}`;
  if (elements.totalTokensValue) elements.totalTokensValue.textContent = `${tTokens}`;
}

// Update Status Badge UI
function updateStatusBadge(type, text) {
  elements.statusBadge.className = `diag-badge ${type}`;
  elements.statusBadge.textContent = text;
}

// Set loading / execution state
function setExecutionState(isExecuting) {
  state.isExecuting = isExecuting;
  if (elements.submitPromptBtn) {
    elements.submitPromptBtn.style.display = isExecuting ? 'none' : 'inline-flex';
    elements.submitPromptBtn.disabled = isExecuting;
    elements.submitBtnText.textContent = isExecuting ? 'Running...' : 'Send Request';
  }
  if (elements.stopPromptBtn) {
    elements.stopPromptBtn.style.display = isExecuting ? 'inline-flex' : 'none';
  }
  if (elements.runReadyTestBtn) {
    elements.runReadyTestBtn.disabled = isExecuting;
  }
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

  if (provider === 'claude' || provider === 'custom_anthropic') {
    let endpoint = 'https://api.anthropic.com/v1/messages';
    if (baseUrl) {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      if (cleanUrl.endsWith('/messages')) {
        endpoint = cleanUrl;
      } else if (cleanUrl.endsWith('/v1')) {
        endpoint = `${cleanUrl}/messages`;
      } else {
        endpoint = `${cleanUrl}/v1/messages`;
      }
    }

    let extraHeadersStr = '';
    if (Object.keys(state.customHeaders).length > 0) {
      for (const [k, v] of Object.entries(state.customHeaders)) {
        extraHeadersStr += `  -H "${k}: ${v}" \\\n`;
      }
    }

    curl = `curl ${endpoint} \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
${extraHeadersStr}  -d '{
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

    let extraHeadersStr = '';
    if (Object.keys(state.customHeaders).length > 0) {
      for (const [k, v] of Object.entries(state.customHeaders)) {
        extraHeadersStr += `  -H "${k}: ${v}" \\\n`;
      }
    }

    curl = `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
${extraHeadersStr}  -d '{
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
  state.history.forEach((item) => {
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

// ----------------------------------------------------
// Mode 2: A/B Arena Dual Comparison Runner
// ----------------------------------------------------
function initArenaMode() {
  if (elements.runArenaBtn) {
    elements.runArenaBtn.addEventListener('click', runArenaTest);
  }

  if (elements.arenaPromptInput) {
    elements.arenaPromptInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!state.isArenaExecuting) {
          runArenaTest();
        }
      }
    });
  }

  // Model A Configuration Events
  if (elements.arenaModelAProvider) {
    elements.arenaModelAProvider.addEventListener('change', (e) => {
      const provider = e.target.value;
      const preset = PROVIDER_PRESETS[provider];
      if (preset && elements.arenaModelAInput) {
        elements.arenaModelAInput.value = preset.defaultModel;
      }
      renderArenaPresetChips('A', provider);
      if (elements.arenaKeyA && state.savedKeys[provider]) {
        elements.arenaKeyA.value = state.savedKeys[provider];
      }
    });
  }

  if (elements.arenaModelAInput) {
    elements.arenaModelAInput.addEventListener('input', () => {
      updateArenaChipsSelection('A');
    });
  }

  if (elements.arenaToggleAdvancedA && elements.arenaAdvancedPanelA) {
    elements.arenaToggleAdvancedA.addEventListener('click', () => {
      const isCollapsed = elements.arenaAdvancedPanelA.classList.toggle('collapsed');
      elements.arenaToggleAdvancedA.classList.toggle('active', !isCollapsed);
    });
  }

  // Model B Configuration Events
  if (elements.arenaModelBProvider) {
    elements.arenaModelBProvider.addEventListener('change', (e) => {
      const provider = e.target.value;
      const preset = PROVIDER_PRESETS[provider];
      if (preset && elements.arenaModelBInput) {
        elements.arenaModelBInput.value = preset.defaultModel;
      }
      renderArenaPresetChips('B', provider);
      if (elements.arenaKeyB && state.savedKeys[provider]) {
        elements.arenaKeyB.value = state.savedKeys[provider];
      }
    });
  }

  if (elements.arenaModelBInput) {
    elements.arenaModelBInput.addEventListener('input', () => {
      updateArenaChipsSelection('B');
    });
  }

  if (elements.arenaToggleAdvancedB && elements.arenaAdvancedPanelB) {
    elements.arenaToggleAdvancedB.addEventListener('click', () => {
      const isCollapsed = elements.arenaAdvancedPanelB.classList.toggle('collapsed');
      elements.arenaToggleAdvancedB.classList.toggle('active', !isCollapsed);
    });
  }

  // Initial sync
  syncArenaWithCurrentConfig();
}

function syncArenaWithCurrentConfig() {
  // Sync Model A with current sidebar settings
  if (elements.arenaModelAProvider) {
    elements.arenaModelAProvider.value = state.provider;
    renderArenaPresetChips('A', state.provider);
  }
  if (elements.arenaModelAInput) {
    elements.arenaModelAInput.value = state.model || PROVIDER_PRESETS[state.provider]?.defaultModel || 'custom-model';
    updateArenaChipsSelection('A');
  }
  if (elements.arenaKeyA && state.savedKeys[state.provider]) {
    elements.arenaKeyA.value = state.savedKeys[state.provider];
  }

  // Sync Model B defaults (e.g. OpenAI gpt-4o or Claude)
  const defaultBProvider = state.provider === 'openai' ? 'claude' : 'openai';
  if (elements.arenaModelBProvider) {
    elements.arenaModelBProvider.value = defaultBProvider;
    renderArenaPresetChips('B', defaultBProvider);
  }
  if (elements.arenaModelBInput) {
    elements.arenaModelBInput.value = PROVIDER_PRESETS[defaultBProvider]?.defaultModel || 'gpt-4o';
    updateArenaChipsSelection('B');
  }
  if (elements.arenaKeyB && state.savedKeys[defaultBProvider]) {
    elements.arenaKeyB.value = state.savedKeys[defaultBProvider];
  }
}

function renderArenaPresetChips(side, providerKey) {
  const container = elements[`arenaChips${side}`];
  const input = elements[`arenaModel${side}Input`];
  if (!container) return;

  container.innerHTML = '';
  const preset = PROVIDER_PRESETS[providerKey];
  if (!preset || !preset.models) return;

  preset.models.forEach(modelName => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (input && input.value.trim() === modelName ? ' active' : '');
    chip.textContent = modelName;
    chip.addEventListener('click', () => {
      if (input) {
        input.value = modelName;
        updateArenaChipsSelection(side);
      }
    });
    container.appendChild(chip);
  });
}

function updateArenaChipsSelection(side) {
  const container = elements[`arenaChips${side}`];
  const input = elements[`arenaModel${side}Input`];
  if (!container || !input) return;

  const currentVal = input.value.trim();
  container.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.textContent === currentVal);
  });
}

async function runArenaTest() {
  if (state.isArenaExecuting) {
    if (state.activeArenaReaderA) {
      try { state.activeArenaReaderA.cancel(); } catch (e) {}
      state.activeArenaReaderA = null;
    }
    if (state.activeArenaReaderB) {
      try { state.activeArenaReaderB.cancel(); } catch (e) {}
      state.activeArenaReaderB = null;
    }
    if (state.activeArenaAbortA) state.activeArenaAbortA.abort();
    if (state.activeArenaAbortB) state.activeArenaAbortB.abort();
    showToast('A/B comparison stopped by user', 'info');
    return;
  }

  const promptText = elements.arenaPromptInput.value.trim();
  if (!promptText) {
    showToast('Please enter a comparison prompt for the A/B Arena', 'error');
    elements.arenaPromptInput.focus();
    return;
  }

  // Model A Parameters
  const providerA = elements.arenaModelAProvider ? elements.arenaModelAProvider.value : state.provider;
  const modelA = (elements.arenaModelAInput ? elements.arenaModelAInput.value.trim() : '') || state.model;
  const keyA = (elements.arenaKeyA ? elements.arenaKeyA.value.trim() : '') || (providerA === state.provider ? state.apiKey : (state.savedKeys[providerA] || ''));
  const urlA = (elements.arenaUrlA ? elements.arenaUrlA.value.trim() : '') || (providerA === state.provider ? elements.baseUrlInput.value.trim() : PROVIDER_PRESETS[providerA]?.baseUrl);

  // Model B Parameters
  const providerB = elements.arenaModelBProvider ? elements.arenaModelBProvider.value : 'openai';
  const modelB = (elements.arenaModelBInput ? elements.arenaModelBInput.value.trim() : '') || 'gpt-4o';
  const keyB = (elements.arenaKeyB ? elements.arenaKeyB.value.trim() : '') || state.savedKeys[providerB] || (providerB === state.provider ? state.apiKey : '');
  const urlB = (elements.arenaUrlB ? elements.arenaUrlB.value.trim() : '') || PROVIDER_PRESETS[providerB]?.baseUrl;

  if (['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(providerA) && !keyA) {
    showToast(`Notice: Model A (${PROVIDER_PRESETS[providerA]?.name}) has no API key entered. Click Auth / URL if needed.`, 'error');
  }
  if (['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(providerB) && !keyB) {
    showToast(`Notice: Model B (${PROVIDER_PRESETS[providerB]?.name}) has no API key entered. Click Auth / URL if needed.`, 'error');
  }

  const abortA = new AbortController();
  const abortB = new AbortController();
  state.activeArenaAbortA = abortA;
  state.activeArenaAbortB = abortB;
  state.isArenaExecuting = true;

  elements.runArenaBtn.classList.add('btn-stop');
  const runSpan = elements.runArenaBtn.querySelector('span');
  if (runSpan) runSpan.textContent = 'Stop Comparison';

  if (elements.arenaSummaryBanner) elements.arenaSummaryBanner.style.display = 'none';

  // Reset Arena Cards UI
  resetArenaCard('A');
  resetArenaCard('B');

  const messages = [{ role: 'user', content: promptText }];
  const commonHeaders = Object.keys(state.customHeaders).length > 0 ? state.customHeaders : undefined;
  const timeoutMs = state.timeout > 0 ? state.timeout * 1000 : 0;

  const payloadA = {
    provider: providerA,
    baseUrl: urlA,
    apiKey: keyA,
    model: modelA,
    messages,
    temperature: state.temperature,
    maxTokens: state.maxTokens,
    stream: true,
    headers: commonHeaders,
    timeout: timeoutMs
  };

  const payloadB = {
    provider: providerB,
    baseUrl: urlB,
    apiKey: keyB,
    model: modelB,
    messages,
    temperature: state.temperature,
    maxTokens: state.maxTokens,
    stream: true,
    headers: commonHeaders,
    timeout: timeoutMs
  };

  // Concurrent Execution
  try {
    const [resA, resB] = await Promise.allSettled([
      streamArenaModel('A', payloadA, abortA.signal),
      streamArenaModel('B', payloadB, abortB.signal)
    ]);

    renderArenaSummary(
      resA.status === 'fulfilled' ? resA.value : null,
      resB.status === 'fulfilled' ? resB.value : null,
      modelA,
      modelB
    );
  } finally {
    state.isArenaExecuting = false;
    state.activeArenaAbortA = null;
    state.activeArenaAbortB = null;
    state.activeArenaReaderA = null;
    state.activeArenaReaderB = null;
    elements.runArenaBtn.classList.remove('btn-stop');
    if (runSpan) runSpan.textContent = 'Run A/B Comparison';
  }
}

function resetArenaCard(side) {
  const statusEl = elements[`arenaStatus${side}`];
  const outputEl = elements[`arenaOutput${side}`];
  const ttftEl = elements[`arenaTtft${side}`];
  const latencyEl = elements[`arenaLatency${side}`];
  const tpsEl = elements[`arenaTps${side}`];
  const tokensEl = elements[`arenaTokens${side}`];

  if (statusEl) {
    statusEl.className = 'badge-status loading';
    statusEl.textContent = 'CONNECTING...';
  }
  if (outputEl) {
    outputEl.innerHTML = '<div class="placeholder-state"><p>Streaming model response...</p></div>';
  }
  if (ttftEl) ttftEl.textContent = '--';
  if (latencyEl) latencyEl.textContent = '--';
  if (tpsEl) tpsEl.textContent = '-- TPS';
  if (tokensEl) tokensEl.textContent = '--';
}

async function streamArenaModel(side, payload, signal) {
  const statusEl = elements[`arenaStatus${side}`];
  const outputEl = elements[`arenaOutput${side}`];
  const ttftEl = elements[`arenaTtft${side}`];
  const latencyEl = elements[`arenaLatency${side}`];
  const tpsEl = elements[`arenaTps${side}`];
  const tokensEl = elements[`arenaTokens${side}`];

  const startTime = Date.now();
  let ttft = null;
  let accumulatedText = '';
  let usage = null;
  let finalLatency = 0;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    if (statusEl) {
      statusEl.className = 'badge-status streaming';
      statusEl.textContent = 'STREAMING...';
    }

    const reader = res.body.getReader();
    if (side === 'A') state.activeArenaReaderA = reader;
    else state.activeArenaReaderB = reader;
    const decoder = new TextDecoder();
    let buffer = '';

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
          const item = JSON.parse(jsonStr);
          if (item.text) {
            if (ttft === null) {
              ttft = Date.now() - startTime;
              if (ttftEl) ttftEl.textContent = `${ttft} ms`;
            }
            accumulatedText += item.text;
            if (window.marked) {
              outputEl.innerHTML = marked.parse(accumulatedText);
            } else {
              outputEl.innerHTML = `<pre>${escapeHtml(accumulatedText)}</pre>`;
            }
          }
          if (item.usage) usage = item.usage;
          if (item.done) finalLatency = item.latency || (Date.now() - startTime);
          if (item.error) throw new Error(item.error);
        } catch {
          // Chunk parse ignore
        }
      }
    }

    finalLatency = finalLatency || (Date.now() - startTime);
    if (latencyEl) latencyEl.textContent = `${finalLatency} ms`;
    if (statusEl) {
      statusEl.className = 'badge-status success';
      statusEl.textContent = 'FINISHED';
    }

    const completionTokens = usage?.completion_tokens ?? Math.max(1, Math.ceil(accumulatedText.split(/\s+/).filter(Boolean).length * 1.3));
    if (tokensEl) tokensEl.textContent = `${completionTokens} toks`;

    const decodeDuration = Math.max(0.05, (finalLatency - (ttft || 0)) / 1000);
    const tps = (completionTokens / decodeDuration).toFixed(1);
    if (tpsEl) tpsEl.textContent = `${tps} TPS`;

    return {
      side,
      model: payload.model,
      ttft: ttft || finalLatency,
      latency: finalLatency,
      tps: Number(tps),
      tokens: completionTokens,
      success: true
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      if (statusEl) {
        statusEl.className = 'badge-status error';
        statusEl.textContent = 'STOPPED';
      }
      if (outputEl) {
        outputEl.innerHTML = `
          <div class="arena-error-box" style="color: var(--text-secondary); background-color: var(--bg-surface-soft); border: 1px dashed var(--border-default); padding: 14px; font-family: var(--font-mono); font-size: 0.82rem;">
            [Execution stopped by user or timed out]
          </div>
        `;
      }
      return {
        side,
        model: payload.model,
        error: 'Execution stopped',
        success: false
      };
    }

    if (statusEl) {
      statusEl.className = 'badge-status error';
      statusEl.textContent = 'FAILED';
    }
    if (outputEl) {
      const isAuthError = err.message.toLowerCase().includes('key') || err.message.includes('401') || err.message.toLowerCase().includes('unauthorized');
      outputEl.innerHTML = `
        <div class="arena-error-box" style="color: #f87171; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.5;">
          <div style="font-weight: 600; margin-bottom: 4px;">Execution Error: ${escapeHtml(err.message)}</div>
          <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 6px;">
            Target: <strong>${escapeHtml(payload.provider)}</strong> &rarr; <code>${escapeHtml(payload.model)}</code>
            ${isAuthError ? '<div style="margin-top: 6px; color: var(--accent-primary);">Tip: Missing or invalid API key. Click <strong>Auth / URL</strong> above to provide the API key for this model.</div>' : ''}
          </div>
        </div>
      `;
    }
    return {
      side,
      model: payload.model,
      error: err.message,
      success: false
    };
  }
}

function renderArenaSummary(resA, resB, modelA, modelB) {
  if (!elements.arenaSummaryBanner || !elements.arenaSummaryText || !elements.arenaSummaryTags) return;

  if (!resA?.success && !resB?.success) {
    elements.arenaSummaryText.textContent = 'Both models encountered errors during execution.';
    elements.arenaSummaryTags.innerHTML = '<span class="summary-tag tag-error">Both Failed</span>';
    elements.arenaSummaryBanner.style.display = 'flex';
    return;
  }

  let summaryHtml = '';
  const tags = [];

  if (resA?.success && resB?.success) {
    // TTFT comparison
    const ttftDiff = Math.abs(resA.ttft - resB.ttft);
    if (resA.ttft < resB.ttft) {
      tags.push(`<span class="summary-tag tag-ttft">Model A first token -${ttftDiff}ms faster</span>`);
    } else if (resB.ttft < resA.ttft) {
      tags.push(`<span class="summary-tag tag-ttft">Model B first token -${ttftDiff}ms faster</span>`);
    }

    // Speed comparison
    if (resA.tps > resB.tps) {
      tags.push(`<span class="summary-tag tag-tps">Model A generated faster (+${(resA.tps - resB.tps).toFixed(1)} TPS)</span>`);
    } else if (resB.tps > resA.tps) {
      tags.push(`<span class="summary-tag tag-tps">Model B generated faster (+${(resB.tps - resA.tps).toFixed(1)} TPS)</span>`);
    }

    // Total Latency
    const latDiff = Math.abs(resA.latency - resB.latency);
    if (resA.latency < resB.latency) {
      tags.push(`<span class="summary-tag tag-latency">Model A completed ${latDiff}ms quicker</span>`);
    } else if (resB.latency < resA.latency) {
      tags.push(`<span class="summary-tag tag-latency">Model B completed ${latDiff}ms quicker</span>`);
    }

    summaryHtml = `Dual comparison concluded between <strong>${escapeHtml(modelA)}</strong> and <strong>${escapeHtml(modelB)}</strong>.`;
  } else if (resA?.success) {
    summaryHtml = `Model A (<strong>${escapeHtml(modelA)}</strong>) succeeded; Model B failed.`;
    tags.push('<span class="summary-tag tag-success">Model A Succeeded</span>');
  } else {
    summaryHtml = `Model B (<strong>${escapeHtml(modelB)}</strong>) succeeded; Model A failed.`;
    tags.push('<span class="summary-tag tag-success">Model B Succeeded</span>');
  }

  elements.arenaSummaryText.innerHTML = summaryHtml;
  elements.arenaSummaryTags.innerHTML = tags.join('');
  elements.arenaSummaryBanner.style.display = 'flex';
}


// ----------------------------------------------------
// Mode 3: Chat Thread Multi-turn Logic
// ----------------------------------------------------
function initChatThread() {
  if (elements.chatSendBtn) {
    elements.chatSendBtn.addEventListener('click', sendChatMessage);
  }

  if (elements.chatInputText) {
    elements.chatInputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!state.isChatExecuting) {
          sendChatMessage();
        }
      }
    });
  }

  if (elements.clearChatBtn) {
    elements.clearChatBtn.addEventListener('click', () => {
      state.chatMessages = [];
      if (elements.chatMessagesStream) {
        elements.chatMessagesStream.querySelectorAll('.chat-bubble-row').forEach(r => r.remove());
      }
      if (elements.emptyChatPlaceholder) {
        elements.emptyChatPlaceholder.style.display = 'flex';
      }
      if (elements.chatTurnCount) {
        elements.chatTurnCount.textContent = '0 turns';
      }
      showToast('Chat thread reset', 'info');
    });
  }

  if (elements.exportChatBtn) {
    elements.exportChatBtn.addEventListener('click', () => {
      if (state.chatMessages.length === 0) {
        showToast('No chat messages to export', 'info');
        return;
      }
      let exportText = `# OmniLLM Chat Session - ${new Date().toLocaleString()}\n`;
      exportText += `Provider: ${PROVIDER_PRESETS[state.provider]?.name || state.provider}\n`;
      exportText += `Model: ${elements.modelInput.value.trim() || state.model}\n\n`;
      if (state.systemPrompt.trim()) {
        exportText += `> System: ${state.systemPrompt.trim()}\n\n`;
      }
      state.chatMessages.forEach(msg => {
        exportText += `### ${msg.role === 'user' ? 'User' : 'Assistant'} (${msg.time})\n\n${msg.content}\n\n`;
      });
      copyToClipboard(exportText, 'Complete conversation exported to clipboard as Markdown');
    });
  }
}

async function sendChatMessage() {
  if (state.isChatExecuting) {
    if (state.activeChatReader) {
      try { state.activeChatReader.cancel(); } catch (e) {}
      state.activeChatReader = null;
    }
    if (state.activeChatAbort) state.activeChatAbort.abort();
    showToast('Chat generation stopped', 'info');
    return;
  }

  const text = elements.chatInputText.value.trim();
  if (!text) return;

  const modelName = elements.modelInput.value.trim() || state.model;
  if (!modelName) {
    showToast('Please enter a model name in sidebar', 'error');
    return;
  }

  // Hide empty state
  if (elements.emptyChatPlaceholder) {
    elements.emptyChatPlaceholder.style.display = 'none';
  }

  // Clear input
  elements.chatInputText.value = '';

  // Append User Message
  const now = new Date().toLocaleTimeString();
  const userMsg = { role: 'user', content: text, time: now };
  state.chatMessages.push(userMsg);
  appendChatBubble('user', text, now);

  // Append Assistant Placeholder Bubble
  const assistantBubble = appendChatBubble('assistant', '<div class="chat-thinking-indicator">Thinking...</div>', now);

  const abortCtrl = new AbortController();
  state.activeChatAbort = abortCtrl;
  state.isChatExecuting = true;

  elements.chatSendBtn.classList.add('btn-stop');
  const sendSpan = elements.chatSendBtn.querySelector('span');
  if (sendSpan) sendSpan.textContent = 'Stop';

  // Build full message thread
  const messages = [];
  if (state.systemPrompt.trim()) {
    messages.push({ role: 'system', content: state.systemPrompt.trim() });
  }
  state.chatMessages.forEach(m => {
    messages.push({ role: m.role, content: m.content });
  });

  const payload = {
    provider: state.provider,
    baseUrl: elements.baseUrlInput.value.trim(),
    apiKey: elements.apiKeyInput.value.trim(),
    model: modelName,
    messages,
    temperature: state.temperature,
    maxTokens: state.maxTokens,
    stream: true,
    headers: Object.keys(state.customHeaders).length > 0 ? state.customHeaders : undefined,
    timeout: state.timeout > 0 ? state.timeout * 1000 : 0
  };

  let accumulatedContent = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abortCtrl.signal
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    state.activeChatReader = reader;
    const decoder = new TextDecoder();
    let buffer = '';

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
          const item = JSON.parse(jsonStr);
          if (item.text) {
            accumulatedContent += item.text;
            if (window.marked) {
              assistantBubble.querySelector('.bubble-text').innerHTML = marked.parse(accumulatedContent);
            } else {
              assistantBubble.querySelector('.bubble-text').innerHTML = `<pre>${escapeHtml(accumulatedContent)}</pre>`;
            }
            scrollChatToBottom();
          }
          if (item.error) throw new Error(item.error);
        } catch {
          // Chunk parse ignore
        }
      }
    }

    // Save assistant message to state
    state.chatMessages.push({
      role: 'assistant',
      content: accumulatedContent,
      time: new Date().toLocaleTimeString()
    });

    if (elements.chatTurnCount) {
      elements.chatTurnCount.textContent = `${Math.ceil(state.chatMessages.length / 2)} turns`;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const notice = '<div class="chat-stopped-notice" style="color: var(--text-muted); font-size: 0.78rem; margin-top: 6px; font-style: italic;">[Response stopped by user or timed out]</div>';
      if (accumulatedContent) {
        assistantBubble.querySelector('.bubble-text').innerHTML = (window.marked ? marked.parse(accumulatedContent) : `<pre>${escapeHtml(accumulatedContent)}</pre>`) + notice;
        state.chatMessages.push({
          role: 'assistant',
          content: accumulatedContent + ' [Stopped]',
          time: new Date().toLocaleTimeString()
        });
      } else {
        assistantBubble.querySelector('.bubble-text').innerHTML = notice;
      }
    } else {
      assistantBubble.querySelector('.bubble-text').innerHTML = `<div class="chat-error-msg">Error: ${escapeHtml(err.message)}</div>`;
    }
  } finally {
    state.isChatExecuting = false;
    state.activeChatAbort = null;
    state.activeChatReader = null;
    elements.chatSendBtn.classList.remove('btn-stop');
    if (sendSpan) sendSpan.textContent = 'Send';
    scrollChatToBottom();
  }
}

function appendChatBubble(role, contentHtml, time) {
  const row = document.createElement('div');
  row.className = `chat-bubble-row ${role}`;
  row.innerHTML = `
    <div class="chat-bubble">
      <div class="bubble-header">
        <span class="bubble-role">${role === 'user' ? 'YOU' : 'ASSISTANT'}</span>
        <span class="bubble-time">${time}</span>
      </div>
      <div class="bubble-text markdown-body">${contentHtml.startsWith('<') ? contentHtml : escapeHtml(contentHtml)}</div>
    </div>
  `;
  elements.chatMessagesStream.appendChild(row);
  scrollChatToBottom();
  return row;
}

function scrollChatToBottom() {
  if (elements.chatMessagesStream) {
    elements.chatMessagesStream.scrollTop = elements.chatMessagesStream.scrollHeight;
  }
}

// ----------------------------------------------------
// Utilities & Helpers
// ----------------------------------------------------
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

function copyToClipboard(text, successMessage) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage, 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
