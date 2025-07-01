// Base LLM Bootcamp Chat Interface - Common functionality for all features
class BaseChatInterface {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.conversation = [];
        this.isLoading = false;
        this.currentModel = 'gpt-4.1-mini';
        this.developerMessage = localStorage.getItem('developer_message') || 'You are a helpful AI assistant for an LLM bootcamp. Help students learn about RAG, prompt engineering, and other LLM techniques. Be clear, educational, and provide practical examples.';
        this.apiBaseUrl = ''; // Backend API server URL
        
        // Feature configurations for different homework modules
        this.features = {
            '01-vibe-check': {
                name: 'Vibe Check',
                description: 'Basic LLM chat interface with debug panel',
                enabled: true,
                components: {
                    uploadFile: false,
                    exportChat: true,
                    debugPanel: true,
                    systemPrompt: true
                },
                systemPrompt: 'You are a helpful AI assistant for an LLM bootcamp. Help students learn about RAG, prompt engineering, and other LLM techniques. Be clear, educational, and provide practical examples.'
            },
            '02-embeddings-rag': {
                name: 'Embeddings and RAG',
                description: 'RAG implementation with document upload and vector search',
                enabled: false,
                components: {
                    uploadFile: true,
                    exportChat: true,
                    debugPanel: true,
                    systemPrompt: true,
                    ragControls: true
                },
                systemPrompt: 'You are a helpful AI assistant with access to uploaded documents. Use the provided context to answer questions accurately. If the answer is not in the context, say so clearly.'
            },
            '03-agents': {
                name: 'AI Agents',
                description: 'Multi-agent system with tool usage',
                enabled: false,
                components: {
                    uploadFile: false,
                    exportChat: true,
                    debugPanel: true,
                    systemPrompt: true,
                    agentControls: true
                },
                systemPrompt: 'You are an AI agent capable of using tools to help users. Break down complex tasks into steps and use the appropriate tools to accomplish them.'
            },
            '04-fine-tuning': {
                name: 'Fine Tuning',
                description: 'Fine-tuned model comparison and testing',
                enabled: false,
                components: {
                    uploadFile: true,
                    exportChat: true,
                    debugPanel: true,
                    systemPrompt: true,
                    modelComparison: true
                },
                systemPrompt: 'You are a fine-tuned AI assistant specialized in specific domains. Provide expert-level responses based on your training.'
            },
            '05-multimodal': {
                name: 'Multimodal LLMs',
                description: 'Image and text understanding with multimodal models',
                enabled: false,
                components: {
                    uploadFile: true,
                    exportChat: true,
                    debugPanel: true,
                    systemPrompt: true,
                    imageUpload: true,
                    multimodalControls: true
                },
                systemPrompt: 'You are a multimodal AI assistant capable of understanding both text and images. Analyze visual content and provide detailed descriptions and insights.'
            }
        };
        
        this.currentFeature = localStorage.getItem('selected_feature') || '01-vibe-check';
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.initializeTheme();
        this.initializeFeature();
        this.updateUI();
    }

    initializeElements() {
        // Core elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.modelSelect = document.getElementById('modelSelect');
        
        // API key modal
        this.apiKeyModal = document.getElementById('apiKeyModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.apiKeyStatus = document.getElementById('apiKeyStatus');

        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.defaultModel = document.getElementById('defaultModel');
        this.developerMessageInput = document.getElementById('developerMessage');
        
        // Message chain builder
        this.messageChain = document.getElementById('messageChain');
        this.addMessageBtn = document.getElementById('addMessage');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.saveStatus = document.getElementById('saveStatus');
        this.messageChainData = []; // Store message chain in memory
        
        // Buttons
        this.clearChatBtn = document.getElementById('clearChat');
        this.settingsBtn = document.getElementById('settings');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.exportChatBtn = document.getElementById('exportChat');
        this.uploadFileBtn = document.getElementById('uploadFile');
        this.debugBtn = document.getElementById('debugBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.featureSelect = document.getElementById('featureSelect');

        // Main Content Area
        this.mainContent = document.getElementById('mainContent');
        this.debugContent = document.querySelector('#debugPanel .debug-content');

        // Content Modal
        this.contentModal = document.getElementById('contentModal');
        this.contentModalTitle = document.getElementById('contentModalTitle');
        this.contentModalBody = document.getElementById('contentModalBody');
        this.closeContentModalBtn = document.getElementById('closeContentModal');

        // Debug Entry Viewer
        this.debugViewer = {
            isActive: false,
            currentLogId: null,
            currentIndex: 0,
            allLogs: [],
            logData: new Map(),
            savedChatContent: null
        };
    }

    bindEvents() {
        // Message input events
        this.messageInput.addEventListener('input', () => this.handleInputChange());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Send button
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // API key events
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        
        // Model selection
        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });
        
        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        
        // Message chain builder event listeners
        this.addMessageBtn.addEventListener('click', () => this.addMessageToChain());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
        
        // Debug Panel
        this.debugBtn.addEventListener('click', () => this.toggleDebugPanel());
        
        // Theme Toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Feature Selection
        this.featureSelect.addEventListener('change', (e) => this.switchFeature(e.target.value));
        
        // Content Modal
        this.closeContentModalBtn.addEventListener('click', () => this.closeContentModal());
        this.contentModal.addEventListener('click', (e) => {
            if (e.target === this.contentModal) this.closeContentModal();
        });
        
        // Settings form events
        this.defaultModel.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.modelSelect.value = e.target.value;
            localStorage.setItem('default_model', this.currentModel);
        });
        
        this.developerMessageInput.addEventListener('input', (e) => {
            this.developerMessage = e.target.value;
            localStorage.setItem('developer_message', this.developerMessage);
        });
        
        // Export chat
        this.exportChatBtn.addEventListener('click', () => this.exportChat());
        
        // File upload (optional - might not exist in all configurations)
        if (this.uploadFileBtn) {
            this.uploadFileBtn.addEventListener('click', () => this.handleFileUpload());
        }
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
    }

    loadSettings() {
        // Load saved settings
        const savedModel = localStorage.getItem('default_model') || 'gpt-4.1-mini';
        
        this.currentModel = savedModel;
        this.modelSelect.value = savedModel;
        this.defaultModel.value = savedModel;
        this.developerMessageInput.value = this.developerMessage;
        
        // Initialize message chain UI
        this.renderMessageChain();

        if (this.apiKey) {
            this.validateApiKey(this.apiKey, true);
        }
    }

    updateUI() {
        if (this.apiKey) {
            this.apiKeyModal.classList.remove('active');
            this.messageInput.disabled = false;
        } else {
            this.apiKeyModal.classList.add('active');
            this.messageInput.disabled = true;
            this.sendButton.disabled = true;
        }
        this.handleInputChange();
    }

    updateApiKeyStatus(message, type) {
        this.apiKeyStatus.innerHTML = '';
        const statusDiv = document.createElement('div');
        statusDiv.className = `api-key-status-message ${type}`;
        
        const icon = document.createElement('i');
        icon.className = 'fas';

        if (type === 'success') {
            icon.classList.add('fa-check-circle');
        } else if (type === 'warning') {
            icon.classList.add('fa-exclamation-triangle');
        } else if (type === 'error') {
            icon.classList.add('fa-times-circle');
        } else if (type === 'loading') {
            icon.classList.add('fa-spinner', 'fa-spin');
        }
        
        const text = document.createElement('span');
        text.textContent = message;
        
        statusDiv.appendChild(icon);
        statusDiv.appendChild(text);
        this.apiKeyStatus.appendChild(statusDiv);
    }

    async saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.updateApiKeyStatus('Please enter an API key.', 'error');
            return;
        }
        await this.validateApiKey(apiKey);
    }

    async validateApiKey(apiKey, isInitialLoad = false) {
        this.updateApiKeyStatus('Validating key...', 'loading');
        this.saveApiKeyBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/validate-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Invalid API Key');
            }
            
            this.apiKey = apiKey;
            localStorage.setItem('openai_api_key', apiKey);
            if (!isInitialLoad) {
                this.updateApiKeyStatus('API key validated successfully!', 'success');
            }
            
            setTimeout(() => this.updateUI(), isInitialLoad ? 0 : 1000);

        } catch (error) {
            localStorage.removeItem('openai_api_key');
            this.apiKey = '';
            this.updateApiKeyStatus(error.message, 'error');
            this.updateUI();
        } finally {
            this.saveApiKeyBtn.disabled = false;
        }
    }

    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || !this.apiKey || this.isLoading;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendButton.disabled) {
                this.sendMessage();
            }
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.apiKey || this.isLoading) return;

        // Add user message to conversation
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.handleInputChange();

        // Show typing indicator
        this.isLoading = true;
        this.addTypingIndicator();

        // Clear previous debug logs and viewer data
        this.debugContent.innerHTML = '';
        this.debugViewer.logData.clear();
        this.debugViewer.savedChatContent = null;
        if (this.debugViewer.isActive) {
            this.exitDebugViewer();
        }

        try {
            await this.streamChat(message);
        } catch (error) {
            this.removeTypingIndicator();
            this.addErrorMessage(error.message);
        } finally {
            this.isLoading = false;
            this.handleInputChange();
        }
    }

    async streamChat(userMessage) {
        const messageChain = this.getMessageChain();
        const requestPayload = {
            developer_message: this.developerMessage,
            user_message: userMessage,
            model: this.currentModel,
            api_key: this.apiKey,
            feature_id: this.currentFeature,
            message_chain: messageChain
        };
        
        console.log('🚀 Sending request payload:', requestPayload);
        
        const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let assistantMessageDiv = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
                const jsonStr = line.replace('data: ', '');
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.type === 'chat') {
                        assistantMessage += parsed.data;
                        if (!assistantMessageDiv) {
                            this.removeTypingIndicator();
                            assistantMessageDiv = this.addMessage('', 'assistant');
                        }
                        this.updateLastMessage(assistantMessage, assistantMessageDiv);
                    } else if (parsed.type === 'debug') {
                        this.renderDebugLog(parsed.data);
                    } else if (parsed.type === 'error') {
                        this.addErrorMessage(parsed.data);
                        this.removeTypingIndicator();
                    }
                } catch (e) {
                    console.error('Error parsing stream data:', e);
                }
            }
        }
        
        // Final update to conversation history
        if (assistantMessage) {
            this.conversation.push({ role: 'assistant', content: assistantMessage });
        }
    }

    // Debug viewer methods
    renderDebugLog(log) {
        this.debugViewer.logData.set(log.id, log);
        
        const entryDiv = document.createElement('div');
        entryDiv.id = `log-entry-${log.id}`;
        entryDiv.className = 'debug-log-entry';
        
        const existingEntry = document.getElementById(entryDiv.id);

        entryDiv.dataset.level = log.level;
        entryDiv.dataset.status = log.status;
        
        let contentHtml = '';
        if (log.content.type === 'clickable' && log.content.data) {
            contentHtml = `<button class="clickable-content-btn" data-logid="${log.id}">View</button>`;
        } else if (log.content.data) {
            contentHtml = `<div class="debug-log-content">${log.content.data}</div>`;
        }

        // Check if we have source code data to show a "View Code" button
        const hasSourceCode = log.content.data && 
                             (log.content.data["💻 SOURCE"] || 
                              (log.content.data["📥 INPUTS"] && log.content.data["💻 SOURCE"]));
        
        const codeButtonHtml = hasSourceCode ? 
            `<button class="view-code-btn" data-logid="${log.id}" title="View Source Code">
                <i class="fas fa-code"></i>
            </button>` : '';

        entryDiv.innerHTML = `
            <div class="debug-log-title">
                <span>${log.title}</span>
                <div class="debug-log-actions">
                    ${log.content.type === 'clickable' ? contentHtml : ''}
                    ${codeButtonHtml}
                </div>
            </div>
            ${log.content.type !== 'clickable' ? contentHtml : ''}
        `;

        if (existingEntry) {
            existingEntry.replaceWith(entryDiv);
        } else {
            this.debugContent.appendChild(entryDiv);
        }
        
        if (log.content.type === 'clickable') {
            const btn = entryDiv.querySelector('.clickable-content-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.showDebugEntry(log);
                });
            }
        }
        
        // Add event listener for "View Code" button
        const codeBtn = entryDiv.querySelector('.view-code-btn');
        if (codeBtn) {
            codeBtn.addEventListener('click', () => {
                this.showSourceCode(log);
            });
        }

        this.debugContent.scrollTop = this.debugContent.scrollHeight;
    }

    showDebugEntry(log) {
        this.debugViewer.isActive = true;
        this.debugViewer.currentLogId = log.id;
        
        this.debugViewer.allLogs = Array.from(this.debugContent.querySelectorAll('.debug-log-entry'))
            .map(entry => {
                const id = parseInt(entry.id.replace('log-entry-', ''));
                const clickableBtn = entry.querySelector('.clickable-content-btn');
                return clickableBtn ? id : null;
            })
            .filter(id => id !== null);
        
        this.debugViewer.currentIndex = this.debugViewer.allLogs.indexOf(log.id);
        
        this.displayDebugEntryInChatWindow(log);
        this.enterDebugViewerMode();
    }

    displayDebugEntryInChatWindow(log) {
        if (!this.debugViewer.savedChatContent) {
            this.debugViewer.savedChatContent = this.chatMessages.innerHTML;
        }
        
        this.chatMessages.innerHTML = '';
        
        const debugDisplay = document.createElement('div');
        debugDisplay.className = 'debug-entry-display';
        debugDisplay.id = 'debugEntryDisplay';
        
        const header = document.createElement('div');
        header.className = 'debug-entry-header';
        
        let title = log.title;
        if (log.function_name) {
            title = `${log.title} (${log.function_name})`;
        }
        
        header.innerHTML = `
            <h3>${title}</h3>
            <button class="debug-entry-close" id="debugEntryClose">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const contentArea = document.createElement('div');
        contentArea.className = 'debug-entry-content';
        
        if (log.function_name) {
            const functionInfo = document.createElement('div');
            functionInfo.className = 'function-info';
            functionInfo.innerHTML = `
                <div class="function-header">
                    <i class="fas fa-code"></i>
                    <strong>Function:</strong> <code>${log.function_name}</code>
                </div>
                <div class="function-status status-${log.status}">
                    <i class="fas ${log.status === 'success' ? 'fa-check-circle' : 
                                   log.status === 'error' ? 'fa-times-circle' : 
                                   'fa-clock'}"></i>
                    Status: ${log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </div>
            `;
            contentArea.appendChild(functionInfo);
            
            const separator = document.createElement('hr');
            separator.className = 'modal-separator';
            contentArea.appendChild(separator);
        }

        const content = log.content.data;
        if (typeof content === 'object') {
            if (content.error_message && content.full_traceback) {
                this.renderErrorContent(content, contentArea);
            } else {
                this.renderJsonContent(content, contentArea);
            }
        } else {
            const pre = document.createElement('pre');
            pre.textContent = content;
            contentArea.appendChild(pre);
        }
        
        debugDisplay.appendChild(header);
        debugDisplay.appendChild(contentArea);
        this.chatMessages.appendChild(debugDisplay);
        
        document.getElementById('debugEntryClose').addEventListener('click', () => {
            this.exitDebugViewer();
        });
    }

    enterDebugViewerMode() {
        document.body.classList.add('debug-viewer-active');
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        this.highlightDebugEntry(this.debugViewer.currentLogId);
    }

    exitDebugViewer() {
        this.debugViewer.isActive = false;
        this.debugViewer.currentLogId = null;
        
        document.body.classList.remove('debug-viewer-active');
        this.removeDebugHighlight();
        
        this.messageInput.disabled = false;
        this.handleInputChange();
        
        const debugDisplay = document.getElementById('debugEntryDisplay');
        if (debugDisplay) {
            debugDisplay.remove();
        }
        
        this.restoreChatMessages();
    }

    navigateDebugEntry(direction) {
        if (!this.debugViewer.isActive || this.debugViewer.allLogs.length === 0) return;
        
        let newIndex = this.debugViewer.currentIndex + direction;
        
        if (newIndex < 0) newIndex = this.debugViewer.allLogs.length - 1;
        if (newIndex >= this.debugViewer.allLogs.length) newIndex = 0;
        
        this.debugViewer.currentIndex = newIndex;
        this.debugViewer.currentLogId = this.debugViewer.allLogs[newIndex];
        
        this.showDebugEntryById(this.debugViewer.currentLogId);
    }

    showDebugEntryById(logId) {
        const logData = this.debugViewer.logData.get(logId);
        if (logData) {
            this.displayDebugEntryInChatWindow(logData);
            this.highlightDebugEntry(logId);
        }
    }

    highlightDebugEntry(logId) {
        this.removeDebugHighlight();
        const entry = document.getElementById(`log-entry-${logId}`);
        if (entry) {
            entry.classList.add('debug-entry-highlighted');
        }
    }

    removeDebugHighlight() {
        const highlighted = this.debugContent.querySelectorAll('.debug-entry-highlighted');
        highlighted.forEach(entry => entry.classList.remove('debug-entry-highlighted'));
    }

    restoreChatMessages() {
        if (this.debugViewer.savedChatContent) {
            this.chatMessages.innerHTML = this.debugViewer.savedChatContent;
            this.debugViewer.savedChatContent = null;
        } else {
            this.chatMessages.innerHTML = `
                <div class="message system-message">
                    <div class="message-content">
                        <div class="message-text">
                            <i class="fas fa-info-circle"></i>
                            Welcome back to the chat!
                        </div>
                    </div>
                </div>
            `;
        }
        this.scrollToBottom();
    }

    renderErrorContent(errorData, container = null) {
        const targetContainer = container || this.contentModalBody;
        
        const errorSummary = document.createElement('div');
        errorSummary.className = 'error-summary';
        errorSummary.innerHTML = `
            <div class="error-header">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Error Details</strong>
            </div>
            <div class="error-message">
                <strong>Message:</strong> ${this.escapeHtml(errorData.error_message)}
            </div>
            <div class="error-type">
                <strong>Type:</strong> <code>${errorData.error_type}</code>
            </div>
        `;
        targetContainer.appendChild(errorSummary);

        const separator1 = document.createElement('hr');
        separator1.className = 'modal-separator';
        targetContainer.appendChild(separator1);

        if (errorData.developer_message || errorData.user_message || errorData.model) {
            const inputSection = document.createElement('div');
            inputSection.className = 'error-input-section';
            inputSection.innerHTML = '<h4><i class="fas fa-info-circle"></i> Input Data</h4>';
            
            const inputData = {};
            ['developer_message', 'user_message', 'model'].forEach(key => {
                if (errorData[key]) inputData[key] = errorData[key];
            });
            
            this.renderJsonContent(inputData, inputSection);
            targetContainer.appendChild(inputSection);

            const separator2 = document.createElement('hr');
            separator2.className = 'modal-separator';
            targetContainer.appendChild(separator2);
        }

        const tracebackSection = document.createElement('div');
        tracebackSection.className = 'traceback-section';
        tracebackSection.innerHTML = `
            <h4><i class="fas fa-bug"></i> Full Traceback</h4>
            <pre class="traceback-content">${this.escapeHtml(errorData.full_traceback)}</pre>
        `;
        targetContainer.appendChild(tracebackSection);
    }

    renderJsonContent(content, container = null) {
        const jsonString = JSON.stringify(content, null, 2);
        const jsonContainer = document.createElement('div');
        jsonContainer.className = 'json-formatter';

        const lines = jsonString.split('\n');
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'json-line';
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1 && line.substring(0, colonIndex).includes('"')) {
                const keyPart = line.substring(0, colonIndex + 1);
                const valuePart = line.substring(colonIndex + 1);

                const keySpan = document.createElement('span');
                keySpan.className = 'json-key';
                keySpan.textContent = keyPart;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'json-value';
                valueSpan.textContent = valuePart;
                
                lineDiv.appendChild(keySpan);
                lineDiv.appendChild(valueSpan);
            } else {
                lineDiv.textContent = line;
            }
            jsonContainer.appendChild(lineDiv);
        });
        
        if (container) {
            container.appendChild(jsonContainer);
        } else {
            this.contentModalBody.appendChild(jsonContainer);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    closeContentModal() {
        this.contentModal.classList.remove('active');
    }

    // Message handling
    addMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const icon = role === 'user' ? 'fa-user' : 'fa-robot';
        const name = role === 'user' ? 'You' : 'AI Assistant';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas ${icon}"></i>
                    <span>${name}</span>
                </div>
                <div class="message-text">${this.formatMessage(content)}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        if (role === 'user') {
            this.conversation.push({ role, content });
        }
        return messageDiv;
    }

    addErrorMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error-message';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error</span>
                </div>
                <div class="message-text">${message}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addTypingIndicator() {
        this.removeTypingIndicator();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-message';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="typing-bubble">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    updateLastMessage(content, messageDiv) {
        if (messageDiv) {
            const messageText = messageDiv.querySelector('.message-text');
            if (messageText) {
                messageText.innerHTML = this.formatMessage(content);
                this.scrollToBottom();
            }
        }
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const welcomeMessage = this.chatMessages.querySelector('.system-message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage);
            }
            
            this.conversation = [];
            this.scrollToBottom();
        }
    }

    openSettings() {
        this.settingsModal.classList.add('active');
        this.renderMessageChain(); // Refresh the message chain display
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    exportChat() {
        if (this.conversation.length === 0) {
            alert('No conversation to export');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            model: this.currentModel,
            conversation: this.conversation
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `llm-bootcamp-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.pdf,.doc,.docx';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.processFiles(files);
            }
        };
        
        input.click();
    }

    async processFiles(files) {
        const fileNames = files.map(f => f.name).join(', ');
        this.addMessage(`Files uploaded: ${fileNames}\n\nNote: File processing for RAG is not yet implemented in this demo.`, 'assistant');
    }

    async checkAPIHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }

    toggleDebugPanel() {
        this.mainContent.classList.toggle('debug-open');
        this.debugBtn.classList.toggle('active');
    }

    // Theme and feature management
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    initializeFeature() {
        this.featureSelect.value = this.currentFeature;
        this.applyFeatureSettings();
    }
    
    switchFeature(featureId) {
        if (!this.features[featureId] || !this.features[featureId].enabled) {
            this.showNotification(`Feature "${this.features[featureId]?.name || featureId}" is not yet implemented. Stay tuned!`, 'info');
            this.featureSelect.value = this.currentFeature;
            return;
        }
        
        this.currentFeature = featureId;
        localStorage.setItem('selected_feature', featureId);
        
        this.applyFeatureSettings();
        this.clearChat();
        
        this.showNotification(`Switched to: ${this.features[featureId].name} - ${this.features[featureId].description}`, 'success');
    }
    
    applyFeatureSettings() {
        const feature = this.features[this.currentFeature];
        
        this.developerMessage = feature.systemPrompt;
        localStorage.setItem('developer_message', this.developerMessage);
        if (this.developerMessageInput) {
            this.developerMessageInput.value = this.developerMessage;
        }
        
        const components = feature.components;
        
        if (this.uploadFileBtn) {
            this.uploadFileBtn.style.display = components.uploadFile ? 'flex' : 'none';
        }
        
        if (this.exportChatBtn) {
            this.exportChatBtn.style.display = components.exportChat ? 'flex' : 'none';
        }
        
        if (this.debugBtn) {
            this.debugBtn.style.display = components.debugPanel ? 'flex' : 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = this.themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            this.themeToggle.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            this.themeToggle.title = 'Switch to Dark Mode';
        }
    }

    // Message Chain Builder Methods
    addMessageToChain() {
        const messageId = 'msg_' + Date.now();
        const newMessage = {
            id: messageId,
            role: 'user',
            content: ''
        };
        
        this.messageChainData.push(newMessage);
        
        this.renderMessageChain();
        
        // Focus on the new message content input
        setTimeout(() => {
            const contentInput = document.querySelector(`#${messageId} .message-content-input`);
            if (contentInput) contentInput.focus();
        }, 100);
    }

    removeMessageFromChain(messageId) {
        this.messageChainData = this.messageChainData.filter(msg => msg.id !== messageId);
        this.renderMessageChain();
    }

    updateMessageInChain(messageId, field, value) {
        const message = this.messageChainData.find(msg => msg.id === messageId);
        if (message) {
            message[field] = value;
        } else {
            // Message not found
        }
    }

    renderMessageChain() {
        if (!this.messageChain) return;

        if (this.messageChainData.length === 0) {
            this.messageChain.innerHTML = `
                <div class="message-chain-empty">
                    <i class="fas fa-comments"></i>
                    <div>No conversation examples yet</div>
                    <div style="font-size: 0.8em; margin-top: 0.5rem;">Add messages to create few-shot prompting examples</div>
                </div>
            `;
            return;
        }

        this.messageChain.innerHTML = this.messageChainData.map(message => `
            <div class="message-item" id="${message.id}">
                <div class="message-header">
                    <select class="message-role" data-message-id="${message.id}">
                        <option value="system" ${message.role === 'system' ? 'selected' : ''}>System</option>
                        <option value="user" ${message.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="assistant" ${message.role === 'assistant' ? 'selected' : ''}>Assistant</option>
                    </select>
                    <button class="remove-message-btn" data-message-id="${message.id}" title="Remove message">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <textarea 
                    class="message-content-input" 
                    data-message-id="${message.id}"
                    placeholder="Enter ${message.role} message content..."
                >${message.content}</textarea>
            </div>
        `).join('');
        
        // Add event listeners using proper event delegation
        this.messageChain.querySelectorAll('.message-role').forEach(select => {
            select.className = `message-role ${select.value}`;
            select.addEventListener('change', (e) => {
                const messageId = e.target.dataset.messageId;
                this.updateMessageInChain(messageId, 'role', e.target.value);
                e.target.className = `message-role ${e.target.value}`;
            });
        });
        
        this.messageChain.querySelectorAll('.message-content-input').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const messageId = e.target.dataset.messageId;
                this.updateMessageInChain(messageId, 'content', e.target.value);
            });
        });
        
        this.messageChain.querySelectorAll('.remove-message-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const messageId = e.currentTarget.dataset.messageId;
                this.removeMessageFromChain(messageId);
            });
        });
    }

    saveSettings() {
        this.saveSettingsBtn.disabled = true;
        this.saveStatus.className = 'save-status';
        this.saveStatus.textContent = 'Saving...';
        
        try {
            
            // Save developer message
            this.developerMessage = this.developerMessageInput.value;
            localStorage.setItem('developer_message', this.developerMessage);
            
            // Save model selection
            this.currentModel = this.defaultModel.value;
            this.modelSelect.value = this.currentModel;
            localStorage.setItem('default_model', this.currentModel);
            
            // Note: Message chain is session-only storage (not persisted to localStorage)
            // This is intentional - message chains are cleared on page refresh
            
            // Show success
            this.saveStatus.className = 'save-status success';
            this.saveStatus.textContent = '✓ Settings saved (session only)';
            
            // Hide status after 3 seconds
            setTimeout(() => {
                this.saveStatus.className = 'save-status';
            }, 3000);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.saveStatus.className = 'save-status error';
            this.saveStatus.textContent = '✗ Error saving settings';
            
            setTimeout(() => {
                this.saveStatus.className = 'save-status';
            }, 3000);
        } finally {
            this.saveSettingsBtn.disabled = false;
        }
    }

    getMessageChain() {
        // Return the message chain for use in chat processing
        const filteredChain = this.messageChainData.filter(msg => msg.content.trim() !== '');
        // Add debugging to see what's being sent
        return filteredChain;
    }

    showSourceCode(log) {
        // Extract source code data from the log
        const sourceData = log.content.data && log.content.data["💻 SOURCE"];
        
        if (!sourceData) {
            console.warn('No source code data available for this function');
            return;
        }

        // Create and show the source code modal
        this.displaySourceCodeModal(sourceData, log.title);
    }

    displaySourceCodeModal(sourceData, title) {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'source-code-modal-backdrop';
        modalBackdrop.id = 'sourceCodeModalBackdrop';
        
        // Create modal content
        modalBackdrop.innerHTML = `
            <div class="source-code-modal">
                <div class="source-code-header">
                    <div class="source-code-title">
                        <i class="fas fa-code"></i>
                        <span>${title}</span>
                    </div>
                    <button class="source-code-close" id="sourceCodeClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="source-code-info">
                    <div class="source-code-meta">
                        <span class="source-file"><i class="fas fa-file-code"></i> ${sourceData.file_path}:${sourceData.start_line}</span>
                        <span class="source-signature"><i class="fas fa-function"></i> ${sourceData.function_name}${sourceData.signature}</span>
                    </div>
                    ${sourceData.docstring !== "No documentation available" ? 
                        `<div class="source-docstring">
                            <i class="fas fa-info-circle"></i>
                            <span>${sourceData.docstring}</span>
                        </div>` : ''
                    }
                </div>
                <div class="source-code-content">
                    <pre><code class="language-python">${this.escapeHtml(sourceData.source_code)}</code></pre>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modalBackdrop);
        
        // Add event listeners
        document.getElementById('sourceCodeClose').addEventListener('click', () => {
            this.closeSourceCodeModal();
        });
        
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                this.closeSourceCodeModal();
            }
        });
        
        // Add escape key listener
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeSourceCodeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Store escape handler for cleanup
        modalBackdrop.dataset.escapeHandler = 'attached';
    }

    closeSourceCodeModal() {
        const modal = document.getElementById('sourceCodeModalBackdrop');
        if (modal) {
            modal.remove();
        }
    }
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('messageInput').focus();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (window.chatInterface) {
            window.chatInterface.clearChat();
        }
    }
    
    if (e.key === 'Escape') {
        if (window.chatInterface && window.chatInterface.debugViewer.isActive) {
            window.chatInterface.exitDebugViewer();
        } else {
            const modal = document.getElementById('settingsModal');
            if (modal && modal.classList.contains('active') && window.chatInterface) {
                window.chatInterface.closeSettings();
            }
        }
    }
    
    if (window.chatInterface && window.chatInterface.debugViewer.isActive) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            window.chatInterface.navigateDebugEntry(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            window.chatInterface.navigateDebugEntry(1);
        }
    }
});