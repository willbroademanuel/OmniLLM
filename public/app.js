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
  topP: 1.0,
  jsonMode: false,
  seed: null,
  stop: [],
  maxTokens: 2048,
  stream: true,
  systemPrompt: '',
  timeout: 60,
  attachedImage: null, // { dataUrl, name, size }
  chatAttachedImage: null,
  activeCodeLang: 'curl', // 'curl' | 'python' | 'javascript'
  arenaWinner: null,
  pendingToolCall: null,
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
  providerMemory: {},
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
  lastReasoningText: '',
  lastToolCalls: null,
  localServerStatus: {}
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
  topPSlider: document.getElementById('topPSlider'),
  topPValue: document.getElementById('topPValue'),
  maxTokensInput: document.getElementById('maxTokensInput'),
  maxTokensValue: document.getElementById('maxTokensValue'),
  jsonModeToggle: document.getElementById('jsonModeToggle'),
  seedInput: document.getElementById('seedInput'),
  stopInput: document.getElementById('stopInput'),
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

  // Multimodal Vision Attachments
  attachmentPreviewBar: document.getElementById('attachmentPreviewBar'),
  attachmentThumbnailImg: document.getElementById('attachmentThumbnailImg'),
  attachmentFileName: document.getElementById('attachmentFileName'),
  attachmentFileSize: document.getElementById('attachmentFileSize'),
  removeAttachmentBtn: document.getElementById('removeAttachmentBtn'),
  imageFileInput: document.getElementById('imageFileInput'),

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
  statTotalTokens: document.getElementById('statTotalTokens'),
  statTps: document.getElementById('statTps'),
  statTtft: document.getElementById('statTtft'),
  statEstimatedCost: document.getElementById('statEstimatedCost'),
  statCostTier: document.getElementById('statCostTier'),

  // Code Export
  codeExportTabBtn: document.getElementById('codeExportTabBtn'),
  codeSnippetViewer: document.getElementById('codeSnippetViewer'),
  copyCodeSnippetBtn: document.getElementById('copyCodeSnippetBtn'),

  rawJsonViewer: document.getElementById('rawJsonViewer'),
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

  // History
  historyList: document.getElementById('historyList'),
  historyCount: document.getElementById('historyCount'),

  // Mode 2: A/B Arena Elements
  arenaPromptInput: document.getElementById('arenaPromptInput'),
  runArenaBtn: document.getElementById('runArenaBtn'),
  arenaSummaryBanner: document.getElementById('arenaSummaryBanner'),
  arenaSummaryText: document.getElementById('arenaSummaryText'),
  arenaSummaryTags: document.getElementById('arenaSummaryTags'),
  arenaWinnerRow: document.getElementById('arenaWinnerRow'),
  voteWinnerABtn: document.getElementById('voteWinnerABtn'),
  voteWinnerTieBtn: document.getElementById('voteWinnerTieBtn'),
  voteWinnerBBtn: document.getElementById('voteWinnerBBtn'),
  commitWinnerBtn: document.getElementById('commitWinnerBtn'),
  exportArenaBtn: document.getElementById('exportArenaBtn'),

  // Arena Toolbar & Sync Controls
  arenaToolbar: document.getElementById('arenaToolbar'),
  arenaPullSidebarToABtn: document.getElementById('arenaPullSidebarToABtn'),
  arenaCopyAtoBBtn: document.getElementById('arenaCopyAtoBBtn'),
  arenaSwapABBtn: document.getElementById('arenaSwapABBtn'),
  arenaCopyBtoABtn: document.getElementById('arenaCopyBtoABtn'),
  arenaPullSidebarToBBtn: document.getElementById('arenaPullSidebarToBBtn'),
  arenaLockSameProviderCheck: document.getElementById('arenaLockSameProviderCheck'),

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
  arenaPullFromSidebarABtn: document.getElementById('arenaPullFromSidebarABtn'),
  arenaSameAsBBtn: document.getElementById('arenaSameAsBBtn'),
  arenaPushToSidebarABtn: document.getElementById('arenaPushToSidebarABtn'),
  arenaQuickSameProviderABtn: document.getElementById('arenaQuickSameProviderABtn'),

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
  arenaPullFromSidebarBBtn: document.getElementById('arenaPullFromSidebarBBtn'),
  arenaSameAsABtn: document.getElementById('arenaSameAsABtn'),
  arenaPushToSidebarBBtn: document.getElementById('arenaPushToSidebarBBtn'),
  arenaQuickSameProviderBBtn: document.getElementById('arenaQuickSameProviderBBtn'),

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
  chatAttachmentPreviewBar: document.getElementById('chatAttachmentPreviewBar'),
  chatAttachmentThumbnailImg: document.getElementById('chatAttachmentThumbnailImg'),
  chatAttachmentFileName: document.getElementById('chatAttachmentFileName'),
  chatRemoveAttachmentBtn: document.getElementById('chatRemoveAttachmentBtn'),
  chatImageFileInput: document.getElementById('chatImageFileInput'),

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
  saveToolsBtn: document.getElementById('saveToolsBtn'),

  // Tool Simulator Modal
  toolMockModal: document.getElementById('toolMockModal'),
  modalToolName: document.getElementById('modalToolName'),
  modalToolId: document.getElementById('modalToolId'),
  toolOutputTextarea: document.getElementById('toolOutputTextarea'),
  closeToolModalBtn: document.getElementById('closeToolModalBtn'),
  cancelToolModalBtn: document.getElementById('cancelToolModalBtn'),
  submitToolOutputBtn: document.getElementById('submitToolOutputBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedPreferences();
  bindEventListeners();
  initModeSwitcher();
  initDrawers();
  initChatThread();
  initArenaMode();
  initMultimodalVision();
  initToolModal();
  updateProviderUI(state.provider, true);
  checkServerHealth();

  // If user was previously on Arena or Chat, restore that view
  if (state.currentMode && state.currentMode !== 'playground') {
    switchMode(state.currentMode, true);
  }
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

// Load preferences and all configurations from localStorage
function loadSavedPreferences() {
  try {
    const savedTheme = localStorage.getItem('omnilm_theme') || 'theme-cream-latte';
    setTheme(savedTheme, false);

    // 1. Restore cached detected models for all providers
    for (const p of Object.keys(PROVIDER_PRESETS)) {
      const cached = localStorage.getItem(`omnilm_detected_models_${p}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            PROVIDER_PRESETS[p].models = parsed;
          }
        } catch (e) {}
      }
    }

    // 2. Restore per-provider custom baseUrl & model memory
    const savedMem = localStorage.getItem('omnilm_provider_memory');
    if (savedMem) {
      try {
        state.providerMemory = JSON.parse(savedMem) || {};
      } catch (e) {}
    }

    // 3. Restore saved API keys
    const savedKeys = localStorage.getItem('omnilm_api_keys');
    if (savedKeys) {
      state.savedKeys = JSON.parse(savedKeys);
    }

    // 4. Restore Full Workspace State
    let config = null;
    const savedAppStateJson = localStorage.getItem('omnilm_app_state');
    if (savedAppStateJson) {
      try {
        config = JSON.parse(savedAppStateJson);
      } catch (e) {}
    }

    // Fallback to legacy config if app_state not yet created
    if (!config) {
      const savedConfig = localStorage.getItem('omnilm_last_config');
      if (savedConfig) {
        try {
          config = JSON.parse(savedConfig);
        } catch (e) {}
      }
    }

    if (config) {
      // Active provider
      if (config.provider && PROVIDER_PRESETS[config.provider]) {
        state.provider = config.provider;
        if (elements.providerSelect) elements.providerSelect.value = config.provider;
      }

      // Base URL
      if (config.baseUrl) {
        state.baseUrl = config.baseUrl;
        if (elements.baseUrlInput) elements.baseUrlInput.value = config.baseUrl;
      } else {
        const defaultBase = PROVIDER_PRESETS[state.provider]?.baseUrl || 'http://localhost:8000/v1';
        state.baseUrl = defaultBase;
        if (elements.baseUrlInput) elements.baseUrlInput.value = defaultBase;
      }

      // Model Identifier
      if (config.model) {
        state.model = config.model;
        if (elements.modelInput) elements.modelInput.value = config.model;
      } else {
        const defaultMod = PROVIDER_PRESETS[state.provider]?.defaultModel || 'custom-model';
        state.model = defaultMod;
        if (elements.modelInput) elements.modelInput.value = defaultMod;
      }

      // Parameters
      if (config.temperature !== undefined) {
        state.temperature = config.temperature;
        if (elements.tempSlider) elements.tempSlider.value = config.temperature;
        if (elements.tempValue) elements.tempValue.textContent = Number(config.temperature).toFixed(1);
      }
      if (config.topP !== undefined && elements.topPSlider) {
        state.topP = config.topP;
        elements.topPSlider.value = config.topP;
        if (elements.topPValue) elements.topPValue.textContent = Number(config.topP).toFixed(2);
      }
      if (config.jsonMode !== undefined && elements.jsonModeToggle) {
        state.jsonMode = Boolean(config.jsonMode);
        elements.jsonModeToggle.checked = Boolean(config.jsonMode);
      }
      if (config.seed !== undefined && elements.seedInput) {
        elements.seedInput.value = config.seed !== null && config.seed !== undefined ? config.seed : '';
        state.seed = config.seed ? parseInt(config.seed, 10) : null;
        if (elements.seedValue) elements.seedValue.textContent = config.seed ? config.seed : 'None';
      }
      if (config.stop !== undefined && elements.stopInput) {
        elements.stopInput.value = Array.isArray(config.stop) ? config.stop.join(', ') : (config.stop || '');
        state.stop = elements.stopInput.value ? elements.stopInput.value.split(',').map(s => s.trim()).filter(Boolean) : [];
      }
      if (config.maxTokens !== undefined) {
        state.maxTokens = config.maxTokens;
        if (elements.maxTokensInput) elements.maxTokensInput.value = config.maxTokens;
        if (elements.maxTokensValue) elements.maxTokensValue.textContent = config.maxTokens;
      }
      if (config.stream !== undefined) {
        state.stream = Boolean(config.stream);
        if (elements.streamToggle) elements.streamToggle.checked = Boolean(config.stream);
      }

      // System Prompt
      if (config.systemPrompt !== undefined && elements.systemPromptInput) {
        state.systemPrompt = config.systemPrompt;
        elements.systemPromptInput.value = config.systemPrompt;
        if (elements.chatSystemText) {
          const sys = config.systemPrompt.trim();
          elements.chatSystemText.textContent = sys ? (sys.length > 60 ? sys.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
        }
      }

      // User Prompt (Playground)
      if (config.userPrompt !== undefined && elements.userPromptInput) {
        elements.userPromptInput.value = config.userPrompt;
        if (elements.charCount) elements.charCount.textContent = `${config.userPrompt.length} chars`;
      }

      // Parameters accordion state
      if (config.paramsCollapsed === false && elements.paramsBody && elements.paramsArrow) {
        elements.paramsBody.classList.remove('collapsed');
        elements.paramsArrow.classList.add('rotated');
      }

      // Active Mode Tab
      if (config.currentMode) {
        state.currentMode = config.currentMode;
      }
    }

    const savedSaveKeyCheck = localStorage.getItem('omnilm_save_keys_enabled');
    if (savedSaveKeyCheck === 'true' && elements.saveKeyCheck) {
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
    updateProviderUI(state.provider, false);
    saveAllState();
  });

  // Base URL Change
  elements.baseUrlInput.addEventListener('input', (e) => {
    state.baseUrl = e.target.value;
    updateCurlPreview();
    debouncedSaveState();
  });

  // Reset Base URL Button
  elements.resetUrlBtn.addEventListener('click', () => {
    const preset = PROVIDER_PRESETS[state.provider];
    if (preset) {
      elements.baseUrlInput.value = preset.baseUrl;
      state.baseUrl = preset.baseUrl;
      updateCurlPreview();
      saveAllState();
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
    debouncedSaveState();
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
    saveAllState();
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
    debouncedSaveState();
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
      saveAllState();
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
    saveAllState();
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
    debouncedSaveState();
    updateCodeSnippets();
  });

  // Top-P Slider
  if (elements.topPSlider) {
    elements.topPSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.topP = val;
      if (elements.topPValue) elements.topPValue.textContent = val.toFixed(2);
      debouncedSaveState();
      updateCodeSnippets();
    });
  }

  // JSON Mode Toggle
  if (elements.jsonModeToggle) {
    elements.jsonModeToggle.addEventListener('change', (e) => {
      state.jsonMode = e.target.checked;
      saveAllState();
      updateCodeSnippets();
    });
  }

  // Seed Input
  if (elements.seedInput) {
    elements.seedInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.seed = val ? parseInt(val, 10) : null;
      if (elements.seedValue) elements.seedValue.textContent = val ? val : 'None';
      debouncedSaveState();
      updateCodeSnippets();
    });
  }

  // Stop Sequences Input
  if (elements.stopInput) {
    elements.stopInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.stop = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
      debouncedSaveState();
      updateCodeSnippets();
    });
  }

  // Max Tokens Input
  elements.maxTokensInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) || 2048;
    state.maxTokens = val;
    elements.maxTokensValue.textContent = val;
    debouncedSaveState();
    updateCodeSnippets();
  });

  // Stream Toggle
  elements.streamToggle.addEventListener('change', (e) => {
    state.stream = e.target.checked;
    saveAllState();
    updateCodeSnippets();
  });

  // System Prompt Input
  elements.systemPromptInput.addEventListener('input', (e) => {
    state.systemPrompt = e.target.value;
    updateCodeSnippets();
    if (elements.chatSystemText) {
      const sys = state.systemPrompt.trim();
      elements.chatSystemText.textContent = sys ? (sys.length > 60 ? sys.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
    }
    debouncedSaveState();
  });

  // System Prompt Presets
  document.querySelectorAll('.system-presets-row .btn-chip-micro').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-sys') || '';
      elements.systemPromptInput.value = val;
      state.systemPrompt = val;
      if (elements.chatSystemText) {
        elements.chatSystemText.textContent = val ? (val.length > 60 ? val.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
      }
      updateCodeSnippets();
      saveAllState();
      showToast('System prompt preset loaded', 'info');
    });
  });

  // Code Export Language Selection
  document.querySelectorAll('.code-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.code-lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCodeLang = btn.getAttribute('data-lang') || 'curl';
      updateCodeSnippets();
    });
  });

  if (elements.copyCodeSnippetBtn) {
    elements.copyCodeSnippetBtn.addEventListener('click', () => {
      const text = elements.codeSnippetViewer ? elements.codeSnippetViewer.textContent : '';
      copyToClipboard(text, `${(state.activeCodeLang || 'code').toUpperCase()} snippet copied to clipboard`);
    });
  }

  // User Prompt Input
  elements.userPromptInput.addEventListener('input', (e) => {
    const text = e.target.value;
    elements.charCount.textContent = `${text.length} chars`;
    updateCurlPreview();
    debouncedSaveState();
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
    saveAllState();
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
    saveAllState();
  });

  // Sample prompt chips in console
  document.querySelectorAll('.sample-prompts .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-fill');
      elements.userPromptInput.value = text;
      elements.charCount.textContent = `${text.length} chars`;
      updateCurlPreview();
      saveAllState();
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

  if (elements.copyCurlBtn && elements.curlViewer) {
    elements.copyCurlBtn.addEventListener('click', () => {
      const text = elements.curlViewer.textContent;
      copyToClipboard(text, 'cURL command copied to clipboard');
    });
  }

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

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetMode = btn.getAttribute('data-mode');
      if (!targetMode) return;
      switchMode(targetMode, false);
    });
  });
}

function switchMode(targetMode, silent = false) {
  if (!targetMode) return;
  state.currentMode = targetMode;

  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeViews = document.querySelectorAll('.mode-view');

  modeButtons.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-mode') === targetMode);
  });
  modeViews.forEach(v => {
    v.classList.toggle('active', v.id === `${targetMode}ModeView`);
  });

  if (targetMode === 'chat') {
    if (elements.chatSystemText) {
      const sys = state.systemPrompt.trim();
      elements.chatSystemText.textContent = sys ? (sys.length > 60 ? sys.slice(0, 60) + '...' : sys) : 'Default assistant prompt';
    }
  }

  if (!silent) {
    saveAllState();
  }
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
    <button type="button" class="btn-remove-header" title="Remove header">✕</button>
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
function updateProviderUI(providerKey, isInitialLoad = false) {
  const preset = PROVIDER_PRESETS[providerKey] || PROVIDER_PRESETS.custom;

  // Endpoint Hints
  if (elements.endpointHint) elements.endpointHint.textContent = preset.endpointHint;
  if (elements.keyHint) elements.keyHint.textContent = preset.keyHint;

  // Restore API key if saved
  if (state.savedKeys && state.savedKeys[providerKey]) {
    if (elements.apiKeyInput) elements.apiKeyInput.value = state.savedKeys[providerKey];
    state.apiKey = state.savedKeys[providerKey];
  } else {
    if (elements.apiKeyInput) elements.apiKeyInput.value = '';
    state.apiKey = '';
  }

  if (isInitialLoad) {
    // Preserve values restored by loadSavedPreferences from localStorage
    if (elements.baseUrlInput) {
      if (!elements.baseUrlInput.value) elements.baseUrlInput.value = preset.baseUrl;
      state.baseUrl = elements.baseUrlInput.value;
    }
    if (elements.modelInput) {
      if (!elements.modelInput.value) elements.modelInput.value = preset.defaultModel;
      state.model = elements.modelInput.value;
    }
  } else {
    // Switching provider manually: check if user had previously customized this provider
    const remembered = state.providerMemory && state.providerMemory[providerKey];
    const targetBaseUrl = remembered?.baseUrl || preset.baseUrl;
    const targetModel = remembered?.model || preset.defaultModel;

    if (elements.baseUrlInput) elements.baseUrlInput.value = targetBaseUrl;
    state.baseUrl = targetBaseUrl;

    if (elements.modelInput) elements.modelInput.value = targetModel;
    state.model = targetModel;
  }

  // Render Model Preset Chips
  renderModelChips(preset.models);

  // Update selection
  updateModelChipSelection();

  // Update code snippets preview
  updateCodeSnippets();

  if (elements.arenaModelAName) {
    elements.arenaModelAName.textContent = state.model || 'Model A (Primary)';
  }

  // If local provider (LM Studio or Ollama), probe server connectivity
  if (providerKey === 'lmstudio' || providerKey === 'ollama') {
    probeLocalServer(providerKey);
  } else {
    if (elements.localModelStatusBar) {
      elements.localModelStatusBar.style.display = 'none';
    }
  }
}

async function probeLocalServer(provider) {
  if (provider !== 'lmstudio' && provider !== 'ollama') return;
  const baseUrl = elements.baseUrlInput ? elements.baseUrlInput.value.trim() : (PROVIDER_PRESETS[provider]?.baseUrl || '');
  const providerName = provider === 'lmstudio' ? 'LM Studio' : 'Ollama';

  if (elements.localModelStatusBar) {
    elements.localModelStatusBar.style.display = 'flex';
    elements.modelStatusIndicator.className = 'model-status-indicator checking';
    elements.modelStatusLabel.innerHTML = `<span style="color:var(--text-muted);">Probing ${providerName} (${baseUrl})...</span>`;
    if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
    if (elements.ejectModelBtn) elements.ejectModelBtn.style.display = 'none';
  }

  try {
    const url = `/api/models?provider=${encodeURIComponent(provider)}&baseUrl=${encodeURIComponent(baseUrl)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (state.provider !== provider) return;

    if (res.ok && data.success && Array.isArray(data.models)) {
      if (!state.localServerStatus) state.localServerStatus = {};
      state.localServerStatus[provider] = true;

      PROVIDER_PRESETS[provider].models = data.models;
      try {
        localStorage.setItem(`omnilm_detected_models_${provider}`, JSON.stringify(data.models));
      } catch (e) {}

      renderModelChips(data.models);

      if (data.activeLoadedModel) {
        elements.modelInput.value = data.activeLoadedModel;
        state.model = data.activeLoadedModel;
        updateModelChipSelection();
        saveAllState();
      }
    } else {
      throw new Error(data.error || 'Server unreachable');
    }
  } catch (err) {
    if (state.provider !== provider) return;
    if (!state.localServerStatus) state.localServerStatus = {};
    state.localServerStatus[provider] = false;

    // Reset models in preset so they are unverified
    PROVIDER_PRESETS[provider].models = [PROVIDER_PRESETS[provider].defaultModel];
    renderModelChips(PROVIDER_PRESETS[provider].models);

    if (elements.localModelStatusBar) {
      elements.localModelStatusBar.style.display = 'flex';
      elements.modelStatusIndicator.className = 'model-status-indicator offline';
      elements.modelStatusLabel.innerHTML = `<strong>${providerName} is OFFLINE</strong> · <span style="color:var(--text-muted);">Start local server</span>`;
      if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
      if (elements.ejectModelBtn) elements.ejectModelBtn.style.display = 'none';
    }
  }
}

function renderModelChips(models) {
  elements.modelChipsContainer.innerHTML = '';
  if (!models || models.length === 0) {
    if (elements.localModelStatusBar) elements.localModelStatusBar.style.display = 'none';
    return;
  }

  models.forEach(item => {
    const isModelObj = typeof item === 'object' && item !== null;
    const modelId = isModelObj ? item.id : item;
    const modelName = isModelObj ? (item.name || item.id) : item;
    // CRITICAL: A model is only loaded if explicitly confirmed by a server scan (item.isLoaded === true)
    // Static fallback strings (like 'local-model' or 'llama3.2') are UNVERIFIED and must NOT default to true!
    const isLoaded = isModelObj ? Boolean(item.isLoaded) : false;
    const hasStatusKnown = isModelObj && typeof item.isLoaded === 'boolean';

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.modelId = modelId;
    chip.className = 'chip' + (modelId === state.model ? ' active' : '') + (hasStatusKnown ? (isLoaded ? ' chip-loaded' : ' chip-ondisk') : '');

    let labelHtml = escapeHtml(modelName);
    if ((state.provider === 'lmstudio' || state.provider === 'ollama') && hasStatusKnown) {
      if (isLoaded) {
        labelHtml = `<span class="chip-status-tag loaded">● READY</span> ${escapeHtml(modelName)}`;
      } else {
        labelHtml = `<span class="chip-status-tag ondisk">On Disk</span> ${escapeHtml(modelName)}`;
      }
    }
    chip.innerHTML = labelHtml;

    if (isModelObj && (item.size || item.params || item.quantization)) {
      const details = [item.params, item.quantization, item.size, isLoaded ? 'Active in Memory' : 'Stored on Disk'].filter(Boolean).join(' · ');
      chip.title = `${modelId} (${details})`;
    }

    chip.addEventListener('click', () => {
      elements.modelInput.value = modelId;
      state.model = modelId;
      updateModelChipSelection();
      updateCodeSnippets();
      if (elements.arenaModelAName) {
        elements.arenaModelAName.textContent = modelId;
      }
      saveAllState();
    });
    elements.modelChipsContainer.appendChild(chip);
  });

  // Update status bar for current active model
  const currentModelId = elements.modelInput.value.trim() || state.model;
  const currentObj = models.find(m => (typeof m === 'string' ? m : m.id) === currentModelId);
  updateModelStatusUI(typeof currentObj === 'object' ? currentObj : (currentModelId ? { id: currentModelId, name: currentModelId } : null));
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
  updateModelStatusUI(typeof currentObj === 'object' ? currentObj : (currentVal ? { id: currentVal, name: currentVal } : null));
}

function updateModelStatusUI(modelObj) {
  if (!elements.localModelStatusBar) return;

  const isLocalProvider = state.provider === 'lmstudio' || state.provider === 'ollama';
  if (!isLocalProvider) {
    elements.localModelStatusBar.style.display = 'none';
    return;
  }

  elements.localModelStatusBar.style.display = 'flex';
  const providerName = state.provider === 'lmstudio' ? 'LM Studio' : 'Ollama';

  // If local server is known to be offline:
  if (state.localServerStatus && state.localServerStatus[state.provider] === false) {
    elements.modelStatusIndicator.className = 'model-status-indicator offline';
    elements.modelStatusLabel.innerHTML = `<strong>${providerName} is OFFLINE</strong> · <span style="color:var(--text-muted);">Start local server</span>`;
    if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
    if (elements.ejectModelBtn) elements.ejectModelBtn.style.display = 'none';
    return;
  }

  // If model status is unverified (not scanned from live server)
  if (!modelObj || typeof modelObj.isLoaded !== 'boolean') {
    elements.modelStatusIndicator.className = 'model-status-indicator ondisk';
    elements.modelStatusLabel.innerHTML = `<strong>${escapeHtml(modelObj?.name || modelObj?.id || state.model || 'Model')}</strong> · <span style="color:var(--text-muted);">Unverified (Click ↻ Detect Models)</span>`;
    if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
    if (elements.ejectModelBtn) elements.ejectModelBtn.style.display = 'none';
    return;
  }

  const name = modelObj.name || modelObj.id || 'Local Model';
  const modelId = modelObj.id || modelObj.name || name;
  const isLoaded = Boolean(modelObj.isLoaded);

  if (isLoaded) {
    elements.modelStatusIndicator.className = 'model-status-indicator loaded';
    elements.modelStatusLabel.innerHTML = `<strong>${escapeHtml(name)}</strong> is <span style="color:#22c55e;font-weight:600;">ACTIVE IN MEMORY</span>`;
    if (elements.loadModelBtn) elements.loadModelBtn.style.display = 'none';
    if (elements.ejectModelBtn) {
      elements.ejectModelBtn.style.display = 'inline-block';
      elements.ejectModelBtn.dataset.modelId = modelId;
    }
  } else {
    elements.modelStatusIndicator.className = 'model-status-indicator ondisk';
    elements.modelStatusLabel.innerHTML = `<strong>${escapeHtml(name)}</strong> is <span style="color:var(--text-muted);">ON DISK (Not loaded)</span>`;
    if (elements.loadModelBtn) {
      elements.loadModelBtn.style.display = 'inline-block';
      elements.loadModelBtn.dataset.modelId = modelId;
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
  btn.innerHTML = '<span>⏏ Ejecting...</span>';
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

let saveStateDebounceTimer = null;
function debouncedSaveState() {
  clearTimeout(saveStateDebounceTimer);
  saveStateDebounceTimer = setTimeout(saveAllState, 250);
}

function saveAllState() {
  try {
    const appState = {
      version: 2,
      currentMode: state.currentMode || 'playground',
      provider: state.provider || 'custom',
      baseUrl: elements.baseUrlInput ? elements.baseUrlInput.value.trim() : (state.baseUrl || ''),
      model: elements.modelInput ? elements.modelInput.value.trim() : (state.model || ''),
      temperature: state.temperature ?? 0.7,
      topP: state.topP ?? 1.0,
      jsonMode: elements.jsonModeToggle ? elements.jsonModeToggle.checked : (state.jsonMode ?? false),
      seed: elements.seedInput ? elements.seedInput.value.trim() : '',
      stop: elements.stopInput ? elements.stopInput.value.trim() : '',
      maxTokens: state.maxTokens ?? 2048,
      stream: elements.streamToggle ? elements.streamToggle.checked : (state.stream ?? true),
      timeout: state.timeout ?? 60,
      systemPrompt: elements.systemPromptInput ? elements.systemPromptInput.value : (state.systemPrompt || ''),
      userPrompt: elements.userPromptInput ? elements.userPromptInput.value : '',
      paramsCollapsed: elements.paramsBody ? elements.paramsBody.classList.contains('collapsed') : true,

      // Arena Dual Comparison Configuration
      arenaPrompt: elements.arenaPromptInput ? elements.arenaPromptInput.value : '',
      arenaLockSameProvider: elements.arenaLockSameProviderCheck ? elements.arenaLockSameProviderCheck.checked : false,
      arenaA: {
        provider: elements.arenaModelAProvider ? elements.arenaModelAProvider.value : 'custom',
        model: elements.arenaModelAInput ? elements.arenaModelAInput.value.trim() : '',
        baseUrl: elements.arenaUrlA ? elements.arenaUrlA.value.trim() : '',
        key: elements.arenaKeyA ? elements.arenaKeyA.value.trim() : '',
        advancedOpen: elements.arenaAdvancedPanelA ? !elements.arenaAdvancedPanelA.classList.contains('collapsed') : false
      },
      arenaB: {
        provider: elements.arenaModelBProvider ? elements.arenaModelBProvider.value : 'openai',
        model: elements.arenaModelBInput ? elements.arenaModelBInput.value.trim() : '',
        baseUrl: elements.arenaUrlB ? elements.arenaUrlB.value.trim() : '',
        key: elements.arenaKeyB ? elements.arenaKeyB.value.trim() : '',
        advancedOpen: elements.arenaAdvancedPanelB ? !elements.arenaAdvancedPanelB.classList.contains('collapsed') : false
      }
    };

    localStorage.setItem('omnilm_app_state', JSON.stringify(appState));

    // Also update legacy key for backward compatibility
    localStorage.setItem('omnilm_last_config', JSON.stringify({
      provider: appState.provider,
      temperature: appState.temperature,
      topP: appState.topP,
      jsonMode: appState.jsonMode,
      maxTokens: appState.maxTokens,
      stream: appState.stream
    }));

    // Update per-provider custom endpoint/model memory
    if (!state.providerMemory) state.providerMemory = {};
    if (appState.provider) {
      state.providerMemory[appState.provider] = {
        baseUrl: appState.baseUrl,
        model: appState.model
      };
      localStorage.setItem('omnilm_provider_memory', JSON.stringify(state.providerMemory));
    }
  } catch (err) {
    console.warn('Could not save workspace state to localStorage:', err);
  }
}

function saveConfigPreference() {
  saveAllState();
}

// Ensure state is flushed immediately on reload or tab switch
window.addEventListener('beforeunload', () => {
  saveAllState();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveAllState();
  }
});

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

// Auto-Detect Models (Cloud APIs, LM Studio, Ollama, OpenAI-compatible)
async function detectModelsFromServer() {
  const btn = elements.detectModelsBtn;
  if (!btn) return;
  const originalText = btn.textContent;

  const provider = state.provider;
  const baseUrl = elements.baseUrlInput ? (elements.baseUrlInput.value.trim() || PROVIDER_PRESETS[provider]?.baseUrl) : '';
  const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';

  // Cloud provider API key pre-validation
  const requiresKey = ['openai', 'claude', 'gemini', 'deepseek', 'groq'].includes(provider);
  if (requiresKey && !apiKey) {
    showToast(`Please enter your ${PROVIDER_PRESETS[provider]?.name || provider} API key to detect available models.`, 'warning');
    if (elements.apiKeyInput) {
      elements.apiKeyInput.focus();
      elements.apiKeyInput.classList.add('input-highlight');
      setTimeout(() => {
        if (elements.apiKeyInput) elements.apiKeyInput.classList.remove('input-highlight');
      }, 2000);
    }
    return;
  }

  btn.textContent = '↻ Scanning...';
  btn.disabled = true;

  try {
    const url = `/api/models?provider=${encodeURIComponent(provider)}&baseUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    if (!state.localServerStatus) state.localServerStatus = {};
    if (provider === 'lmstudio' || provider === 'ollama') {
      state.localServerStatus[provider] = true;
    }

    if (!data.models || data.models.length === 0) {
      showToast(`Connected to ${PROVIDER_PRESETS[provider]?.name || provider}, but no chat models were found.`, 'info');
      return;
    }

    PROVIDER_PRESETS[provider].models = data.models;
    try {
      localStorage.setItem(`omnilm_detected_models_${provider}`, JSON.stringify(data.models));
    } catch (e) {}

    renderModelChips(data.models);

    // Prefer active loaded model if present, otherwise first available
    const targetModelId = data.activeLoadedModel || (typeof data.models[0] === 'string' ? data.models[0] : data.models[0]?.id);
    if (targetModelId) {
      if (elements.modelInput) elements.modelInput.value = targetModelId;
      state.model = targetModelId;
      updateModelChipSelection();
      updateCodeSnippets();
      if (elements.arenaModelAName) {
        elements.arenaModelAName.textContent = targetModelId;
      }
      saveAllState();
    }

    // Synchronize Arena preset chips if Arena provider matches
    if (elements.arenaModelAProvider && elements.arenaModelAProvider.value === provider) {
      renderArenaPresetChips('A', provider);
    }
    if (elements.arenaModelBProvider && elements.arenaModelBProvider.value === provider) {
      renderArenaPresetChips('B', provider);
    }

    const isCloud = ['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(provider);
    if (isCloud) {
      showToast(`Successfully pulled ${data.models.length} model(s) from ${PROVIDER_PRESETS[provider]?.name || provider}!`, 'success');
    } else {
      const loadedCount = data.models.filter(m => typeof m === 'object' && m.isLoaded).length;
      if (loadedCount > 0) {
        showToast(`Found ${data.models.length} model(s): ${loadedCount} active in memory, ${data.models.length - loadedCount} on disk.`, 'success');
      } else {
        showToast(`Detected ${data.models.length} model(s) from server! (None loaded in memory)`, 'info');
      }
    }
  } catch (err) {
    if (provider === 'lmstudio' || provider === 'ollama') {
      if (!state.localServerStatus) state.localServerStatus = {};
      state.localServerStatus[provider] = false;
      updateModelStatusUI(null);
    }
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

    // Multimodal support: if image is attached, send vision array format
    if (state.attachedImage && state.attachedImage.dataUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: state.attachedImage.dataUrl } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: promptText });
    }

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

    if (state.topP !== undefined && state.topP !== 1.0) {
      requestBody.topP = state.topP;
    }
    if (state.seed !== null && state.seed !== '') {
      requestBody.seed = Number(state.seed);
    }
    if (state.stop && state.stop.length > 0) {
      requestBody.stop = state.stop;
    }
    if (state.jsonMode) {
      requestBody.responseFormat = { type: 'json_object' };
    }

    // Attach custom headers if defined
    if (Object.keys(state.customHeaders).length > 0) {
      requestBody.customHeaders = state.customHeaders;
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
          const streamHeaders = payload.upstreamHeaders || payload.headers;
          if (streamHeaders) {
            state.lastUpstreamHeaders = streamHeaders;
            renderResponseHeaders(streamHeaders);
          }

          // Capture tool calls from stream
          if (payload.tool_calls && payload.tool_calls.length > 0) {
            state.lastToolCalls = payload.tool_calls;
            renderToolCalls(payload.tool_calls);
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
  const respHeaders = data.upstreamHeaders || data.headers;
  if (respHeaders) {
    state.lastUpstreamHeaders = respHeaders;
    renderResponseHeaders(respHeaders);
  }

  // Capture reasoning
  if (data.reasoning) {
    renderReasoning(data.reasoning);
  }

  // Capture tool calls
  if (data.tool_calls && data.tool_calls.length > 0) {
    state.lastToolCalls = data.tool_calls;
    renderToolCalls(data.tool_calls);
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

// Markdown parser & renderer with syntax highlighting and pre-block copy buttons
function renderMarkdown(content) {
  if (!elements.renderedOutput) return;

  let parsedHtml = '';
  if (window.marked) {
    try {
      parsedHtml = marked.parse(content);
    } catch {
      parsedHtml = `<pre>${escapeHtml(content)}</pre>`;
    }
  } else {
    parsedHtml = `<pre>${escapeHtml(content)}</pre>`;
  }

  elements.renderedOutput.innerHTML = parsedHtml;

  // Syntax highlighting with highlight.js
  if (window.hljs) {
    elements.renderedOutput.querySelectorAll('pre code').forEach((block) => {
      try {
        hljs.highlightElement(block);
      } catch (e) {
        console.warn('hljs error:', e);
      }
    });
  }

  addCopyButtonsToPreBlocks(elements.renderedOutput);
}

function addCopyButtonsToPreBlocks(container) {
  if (!container) return;
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.btn-copy-code')) return;
    pre.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-copy-code';
    btn.textContent = 'Copy';
    btn.title = 'Copy code snippet';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = pre.querySelector('code')?.innerText || pre.innerText;
      copyToClipboard(code, 'Code snippet copied to clipboard');
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    });

    pre.appendChild(btn);
  });
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

// Token Pricing Rates per 1,000,000 tokens (USD)
const MODEL_PRICING = {
  'gpt-4o': { input: 2.50, output: 10.00, tier: 'Premium Tier' },
  'gpt-4o-mini': { input: 0.15, output: 0.60, tier: 'Economy Tier' },
  'o3-mini': { input: 1.10, output: 4.40, tier: 'Mid Tier' },
  'o1': { input: 15.00, output: 60.00, tier: 'Frontier Tier' },
  'claude-3-7-sonnet': { input: 3.00, output: 15.00, tier: 'Premium Tier' },
  'claude-3-5-sonnet': { input: 3.00, output: 15.00, tier: 'Premium Tier' },
  'claude-3-5-haiku': { input: 0.80, output: 4.00, tier: 'Economy Tier' },
  'claude-3-opus': { input: 15.00, output: 75.00, tier: 'Frontier Tier' },
  'gemini-2.5-flash': { input: 0.10, output: 0.40, tier: 'Ultra Economy' },
  'gemini-2.0-flash': { input: 0.10, output: 0.40, tier: 'Ultra Economy' },
  'gemini-1.5-pro': { input: 1.25, output: 5.00, tier: 'Mid Tier' },
  'deepseek-chat': { input: 0.14, output: 0.28, tier: 'Ultra Economy' },
  'deepseek-reasoner': { input: 0.55, output: 2.19, tier: 'Economy Tier' },
  'llama-3.3-70b': { input: 0.59, output: 0.79, tier: 'Economy Open-Weights' },
  'llama-3.1-8b': { input: 0.05, output: 0.08, tier: 'Ultra Economy' }
};

function calculateCost(provider, modelId, promptTokens, completionTokens) {
  if (provider === 'lmstudio' || provider === 'ollama') {
    return {
      costFormatted: '$0.000000 (Local / Free)',
      tier: 'Local Device (Zero API Cost)'
    };
  }

  const modelLower = (modelId || '').toLowerCase();
  let pricing = null;
  for (const [key, val] of Object.entries(MODEL_PRICING)) {
    if (modelLower.includes(key)) {
      pricing = val;
      break;
    }
  }

  if (!pricing) {
    pricing = { input: 1.00, output: 3.00, tier: 'Standard API Tier' };
  }

  const cost = ((promptTokens * pricing.input) + (completionTokens * pricing.output)) / 1000000;
  return {
    costFormatted: `$${cost.toFixed(6)}`,
    tier: `${pricing.tier} ($${pricing.input.toFixed(2)} / $${pricing.output.toFixed(2)} per 1M)`
  };
}

// Update Token Counters & Tokenomics UI
function updateTokensUI(usage) {
  const pTokens = usage.prompt_tokens ?? usage.promptTokens ?? usage.input_tokens ?? '--';
  const cTokens = usage.completion_tokens ?? usage.completionTokens ?? usage.output_tokens ?? '--';
  const tTokens = usage.total_tokens ?? usage.totalTokens ?? (pTokens !== '--' && cTokens !== '--' ? Number(pTokens) + Number(cTokens) : '--');

  if (elements.tokensValue) elements.tokensValue.textContent = `${pTokens} / ${cTokens}`;
  if (elements.totalTokensValue) elements.totalTokensValue.textContent = `${tTokens}`;

  if (elements.statPromptTokens) elements.statPromptTokens.textContent = pTokens;
  if (elements.statCompletionTokens) elements.statCompletionTokens.textContent = cTokens;
  if (elements.statTotalTokens) elements.statTotalTokens.textContent = tTokens;

  const numP = Number(pTokens) || 0;
  const numC = Number(cTokens) || 0;
  const costInfo = calculateCost(state.provider, state.model, numP, numC);
  if (elements.statEstimatedCost) elements.statEstimatedCost.textContent = costInfo.costFormatted;
  if (elements.statCostTier) elements.statCostTier.textContent = costInfo.tier;
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

// Multi-Language Code Snippet Generator (cURL, Python SDK, JavaScript Fetch)
function updateCodeSnippets() {
  const provider = state.provider;
  const baseUrl = elements.baseUrlInput ? elements.baseUrlInput.value.trim() : (PROVIDER_PRESETS[provider]?.baseUrl || 'http://localhost:8000/v1');
  const model = (elements.modelInput ? elements.modelInput.value.trim() : '') || state.model || 'gpt-4o';
  const apiKey = (elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '') || state.apiKey || 'YOUR_API_KEY';
  const prompt = (elements.userPromptInput ? elements.userPromptInput.value.trim() : '') || 'What is life?';
  const temperature = state.temperature ?? 0.7;
  const maxTokens = state.maxTokens ?? 2048;
  const stream = Boolean(state.stream);
  const sysPrompt = state.systemPrompt ? state.systemPrompt.trim() : '';

  let code = '';
  const lang = state.activeCodeLang || 'curl';

  if (lang === 'curl') {
    if (provider === 'claude' || provider === 'custom_anthropic') {
      let endpoint = 'https://api.anthropic.com/v1/messages';
      if (baseUrl) {
        const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
        if (cleanUrl.endsWith('/messages')) endpoint = cleanUrl;
        else if (cleanUrl.endsWith('/v1')) endpoint = `${cleanUrl}/messages`;
        else endpoint = `${cleanUrl}/v1/messages`;
      }
      let extraHeadersStr = '';
      if (Object.keys(state.customHeaders).length > 0) {
        for (const [k, v] of Object.entries(state.customHeaders)) {
          extraHeadersStr += `  -H "${k}: ${v}" \\\n`;
        }
      }
      const messagesArr = [{ role: 'user', content: prompt }];
      const payloadObj = {
        model,
        max_tokens: maxTokens,
        messages: messagesArr
      };
      if (sysPrompt) payloadObj.system = sysPrompt;
      if (temperature !== 1.0) payloadObj.temperature = temperature;
      if (stream) payloadObj.stream = true;

      code = `curl ${endpoint} \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
${extraHeadersStr}  -d '${JSON.stringify(payloadObj, null, 2).replace(/'/g, `'\\''`)}'`;
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

      const isReasoning = (m) => {
        if (!m || typeof m !== 'string') return false;
        const lower = m.trim().toLowerCase();
        const base = lower.includes('/') ? lower.split('/').pop() : lower;
        return base === 'o1' || base.startsWith('o1-') || base === 'o3' || base.startsWith('o3-') || base.startsWith('o4-') || base.includes('-o1') || base.includes('-o3');
      };
      const isO1 = isReasoning(model);

      const messagesArr = [];
      if (sysPrompt) messagesArr.push({ role: isO1 ? 'developer' : 'system', content: sysPrompt });
      messagesArr.push({ role: 'user', content: prompt });

      const payloadObj = {
        model,
        messages: messagesArr,
        stream
      };
      if (isO1) {
        payloadObj.max_completion_tokens = maxTokens;
      } else {
        payloadObj.temperature = temperature;
        payloadObj.max_tokens = maxTokens;
        if (state.topP !== undefined && state.topP !== 1.0) payloadObj.top_p = state.topP;
      }
      if (state.seed !== null && state.seed !== '') payloadObj.seed = Number(state.seed);
      if (state.stop && state.stop.length > 0) payloadObj.stop = state.stop;
      if (state.jsonMode) payloadObj.response_format = { type: 'json_object' };

      code = `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
${extraHeadersStr}  -d '${JSON.stringify(payloadObj, null, 2).replace(/'/g, `'\\''`)}'`;
    }
  } else if (lang === 'python') {
    if (provider === 'claude' || provider === 'custom_anthropic') {
      code = `import os
from anthropic import Anthropic

client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY", "${apiKey}")
)

response = client.messages.create(
    model="${model}",
    max_tokens=${maxTokens},
    temperature=${temperature},
    ${sysPrompt ? `system=${JSON.stringify(sysPrompt)},\n    ` : ''}messages=[
        {"role": "user", "content": ${JSON.stringify(prompt)}}
    ],
    stream=${stream ? 'True' : 'False'}
)

if ${stream ? 'True' : 'False'}:
    for event in response:
        if event.type == "content_block_delta" and hasattr(event.delta, "text"):
            print(event.delta.text, end="", flush=True)
    print()
else:
    print(response.content[0].text)`;
    } else {
      const isReasoning = (m) => {
        if (!m || typeof m !== 'string') return false;
        const lower = m.trim().toLowerCase();
        const base = lower.includes('/') ? lower.split('/').pop() : lower;
        return base === 'o1' || base.startsWith('o1-') || base === 'o3' || base.startsWith('o3-') || base.startsWith('o4-') || base.includes('-o1') || base.includes('-o3');
      };
      const isO1 = isReasoning(model);

      code = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY", "${apiKey}"),
    base_url="${baseUrl}"
)

completion = client.chat.completions.create(
    model="${model}",
    messages=[
        ${sysPrompt ? `{"role": "${isO1 ? 'developer' : 'system'}", "content": ${JSON.stringify(sysPrompt)}},\n        ` : ''}{"role": "user", "content": ${JSON.stringify(prompt)}}
    ],
    ${isO1 ? `max_completion_tokens=${maxTokens}` : `temperature=${temperature},\n    max_tokens=${maxTokens}`},
    stream=${stream ? 'True' : 'False'}${state.seed !== null && state.seed !== '' ? `,\n    seed=${state.seed}` : ''}${state.jsonMode ? `,\n    response_format={"type": "json_object"}` : ''}
)

if ${stream ? 'True' : 'False'}:
    for chunk in completion:
        delta = chunk.choices[0].delta.content or ""
        print(delta, end="", flush=True)
    print()
else:
    print(completion.choices[0].message.content)`;
    }
  } else if (lang === 'javascript') {
    if (provider === 'claude' || provider === 'custom_anthropic') {
      code = `// Anthropic Messages API via Fetch
async function main() {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "${apiKey}",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "${model}",
      max_tokens: ${maxTokens},
      temperature: ${temperature},
      ${sysPrompt ? `system: ${JSON.stringify(sysPrompt)},\n      ` : ''}messages: [
        { role: "user", content: ${JSON.stringify(prompt)} }
      ]
    })
  });

  const data = await response.json();
  console.log(data.content?.[0]?.text);
}

main().catch(console.error);`;
    } else {
      const isReasoning = (m) => {
        if (!m || typeof m !== 'string') return false;
        const lower = m.trim().toLowerCase();
        const base = lower.includes('/') ? lower.split('/').pop() : lower;
        return base === 'o1' || base.startsWith('o1-') || base === 'o3' || base.startsWith('o3-') || base.startsWith('o4-') || base.includes('-o1') || base.includes('-o3');
      };
      const isO1 = isReasoning(model);
      const endpoint = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

      code = `// OpenAI-Compatible Chat Completions via Fetch
async function main() {
  const response = await fetch("${endpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ${apiKey}"
    },
    body: JSON.stringify({
      model: "${model}",
      messages: [
        ${sysPrompt ? `{ role: "${isO1 ? 'developer' : 'system'}", content: ${JSON.stringify(sysPrompt)} },\n        ` : ''}{ role: "user", content: ${JSON.stringify(prompt)} }
      ],
      ${isO1 ? `max_completion_tokens: ${maxTokens}` : `temperature: ${temperature},\n      max_tokens: ${maxTokens}`},
      stream: false${state.jsonMode ? ',\n      response_format: { type: "json_object" }' : ''}
    })
  });

  const data = await response.json();
  console.log(data.choices?.[0]?.message?.content);
}

main().catch(console.error);`;
    }
  }

  if (elements.codeSnippetViewer) {
    elements.codeSnippetViewer.textContent = code;
  }
}
window.updateCurlPreview = updateCodeSnippets;

// Multimodal Vision File Handlers
function initMultimodalVision() {
  function handlePlaygroundFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.attachedImage = {
        dataUrl: e.target.result,
        name: file.name || 'Pasted Image',
        size: `${(file.size / 1024).toFixed(1)} KB`
      };
      if (elements.attachmentThumbnailImg) elements.attachmentThumbnailImg.src = e.target.result;
      if (elements.attachmentFileName) elements.attachmentFileName.textContent = state.attachedImage.name;
      if (elements.attachmentFileSize) elements.attachmentFileSize.textContent = state.attachedImage.size;
      if (elements.attachmentPreviewBar) elements.attachmentPreviewBar.style.display = 'flex';
      showToast(`Image attached: ${state.attachedImage.name}`, 'info');
    };
    reader.readAsDataURL(file);
  }

  function handleChatFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.chatAttachedImage = {
        dataUrl: e.target.result,
        name: file.name || 'Pasted Image',
        size: `${(file.size / 1024).toFixed(1)} KB`
      };
      if (elements.chatAttachmentThumbnailImg) elements.chatAttachmentThumbnailImg.src = e.target.result;
      if (elements.chatAttachmentFileName) elements.chatAttachmentFileName.textContent = state.chatAttachedImage.name;
      if (elements.chatAttachmentPreviewBar) elements.chatAttachmentPreviewBar.style.display = 'flex';
      showToast(`Image attached to chat: ${state.chatAttachedImage.name}`, 'info');
    };
    reader.readAsDataURL(file);
  }

  if (elements.imageFileInput) {
    elements.imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handlePlaygroundFile(file);
      e.target.value = '';
    });
  }

  if (elements.removeAttachmentBtn) {
    elements.removeAttachmentBtn.addEventListener('click', () => {
      state.attachedImage = null;
      if (elements.attachmentPreviewBar) elements.attachmentPreviewBar.style.display = 'none';
      if (elements.attachmentThumbnailImg) elements.attachmentThumbnailImg.src = '';
    });
  }

  if (elements.chatImageFileInput) {
    elements.chatImageFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleChatFile(file);
      e.target.value = '';
    });
  }

  if (elements.chatRemoveAttachmentBtn) {
    elements.chatRemoveAttachmentBtn.addEventListener('click', () => {
      state.chatAttachedImage = null;
      if (elements.chatAttachmentPreviewBar) elements.chatAttachmentPreviewBar.style.display = 'none';
      if (elements.chatAttachmentThumbnailImg) elements.chatAttachmentThumbnailImg.src = '';
    });
  }

  // Global paste handler for pasting screenshots directly from clipboard
  window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (state.currentMode === 'chat') {
          handleChatFile(file);
        } else {
          handlePlaygroundFile(file);
        }
        break;
      }
    }
  });
}

// Tool Calls Rendering & Agentic Loop Simulation
function renderToolCalls(toolCalls) {
  if (!elements.renderedOutput || !toolCalls || toolCalls.length === 0) return;

  const toolContainer = document.createElement('div');
  toolContainer.className = 'tool-calls-wrapper';

  toolCalls.forEach((tc, idx) => {
    const fnName = tc.function?.name || tc.name || 'unnamed_tool';
    const fnArgs = tc.function?.arguments || tc.arguments || '{}';
    const callId = tc.id || `call_${idx + 1}`;

    const card = document.createElement('div');
    card.className = 'tool-call-card';
    card.innerHTML = `
      <div class="tool-call-header">
        <span class="badge-tool-tag">TOOL CALL REQUESTED</span>
        <strong class="tool-fn-name">${escapeHtml(fnName)}</strong>
        <span class="tool-call-id code">${escapeHtml(callId)}</span>
      </div>
      <div class="tool-args-preview">
        <pre><code class="language-json">${escapeHtml(typeof fnArgs === 'string' ? fnArgs : JSON.stringify(fnArgs, null, 2))}</code></pre>
      </div>
      <div class="tool-call-actions">
        <button type="button" class="btn-primary btn-tool-simulate" data-tool-id="${escapeHtml(callId)}" data-tool-name="${escapeHtml(fnName)}">
          Simulate Output & Execute Follow-up
        </button>
      </div>
    `;

    card.querySelector('.btn-tool-simulate').addEventListener('click', () => {
      openToolModal(callId, fnName, fnArgs);
    });

    toolContainer.appendChild(card);
  });

  elements.renderedOutput.appendChild(toolContainer);
}

function initToolModal() {
  if (elements.closeToolModalBtn) {
    elements.closeToolModalBtn.addEventListener('click', () => {
      if (elements.toolMockModal) elements.toolMockModal.close();
    });
  }
  if (elements.cancelToolModalBtn) {
    elements.cancelToolModalBtn.addEventListener('click', () => {
      if (elements.toolMockModal) elements.toolMockModal.close();
    });
  }
  if (elements.submitToolOutputBtn) {
    elements.submitToolOutputBtn.addEventListener('click', () => {
      executeToolFollowup();
    });
  }
}

function openToolModal(callId, fnName, fnArgs) {
  state.pendingToolCall = { callId, fnName, fnArgs };
  if (elements.modalToolName) elements.modalToolName.textContent = fnName;
  if (elements.modalToolId) elements.modalToolId.textContent = callId;

  // Pre-fill smart mock output
  let mockOutput = '{"status": "success", "result": "Sample execution output"}';
  if (fnName.toLowerCase().includes('weather')) {
    mockOutput = '{"location": "San Francisco, CA", "temperature": "68°F", "condition": "Sunny", "humidity": "55%"}';
  } else if (fnName.toLowerCase().includes('sql') || fnName.toLowerCase().includes('db')) {
    mockOutput = '[{"id": 1, "name": "Alpha Project", "status": "active"}, {"id": 2, "name": "Beta Test", "status": "completed"}]';
  }
  if (elements.toolOutputTextarea) elements.toolOutputTextarea.value = mockOutput;

  if (elements.toolMockModal) {
    elements.toolMockModal.showModal();
  }
}

async function executeToolFollowup() {
  if (!state.pendingToolCall) return;
  const { callId, fnName } = state.pendingToolCall;
  const toolResult = elements.toolOutputTextarea ? elements.toolOutputTextarea.value.trim() : '';

  if (elements.toolMockModal) {
    elements.toolMockModal.close();
  }

  showToast(`Submitting tool output for ${fnName}...`, 'info');

  const promptText = elements.userPromptInput ? elements.userPromptInput.value.trim() : '';
  const modelName = elements.modelInput ? elements.modelInput.value.trim() : '';
  const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
  const provider = state.provider;

  // Build 3-turn message sequence: user -> assistant tool_calls -> tool response
  const messages = [];
  if (state.systemPrompt && state.systemPrompt.trim()) {
    messages.push({ role: 'system', content: state.systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: promptText });
  messages.push({
    role: 'assistant',
    content: null,
    tool_calls: state.lastToolCalls || [{
      id: callId,
      type: 'function',
      function: { name: fnName, arguments: state.pendingToolCall.fnArgs }
    }]
  });
  messages.push({
    role: 'tool',
    tool_call_id: callId,
    content: toolResult
  });

  const abortController = new AbortController();
  state.activeAbortController = abortController;
  setExecutionState(true);
  const startTime = Date.now();

  try {
    updateStatusBadge('loading', 'SYNTHESIZING...');

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

    if (Object.keys(state.customHeaders).length > 0) {
      requestBody.customHeaders = state.customHeaders;
      requestBody.headers = state.customHeaders;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');
    if (isSSE && response.ok) {
      await handleStreamResponse(response, startTime, `[Tool Followup] ${promptText}`);
    } else {
      await handleJsonResponse(response, startTime, `[Tool Followup] ${promptText}`);
    }
  } catch (err) {
    renderErrorOutput(`Tool Followup Error: ${err.message}`);
    showToast(`Tool Followup failed: ${err.message}`, 'error');
  } finally {
    setExecutionState(false);
  }
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
    elements.arenaPromptInput.addEventListener('input', () => {
      debouncedSaveState();
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

      // If Same Provider Lock is enabled, mirror to Model B
      if (elements.arenaLockSameProviderCheck?.checked) {
        copyArenaConfig('A', 'B', true);
      }
      updateArenaChipsSelection('A');
      saveAllState();
    });
  }

  if (elements.arenaModelAInput) {
    elements.arenaModelAInput.addEventListener('input', () => {
      updateArenaChipsSelection('A');
      debouncedSaveState();
    });
  }

  if (elements.arenaToggleAdvancedA && elements.arenaAdvancedPanelA) {
    elements.arenaToggleAdvancedA.addEventListener('click', () => {
      const isCollapsed = elements.arenaAdvancedPanelA.classList.toggle('collapsed');
      elements.arenaToggleAdvancedA.classList.toggle('active', !isCollapsed);
      saveAllState();
    });
  }

  // Model A Auth / URL live sync if Lock Same Provider is enabled
  if (elements.arenaKeyA) {
    elements.arenaKeyA.addEventListener('input', () => {
      if (elements.arenaLockSameProviderCheck?.checked && elements.arenaKeyB) {
        elements.arenaKeyB.value = elements.arenaKeyA.value;
      }
      debouncedSaveState();
    });
  }
  if (elements.arenaUrlA) {
    elements.arenaUrlA.addEventListener('input', () => {
      if (elements.arenaLockSameProviderCheck?.checked && elements.arenaUrlB) {
        elements.arenaUrlB.value = elements.arenaUrlA.value;
      }
      debouncedSaveState();
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
      updateArenaChipsSelection('B');
      saveAllState();
    });
  }

  if (elements.arenaModelBInput) {
    elements.arenaModelBInput.addEventListener('input', () => {
      updateArenaChipsSelection('B');
      debouncedSaveState();
    });
  }

  if (elements.arenaToggleAdvancedB && elements.arenaAdvancedPanelB) {
    elements.arenaToggleAdvancedB.addEventListener('click', () => {
      const isCollapsed = elements.arenaAdvancedPanelB.classList.toggle('collapsed');
      elements.arenaToggleAdvancedB.classList.toggle('active', !isCollapsed);
      saveAllState();
    });
  }

  if (elements.arenaKeyB) {
    elements.arenaKeyB.addEventListener('input', () => {
      debouncedSaveState();
    });
  }
  if (elements.arenaUrlB) {
    elements.arenaUrlB.addEventListener('input', () => {
      debouncedSaveState();
    });
  }

  // Toolbar & Card Action Listeners
  // 1. Pull from Sidebar
  if (elements.arenaPullSidebarToABtn) {
    elements.arenaPullSidebarToABtn.addEventListener('click', () => pullSidebarToArena('A'));
  }
  if (elements.arenaPullFromSidebarABtn) {
    elements.arenaPullFromSidebarABtn.addEventListener('click', () => pullSidebarToArena('A'));
  }
  if (elements.arenaPullSidebarToBBtn) {
    elements.arenaPullSidebarToBBtn.addEventListener('click', () => pullSidebarToArena('B'));
  }
  if (elements.arenaPullFromSidebarBBtn) {
    elements.arenaPullFromSidebarBBtn.addEventListener('click', () => pullSidebarToArena('B'));
  }

  // 2. Same Provider / Copy A -> B and B -> A
  if (elements.arenaCopyAtoBBtn) {
    elements.arenaCopyAtoBBtn.addEventListener('click', () => copyArenaConfig('A', 'B'));
  }
  if (elements.arenaSameAsABtn) {
    elements.arenaSameAsABtn.addEventListener('click', () => copyArenaConfig('A', 'B'));
  }
  if (elements.arenaQuickSameProviderBBtn) {
    elements.arenaQuickSameProviderBBtn.addEventListener('click', () => copyArenaConfig('A', 'B'));
  }

  if (elements.arenaCopyBtoABtn) {
    elements.arenaCopyBtoABtn.addEventListener('click', () => copyArenaConfig('B', 'A'));
  }
  if (elements.arenaSameAsBBtn) {
    elements.arenaSameAsBBtn.addEventListener('click', () => copyArenaConfig('B', 'A'));
  }
  if (elements.arenaQuickSameProviderABtn) {
    elements.arenaQuickSameProviderABtn.addEventListener('click', () => copyArenaConfig('B', 'A'));
  }

  // 3. Swap A <-> B
  if (elements.arenaSwapABBtn) {
    elements.arenaSwapABBtn.addEventListener('click', swapArenaConfigs);
  }

  // 4. Push to Sidebar ("Commit & Push" back to active playground)
  if (elements.arenaPushToSidebarABtn) {
    elements.arenaPushToSidebarABtn.addEventListener('click', () => pushArenaToSidebar('A'));
  }
  if (elements.arenaPushToSidebarBBtn) {
    elements.arenaPushToSidebarBBtn.addEventListener('click', () => pushArenaToSidebar('B'));
  }

  // 5. Lock Same Provider toggle
  if (elements.arenaLockSameProviderCheck) {
    elements.arenaLockSameProviderCheck.addEventListener('change', (e) => {
      if (e.target.checked) {
        copyArenaConfig('A', 'B', false);
      }
      saveAllState();
    });
  }

  // A/B Arena Winner Judgments
  if (elements.voteWinnerABtn) {
    elements.voteWinnerABtn.addEventListener('click', () => setArenaWinner('A'));
  }
  if (elements.voteWinnerTieBtn) {
    elements.voteWinnerTieBtn.addEventListener('click', () => setArenaWinner('tie'));
  }
  if (elements.voteWinnerBBtn) {
    elements.voteWinnerBBtn.addEventListener('click', () => setArenaWinner('B'));
  }
  if (elements.exportArenaBtn) {
    elements.exportArenaBtn.addEventListener('click', exportArenaComparison);
  }

  // Initial restore or fallback sync
  restoreArenaState();
}

// Pull active sidebar provider, baseUrl, apiKey, and model into Model A or B
function pullSidebarToArena(side) {
  const provider = state.provider;
  const baseUrl = (elements.baseUrlInput ? elements.baseUrlInput.value.trim() : '') || (PROVIDER_PRESETS[provider]?.baseUrl || '');
  const apiKey = (elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '') || (state.savedKeys[provider] || '');
  const model = (elements.modelInput ? elements.modelInput.value.trim() : '') || state.model || PROVIDER_PRESETS[provider]?.defaultModel || '';

  const providerSelect = elements[`arenaModel${side}Provider`];
  const modelInput = elements[`arenaModel${side}Input`];
  const urlInput = elements[`arenaUrl${side}`];
  const keyInput = elements[`arenaKey${side}`];
  const nameLabel = elements[`arenaModel${side}Name`];

  if (providerSelect) providerSelect.value = provider;
  renderArenaPresetChips(side, provider);

  if (modelInput) modelInput.value = model;
  if (urlInput) urlInput.value = baseUrl;
  if (keyInput) keyInput.value = apiKey;
  if (nameLabel) nameLabel.textContent = model || (`Model ${side}`);

  updateArenaChipsSelection(side);

  // If custom credentials or non-default base URL, reveal advanced panel
  if (apiKey || (baseUrl && baseUrl !== PROVIDER_PRESETS[provider]?.baseUrl)) {
    const advPanel = elements[`arenaAdvancedPanel${side}`];
    const advToggle = elements[`arenaToggleAdvanced${side}`];
    if (advPanel && advPanel.classList.contains('collapsed')) {
      advPanel.classList.remove('collapsed');
      if (advToggle) advToggle.classList.add('active');
    }
  }

  showToast(`Imported Sidebar config to Model ${side} (${PROVIDER_PRESETS[provider]?.name || provider}: ${model})`, 'success');
}

// Copy configuration between Arena models (Same Provider & Auth)
function copyArenaConfig(fromSide, toSide, silent = false) {
  const fromProvider = elements[`arenaModel${fromSide}Provider`]?.value || 'custom';
  const fromUrl = elements[`arenaUrl${fromSide}`]?.value || '';
  const fromKey = elements[`arenaKey${fromSide}`]?.value || '';
  const fromModel = elements[`arenaModel${fromSide}Input`]?.value.trim() || '';

  const toProviderSelect = elements[`arenaModel${toSide}Provider`];
  const toModelInput = elements[`arenaModel${toSide}Input`];
  const toUrlInput = elements[`arenaUrl${toSide}`];
  const toKeyInput = elements[`arenaKey${toSide}`];
  const toNameLabel = elements[`arenaModel${toSide}Name`];

  if (toProviderSelect) toProviderSelect.value = fromProvider;
  renderArenaPresetChips(toSide, fromProvider);

  if (toUrlInput) toUrlInput.value = fromUrl;
  if (toKeyInput) toKeyInput.value = fromKey;

  // Pick suitable target model: if same as source, pick an alternative model from preset
  const presetModels = PROVIDER_PRESETS[fromProvider]?.models || [];
  let targetModel = toModelInput?.value.trim() || '';
  const isTargetInPreset = presetModels.some(m => (typeof m === 'object' ? m.id : m) === targetModel);

  if (!targetModel || targetModel === fromModel || !isTargetInPreset) {
    if (presetModels.length > 1) {
      const alt = presetModels.find(m => (typeof m === 'object' ? m.id : m) !== fromModel);
      targetModel = alt ? (typeof alt === 'object' ? alt.id : alt) : fromModel;
    } else {
      targetModel = fromModel;
    }
  }

  if (toModelInput) toModelInput.value = targetModel;
  if (toNameLabel) toNameLabel.textContent = targetModel || (`Model ${toSide}`);
  updateArenaChipsSelection(toSide);

  // Sync advanced panel visibility if overrides present
  if (fromKey || fromUrl) {
    const advPanel = elements[`arenaAdvancedPanel${toSide}`];
    const advToggle = elements[`arenaToggleAdvanced${toSide}`];
    if (advPanel && advPanel.classList.contains('collapsed')) {
      advPanel.classList.remove('collapsed');
      if (advToggle) advToggle.classList.add('active');
    }
  }

  if (!silent) {
    showToast(`Synchronized Model ${toSide} to same provider as Model ${fromSide} (${PROVIDER_PRESETS[fromProvider]?.name || fromProvider})`, 'success');
  }
  saveAllState();
}

// Swap configurations between Model A and Model B
function swapArenaConfigs() {
  const provA = elements.arenaModelAProvider?.value;
  const modA = elements.arenaModelAInput?.value;
  const urlA = elements.arenaUrlA?.value;
  const keyA = elements.arenaKeyA?.value;
  const outA = elements.arenaOutputA?.innerHTML;
  const ttftA = elements.arenaTtftA?.textContent;
  const latA = elements.arenaLatencyA?.textContent;
  const tpsA = elements.arenaTpsA?.textContent;
  const tokA = elements.arenaTokensA?.textContent;

  const provB = elements.arenaModelBProvider?.value;
  const modB = elements.arenaModelBInput?.value;
  const urlB = elements.arenaUrlB?.value;
  const keyB = elements.arenaKeyB?.value;
  const outB = elements.arenaOutputB?.innerHTML;
  const ttftB = elements.arenaTtftB?.textContent;
  const latB = elements.arenaLatencyB?.textContent;
  const tpsB = elements.arenaTpsB?.textContent;
  const tokB = elements.arenaTokensB?.textContent;

  // Set A with B
  if (elements.arenaModelAProvider) elements.arenaModelAProvider.value = provB;
  renderArenaPresetChips('A', provB);
  if (elements.arenaModelAInput) elements.arenaModelAInput.value = modB;
  if (elements.arenaUrlA) elements.arenaUrlA.value = urlB;
  if (elements.arenaKeyA) elements.arenaKeyA.value = keyB;
  if (elements.arenaModelAName) elements.arenaModelAName.textContent = modB;
  if (elements.arenaOutputA && outB) elements.arenaOutputA.innerHTML = outB;
  if (elements.arenaTtftA) elements.arenaTtftA.textContent = ttftB;
  if (elements.arenaLatencyA) elements.arenaLatencyA.textContent = latB;
  if (elements.arenaTpsA) elements.arenaTpsA.textContent = tpsB;
  if (elements.arenaTokensA) elements.arenaTokensA.textContent = tokB;
  updateArenaChipsSelection('A');

  // Set B with A
  if (elements.arenaModelBProvider) elements.arenaModelBProvider.value = provA;
  renderArenaPresetChips('B', provA);
  if (elements.arenaModelBInput) elements.arenaModelBInput.value = modA;
  if (elements.arenaUrlB) elements.arenaUrlB.value = urlA;
  if (elements.arenaKeyB) elements.arenaKeyB.value = keyA;
  if (elements.arenaModelBName) elements.arenaModelBName.textContent = modA;
  if (elements.arenaOutputB && outA) elements.arenaOutputB.innerHTML = outA;
  if (elements.arenaTtftB) elements.arenaTtftB.textContent = ttftA;
  if (elements.arenaLatencyB) elements.arenaLatencyB.textContent = latA;
  if (elements.arenaTpsB) elements.arenaTpsB.textContent = tpsA;
  if (elements.arenaTokensB) elements.arenaTokensB.textContent = tokA;
  updateArenaChipsSelection('B');

  saveAllState();
  showToast('Swapped Model A and Model B configurations', 'info');
}

// Push Model A or B configuration back to the main sidebar & playground
function pushArenaToSidebar(side) {
  const provider = elements[`arenaModel${side}Provider`]?.value || state.provider;
  const model = elements[`arenaModel${side}Input`]?.value.trim() || state.model;
  const url = elements[`arenaUrl${side}`]?.value.trim() || '';
  const key = elements[`arenaKey${side}`]?.value.trim() || '';

  state.provider = provider;
  if (elements.providerSelect) {
    elements.providerSelect.value = provider;
  }
  updateProviderUI(provider);

  if (url && elements.baseUrlInput) {
    elements.baseUrlInput.value = url;
    state.baseUrl = url;
  }
  if (key && elements.apiKeyInput) {
    elements.apiKeyInput.value = key;
    state.apiKey = key;
    if (state.savedKeys) state.savedKeys[provider] = key;
  }
  if (model && elements.modelInput) {
    elements.modelInput.value = model;
    state.model = model;
    updateModelChipSelection();
  }
  updateCodeSnippets();

  if (elements.modelInput) {
    elements.modelInput.classList.add('input-highlight');
    setTimeout(() => {
      if (elements.modelInput) elements.modelInput.classList.remove('input-highlight');
    }, 1800);
  }

  saveAllState();
  showToast(`Committed Model ${side} (${model}) to Playground Sidebar! Ready to use.`, 'success');
}

function restoreArenaState() {
  try {
    const savedJson = localStorage.getItem('omnilm_app_state');
    if (!savedJson) {
      syncArenaWithCurrentConfig();
      return;
    }
    const saved = JSON.parse(savedJson);
    if (!saved.arenaA && !saved.arenaB) {
      syncArenaWithCurrentConfig();
      return;
    }

    if (saved.arenaPrompt !== undefined && elements.arenaPromptInput) {
      elements.arenaPromptInput.value = saved.arenaPrompt;
    }

    if (saved.arenaLockSameProvider !== undefined && elements.arenaLockSameProviderCheck) {
      elements.arenaLockSameProviderCheck.checked = Boolean(saved.arenaLockSameProvider);
    }

    if (saved.arenaA) {
      const pA = saved.arenaA.provider || state.provider || 'custom';
      if (elements.arenaModelAProvider) {
        elements.arenaModelAProvider.value = pA;
      }
      renderArenaPresetChips('A', pA);
      if (elements.arenaModelAInput) {
        elements.arenaModelAInput.value = saved.arenaA.model || PROVIDER_PRESETS[pA]?.defaultModel || 'custom-model';
      }
      if (elements.arenaUrlA && saved.arenaA.baseUrl !== undefined) {
        elements.arenaUrlA.value = saved.arenaA.baseUrl;
      }
      if (elements.arenaKeyA && saved.arenaA.key !== undefined) {
        elements.arenaKeyA.value = saved.arenaA.key;
      }
      if (saved.arenaA.advancedOpen && elements.arenaAdvancedPanelA) {
        elements.arenaAdvancedPanelA.classList.remove('collapsed');
        if (elements.arenaToggleAdvancedA) elements.arenaToggleAdvancedA.classList.add('active');
      }
      updateArenaChipsSelection('A');
    }

    if (saved.arenaB) {
      const pB = saved.arenaB.provider || 'openai';
      if (elements.arenaModelBProvider) {
        elements.arenaModelBProvider.value = pB;
      }
      renderArenaPresetChips('B', pB);
      if (elements.arenaModelBInput) {
        elements.arenaModelBInput.value = saved.arenaB.model || PROVIDER_PRESETS[pB]?.defaultModel || 'gpt-4o';
      }
      if (elements.arenaUrlB && saved.arenaB.baseUrl !== undefined) {
        elements.arenaUrlB.value = saved.arenaB.baseUrl;
      }
      if (elements.arenaKeyB && saved.arenaB.key !== undefined) {
        elements.arenaKeyB.value = saved.arenaB.key;
      }
      if (saved.arenaB.advancedOpen && elements.arenaAdvancedPanelB) {
        elements.arenaAdvancedPanelB.classList.remove('collapsed');
        if (elements.arenaToggleAdvancedB) elements.arenaToggleAdvancedB.classList.add('active');
      }
      updateArenaChipsSelection('B');
    }
  } catch (err) {
    console.warn('Error restoring Arena state:', err);
    syncArenaWithCurrentConfig();
  }
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

  preset.models.forEach(item => {
    const isModelObj = typeof item === 'object' && item !== null;
    const modelId = isModelObj ? item.id : item;
    const modelName = isModelObj ? (item.name || item.id) : item;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.modelId = modelId;
    chip.className = 'chip' + (input && input.value.trim() === modelId ? ' active' : '');
    chip.textContent = modelName;
    chip.title = modelId;
    chip.addEventListener('click', () => {
      if (input) {
        input.value = modelId;
        updateArenaChipsSelection(side);
        saveAllState();
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
    const chipId = c.dataset.modelId || c.textContent.trim();
    c.classList.toggle('active', chipId === currentVal);
  });

  // Keep card heading dynamically synchronized with selected or typed model
  const nameEl = elements[`arenaModel${side}Name`];
  if (nameEl) {
    nameEl.textContent = currentVal || (`Model ${side}`);
  }
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
    showToast(`Notice: Model A (${PROVIDER_PRESETS[providerA]?.name}) has no API key entered. Click ⚙ Auth/URL if needed.`, 'error');
  }
  if (['openai', 'claude', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(providerB) && !keyB) {
    showToast(`Notice: Model B (${PROVIDER_PRESETS[providerB]?.name}) has no API key entered. Click ⚙ Auth/URL if needed.`, 'error');
  }

  const abortA = new AbortController();
  const abortB = new AbortController();
  state.activeArenaAbortA = abortA;
  state.activeArenaAbortB = abortB;
  state.isArenaExecuting = true;

  elements.runArenaBtn.classList.add('btn-stop');
  const runSpan = elements.runArenaBtn.querySelector('span');
  if (runSpan) runSpan.textContent = '■ Stop Comparison';

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

    lastArenaExecutionData = {
      prompt: promptText,
      modelA,
      modelB,
      resA: resA.status === 'fulfilled' ? resA.value : { success: false, text: 'Execution failed' },
      resB: resB.status === 'fulfilled' ? resB.value : { success: false, text: 'Execution failed' }
    };

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
  let accumulatedReasoning = '';
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

          // Handle reasoning / thinking tokens (GLM, DeepSeek, Qwen)
          if (item.reasoning) {
            if (ttft === null) {
              ttft = Date.now() - startTime;
              if (ttftEl) ttftEl.textContent = `${ttft} ms`;
            }
            accumulatedReasoning += item.reasoning;
            renderArenaOutput(side, accumulatedText, accumulatedReasoning);
          }

          // Handle standard content tokens
          if (item.text) {
            if (ttft === null) {
              ttft = Date.now() - startTime;
              if (ttftEl) ttftEl.textContent = `${ttft} ms`;
            }
            accumulatedText += item.text;
            renderArenaOutput(side, accumulatedText, accumulatedReasoning);
          }

          if (item.usage) usage = item.usage;
          if (item.done) finalLatency = item.latency || (Date.now() - startTime);
          if (item.error) throw new Error(item.error);
        } catch (parseErr) {
          if (parseErr.message && !parseErr.message.includes('JSON')) {
            throw parseErr;
          }
        }
      }
    }

    finalLatency = finalLatency || (Date.now() - startTime);
    if (latencyEl) latencyEl.textContent = `${finalLatency} ms`;

    const totalChars = accumulatedText.length + accumulatedReasoning.length;
    const hasOutput = totalChars > 0;

    if (!hasOutput) {
      if (finalLatency >= 45000) {
        if (statusEl) {
          statusEl.className = 'badge-status error';
          statusEl.textContent = 'TIMEOUT';
        }
        if (outputEl) {
          outputEl.innerHTML = `
            <div class="arena-error-box" style="color: var(--status-error); background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.5;">
              <div style="font-weight: 600; margin-bottom: 4px;">Request Timed Out (${Math.round(finalLatency / 1000)}s)</div>
              <div style="font-size: 0.76rem; color: var(--text-secondary);">No response tokens received from provider <strong>${escapeHtml(payload.provider)}</strong> for model <code>${escapeHtml(payload.model)}</code>. Check API endpoint or try increasing timeout in Model Parameters.</div>
            </div>
          `;
        }
      } else {
        if (statusEl) {
          statusEl.className = 'badge-status warning';
          statusEl.textContent = 'NO CONTENT';
        }
        if (outputEl) {
          outputEl.innerHTML = `
            <div class="arena-error-box" style="color: var(--text-muted); background-color: var(--bg-surface-soft); border: 1px dashed var(--border-medium); padding: 14px; font-family: var(--font-mono); font-size: 0.82rem;">
              [Model finished with 0 tokens returned]
            </div>
          `;
        }
      }
    } else {
      if (statusEl) {
        statusEl.className = 'badge-status success';
        statusEl.textContent = 'FINISHED';
      }
      renderArenaOutput(side, accumulatedText, accumulatedReasoning);
    }

    const wordsCount = (accumulatedText + ' ' + accumulatedReasoning).split(/\s+/).filter(Boolean).length;
    const completionTokens = usage?.completion_tokens ?? Math.max(1, Math.ceil(wordsCount * 1.3));
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
      text: accumulatedText || accumulatedReasoning,
      reasoning: accumulatedReasoning,
      success: hasOutput
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
        text: accumulatedText || accumulatedReasoning || '[Stopped by user]',
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
            ${isAuthError ? '<div style="margin-top: 6px; color: var(--accent-primary);">Tip: Missing or invalid API key. Click <strong>⚙ Auth/URL</strong> above to provide the API key for this model.</div>' : ''}
          </div>
        </div>
      `;
    }
    return {
      side,
      model: payload.model,
      error: err.message,
      text: `Error: ${err.message}`,
      success: false
    };
  }
}

function renderArenaOutput(side, text, reasoning) {
  const outputEl = elements[`arenaOutput${side}`];
  if (!outputEl) return;

  let html = '';

  if (reasoning && reasoning.trim()) {
    html += `
      <details class="arena-thinking-block" open>
        <summary class="arena-thinking-summary">
          <span class="thinking-dot"></span>
          <span>Thinking / Reasoning Process</span>
          <span class="thinking-count">${reasoning.length} chars</span>
        </summary>
        <div class="arena-thinking-content">${escapeHtml(reasoning)}</div>
      </details>
    `;
  }

  if (text && text.trim()) {
    if (window.marked) {
      try {
        html += marked.parse(text);
      } catch {
        html += `<pre class="arena-raw-output">${escapeHtml(text)}</pre>`;
      }
    } else {
      html += `<pre class="arena-raw-output">${escapeHtml(text)}</pre>`;
    }
  } else if (!reasoning || !reasoning.trim()) {
    html = '<div class="placeholder-state"><p>Streaming model response...</p></div>';
  }

  outputEl.innerHTML = html;

  if (window.hljs) {
    outputEl.querySelectorAll('pre code').forEach((block) => {
      try {
        hljs.highlightElement(block);
      } catch {}
    });
  }

  addCopyButtonsToPreBlocks(outputEl);
}

let lastArenaExecutionData = null;

function setArenaWinner(winner) {
  state.arenaWinner = winner;
  [elements.voteWinnerABtn, elements.voteWinnerTieBtn, elements.voteWinnerBBtn].forEach(b => {
    if (b) b.classList.remove('active-winner');
  });

  if (winner === 'A' && elements.voteWinnerABtn) {
    elements.voteWinnerABtn.classList.add('active-winner');
    showToast('Marked Model A as Winner', 'success');
  } else if (winner === 'tie' && elements.voteWinnerTieBtn) {
    elements.voteWinnerTieBtn.classList.add('active-winner');
    showToast('Marked as Tie / Equal', 'info');
  } else if (winner === 'B' && elements.voteWinnerBBtn) {
    elements.voteWinnerBBtn.classList.add('active-winner');
    showToast('Marked Model B as Winner', 'success');
  }

  // Configure Commit Winner button
  if (elements.commitWinnerBtn) {
    if (winner === 'A' || winner === 'B') {
      const winModel = elements[`arenaModel${winner}Input`]?.value.trim() || (`Model ${winner}`);
      elements.commitWinnerBtn.style.display = 'inline-block';
      elements.commitWinnerBtn.textContent = `Commit Winner (${winner}: ${winModel}) → Sidebar`;
      elements.commitWinnerBtn.onclick = () => pushArenaToSidebar(winner);
    } else {
      elements.commitWinnerBtn.style.display = 'none';
    }
  }
}

function exportArenaComparison() {
  if (!lastArenaExecutionData) {
    showToast('No A/B comparison results to export yet. Run a comparison first.', 'info');
    return;
  }
  const { prompt, modelA, modelB, resA, resB } = lastArenaExecutionData;
  const winner = state.arenaWinner ? (state.arenaWinner === 'tie' ? 'Tie / Equal' : `Model ${state.arenaWinner}`) : 'Unjudged';

  const md = `# OmniLLM A/B Arena Benchmark Report
**Date:** ${new Date().toLocaleString()}
**Winner:** ${winner}

## Test Query
> ${prompt}

---

## Model A: ${modelA}
- **Provider:** ${elements.arenaModelAProvider ? elements.arenaModelAProvider.value : 'Custom'}
- **TTFT (Time to First Token):** ${resA?.ttft ?? '--'} ms
- **Throughput:** ${resA?.tps ?? '--'} TPS
- **Total Latency:** ${resA?.latency ?? '--'} ms
- **Tokens Generated:** ${resA?.tokens ?? '--'}
- **Status:** ${resA?.success ? 'Success' : 'Failed'}

### Output:
${resA?.text || (elements.arenaOutputA ? elements.arenaOutputA.innerText : 'No output')}

---

## Model B: ${modelB}
- **Provider:** ${elements.arenaModelBProvider ? elements.arenaModelBProvider.value : 'Custom'}
- **TTFT (Time to First Token):** ${resB?.ttft ?? '--'} ms
- **Throughput:** ${resB?.tps ?? '--'} TPS
- **Total Latency:** ${resB?.latency ?? '--'} ms
- **Tokens Generated:** ${resB?.tokens ?? '--'}
- **Status:** ${resB?.success ? 'Success' : 'Failed'}

### Output:
${resB?.text || (elements.arenaOutputB ? elements.arenaOutputB.innerText : 'No output')}

---
*Generated by OmniLLM Studio*
`;

  copyToClipboard(md, 'A/B Arena Benchmark Markdown copied to clipboard');
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
function saveChatHistory() {
  try {
    localStorage.setItem('omnilm_chat_history', JSON.stringify(state.chatMessages));
  } catch (e) {
    console.warn('Could not save chat history:', e);
  }
}

function loadChatHistory() {
  try {
    const saved = localStorage.getItem('omnilm_chat_history');
    if (!saved) return;
    const messages = JSON.parse(saved);
    if (!Array.isArray(messages) || messages.length === 0) return;

    state.chatMessages = messages;
    if (elements.emptyChatPlaceholder) {
      elements.emptyChatPlaceholder.style.display = 'none';
    }
    if (elements.chatMessagesStream) {
      elements.chatMessagesStream.querySelectorAll('.chat-bubble-row').forEach(r => r.remove());
    }

    messages.forEach((msg, idx) => {
      appendChatBubble(msg.role, msg.content, msg.time || '', msg.image || null, idx);
    });

    if (elements.chatTurnCount) {
      elements.chatTurnCount.textContent = `${Math.ceil(messages.length / 2)} turns`;
    }
  } catch (err) {
    console.warn('Error loading chat history:', err);
  }
}

function initChatThread() {
  loadChatHistory();

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
      saveChatHistory();
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
  const userImg = state.chatAttachedImage ? { ...state.chatAttachedImage } : null;
  const userMsg = { role: 'user', content: text, image: userImg, time: now };
  state.chatMessages.push(userMsg);
  saveChatHistory();
  appendChatBubble('user', text, now, userImg, state.chatMessages.length - 1);

  // Clear chat attachment preview
  state.chatAttachedImage = null;
  if (elements.chatAttachmentPreviewBar) elements.chatAttachmentPreviewBar.style.display = 'none';
  if (elements.chatAttachmentThumbnailImg) elements.chatAttachmentThumbnailImg.src = '';

  // Append Assistant Placeholder Bubble
  const assistantBubble = appendChatBubble('assistant', '<div class="chat-thinking-indicator">Thinking...</div>', now);

  const abortCtrl = new AbortController();
  state.activeChatAbort = abortCtrl;
  state.isChatExecuting = true;

  elements.chatSendBtn.classList.add('btn-stop');
  const sendSpan = elements.chatSendBtn.querySelector('span');
  if (sendSpan) sendSpan.textContent = '■ Stop';

  // Build full message thread
  const messages = [];
  if (state.systemPrompt.trim()) {
    messages.push({ role: 'system', content: state.systemPrompt.trim() });
  }
  state.chatMessages.forEach(m => {
    if (m.image && m.image.dataUrl) {
      messages.push({
        role: m.role,
        content: [
          { type: 'text', text: m.content },
          { type: 'image_url', image_url: { url: m.image.dataUrl } }
        ]
      });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
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
            renderChatBubbleContent(assistantBubble, accumulatedContent);
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
    saveChatHistory();

    if (elements.chatTurnCount) {
      elements.chatTurnCount.textContent = `${Math.ceil(state.chatMessages.length / 2)} turns`;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const notice = '<div class="chat-stopped-notice" style="color: var(--text-muted); font-size: 0.78rem; margin-top: 6px; font-style: italic;">[Response stopped by user or timed out]</div>';
      if (accumulatedContent) {
        renderChatBubbleContent(assistantBubble, accumulatedContent + '\n\n' + notice);
        state.chatMessages.push({
          role: 'assistant',
          content: accumulatedContent + ' [Stopped]',
          time: new Date().toLocaleTimeString()
        });
        saveChatHistory();
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

function renderChatBubbleContent(bubbleRow, rawContent) {
  const textEl = bubbleRow.querySelector('.bubble-text');
  if (!textEl) return;

  // Check for <think> tags from reasoning models (e.g. DeepSeek R1)
  let formatted = rawContent;
  let thinkingHtml = '';

  if (formatted.includes('<think>')) {
    const thinkMatch = formatted.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
    if (thinkMatch) {
      const thinkContent = thinkMatch[1].trim();
      thinkingHtml = `<details class="chat-thinking-block" open><summary>Thinking Process</summary><div class="thinking-content">${escapeHtml(thinkContent)}</div></details>`;
      formatted = formatted.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, '').trim();
    }
  }

  let bodyHtml = '';
  if (window.marked && formatted) {
    try {
      bodyHtml = marked.parse(formatted);
    } catch {
      bodyHtml = `<pre>${escapeHtml(formatted)}</pre>`;
    }
  } else if (formatted) {
    bodyHtml = `<pre>${escapeHtml(formatted)}</pre>`;
  }

  textEl.innerHTML = thinkingHtml + bodyHtml;

  if (window.hljs) {
    textEl.querySelectorAll('pre code').forEach((block) => {
      try { hljs.highlightElement(block); } catch (e) {}
    });
  }
}

function appendChatBubble(role, contentHtml, time, imageObj = null, msgIndex = null) {
  const row = document.createElement('div');
  row.className = `chat-bubble-row ${role}`;

  let imageHtml = '';
  if (imageObj && imageObj.dataUrl) {
    imageHtml = `<div class="chat-attached-image-wrap"><img src="${imageObj.dataUrl}" class="chat-attached-image" alt="${escapeHtml(imageObj.name || 'Attached')}"></div>`;
  }

  row.innerHTML = `
    <div class="chat-bubble ${role}">
      <div class="bubble-header">
        <span class="bubble-role">${role === 'user' ? 'YOU' : 'ASSISTANT'}</span>
        <div class="bubble-actions">
          <span class="bubble-time">${time}</span>
          <button type="button" class="btn-bubble-action btn-bubble-copy" title="Copy message text">Copy</button>
          <button type="button" class="btn-bubble-action btn-bubble-delete" title="Delete message">✕</button>
        </div>
      </div>
      ${imageHtml}
      <div class="bubble-text markdown-body">${contentHtml.startsWith('<') ? contentHtml : escapeHtml(contentHtml)}</div>
    </div>
  `;

  // Message Copy Action
  row.querySelector('.btn-bubble-copy')?.addEventListener('click', () => {
    const textToCopy = row.querySelector('.bubble-text')?.innerText || '';
    copyToClipboard(textToCopy, 'Message text copied to clipboard');
  });

  // Message Delete Action
  row.querySelector('.btn-bubble-delete')?.addEventListener('click', () => {
    row.remove();
    const remaining = elements.chatMessagesStream.querySelectorAll('.chat-bubble-row');
    if (remaining.length === 0) {
      state.chatMessages = [];
      if (elements.emptyChatPlaceholder) elements.emptyChatPlaceholder.style.display = 'flex';
      if (elements.chatTurnCount) elements.chatTurnCount.textContent = '0 turns';
    } else {
      if (msgIndex !== null && msgIndex < state.chatMessages.length) {
        state.chatMessages.splice(msgIndex, 1);
      }
      if (elements.chatTurnCount) {
        elements.chatTurnCount.textContent = `${Math.ceil(state.chatMessages.length / 2)} turns`;
      }
    }
    saveChatHistory();
    showToast('Message deleted', 'info');
  });

  // Code syntax highlighting if needed
  if (window.hljs) {
    row.querySelectorAll('pre code').forEach((block) => {
      try { hljs.highlightElement(block); } catch (e) {}
    });
  }

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
