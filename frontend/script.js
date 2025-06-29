// LLM Bootcamp Chat Interface - Main JavaScript
class ChatInterface {
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

        // Content Modal (keeping for compatibility, but will replace with debug viewer)
        this.contentModal = document.getElementById('contentModal');
        this.contentModalTitle = document.getElementById('contentModalTitle');
        this.contentModalBody = document.getElementById('contentModalBody');
        this.closeContentModalBtn = document.getElementById('closeContentModal');

        // Debug Entry Viewer (new system)
        this.debugViewer = {
            isActive: false,
            currentLogId: null,
            currentIndex: 0,
            allLogs: [],
            logData: new Map(), // Store log data by ID
            savedChatContent: null // Store chat messages when viewing debug entries
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
        
        // File upload
        this.uploadFileBtn.addEventListener('click', () => this.handleFileUpload());
        
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
        this.apiKeyStatus.innerHTML = ''; // Clear previous status
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
        this.debugViewer.savedChatContent = null; // Clear saved chat content
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
        const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                developer_message: this.developerMessage,
                user_message: userMessage,
                model: this.currentModel,
                api_key: this.apiKey,
                feature_id: this.currentFeature
            })
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

    renderDebugLog(log) {
        // Store log data for navigation
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

        entryDiv.innerHTML = `
            <div class="debug-log-title">
                <span>${log.title}</span>
                ${log.content.type === 'clickable' ? contentHtml : ''}
            </div>
            ${log.content.type !== 'clickable' ? contentHtml : ''}
        `;

        if (existingEntry) {
            existingEntry.replaceWith(entryDiv);
        } else {
            this.debugContent.appendChild(entryDiv);
        }
        
        if (log.content.type === 'clickable') {
            entryDiv.querySelector('.clickable-content-btn').addEventListener('click', () => {
                this.showDebugEntry(log);
            });
        }

        this.debugContent.scrollTop = this.debugContent.scrollHeight;
    }

    showDebugEntry(log) {
        // Update debug viewer state
        this.debugViewer.isActive = true;
        this.debugViewer.currentLogId = log.id;
        
        // Get all clickable logs for navigation
        this.debugViewer.allLogs = Array.from(this.debugContent.querySelectorAll('.debug-log-entry'))
            .map(entry => {
                const id = parseInt(entry.id.replace('log-entry-', ''));
                const clickableBtn = entry.querySelector('.clickable-content-btn');
                return clickableBtn ? id : null;
            })
            .filter(id => id !== null);
        
        this.debugViewer.currentIndex = this.debugViewer.allLogs.indexOf(log.id);
        
        // Show the debug entry in the chat window
        this.displayDebugEntryInChatWindow(log);
        
        // Add blur to background and highlight current entry
        this.enterDebugViewerMode();
    }

    displayDebugEntryInChatWindow(log) {
        // Save current chat content if not already saved
        if (!this.debugViewer.savedChatContent) {
            this.debugViewer.savedChatContent = this.chatMessages.innerHTML;
        }
        
        // Clear chat messages and show debug entry
        this.chatMessages.innerHTML = '';
        
        // Create debug entry display
        const debugDisplay = document.createElement('div');
        debugDisplay.className = 'debug-entry-display';
        debugDisplay.id = 'debugEntryDisplay';
        
        // Create header with close button
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
        
        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'debug-entry-content';
        
        // Add function info if available
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

        // Add main content
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
        
        // Add close button event
        document.getElementById('debugEntryClose').addEventListener('click', () => {
            this.exitDebugViewer();
        });
    }

    enterDebugViewerMode() {
        // Add blur to main content except debug panel and chat window
        document.body.classList.add('debug-viewer-active');
        
        // Disable input field to prevent accidental usage
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        
        // Highlight current entry in debug panel
        this.highlightDebugEntry(this.debugViewer.currentLogId);
    }

    exitDebugViewer() {
        // Reset viewer state
        this.debugViewer.isActive = false;
        this.debugViewer.currentLogId = null;
        
        // Remove blur and highlighting
        document.body.classList.remove('debug-viewer-active');
        this.removeDebugHighlight();
        
        // Re-enable input field
        this.messageInput.disabled = false;
        this.handleInputChange(); // Update send button state
        
        // Clear the debug display
        const debugDisplay = document.getElementById('debugEntryDisplay');
        if (debugDisplay) {
            debugDisplay.remove();
        }
        
        // Restore the actual chat messages
        this.restoreChatMessages();
    }

    navigateDebugEntry(direction) {
        if (!this.debugViewer.isActive || this.debugViewer.allLogs.length === 0) return;
        
        // Calculate new index
        let newIndex = this.debugViewer.currentIndex + direction;
        
        // Wrap around
        if (newIndex < 0) newIndex = this.debugViewer.allLogs.length - 1;
        if (newIndex >= this.debugViewer.allLogs.length) newIndex = 0;
        
        this.debugViewer.currentIndex = newIndex;
        this.debugViewer.currentLogId = this.debugViewer.allLogs[newIndex];
        
        // Get the stored log data and display it
        this.showDebugEntryById(this.debugViewer.currentLogId);
    }

    showDebugEntryById(logId) {
        // Get stored log data
        const logData = this.debugViewer.logData.get(logId);
        if (logData) {
            // Update the display with the new log data
            this.displayDebugEntryInChatWindow(logData);
            
            // Update highlighting
            this.highlightDebugEntry(logId);
        }
    }

    highlightDebugEntry(logId) {
        // Remove previous highlights
        this.removeDebugHighlight();
        
        // Add highlight to current entry
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
        // Restore the saved chat content
        if (this.debugViewer.savedChatContent) {
            this.chatMessages.innerHTML = this.debugViewer.savedChatContent;
            this.debugViewer.savedChatContent = null; // Clear saved content
        } else {
            // Fallback if no content was saved (shouldn't happen normally)
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
        
        // Scroll to bottom to show latest messages
        this.scrollToBottom();
    }

    renderErrorContent(errorData, container = null) {
        const targetContainer = container || this.contentModalBody;
        
        // Create error summary section
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

        // Add separator
        const separator1 = document.createElement('hr');
        separator1.className = 'modal-separator';
        targetContainer.appendChild(separator1);

        // Add input data if available
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

        // Add full traceback section
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
            // Check if it's a key-value pair (and not a time string in a value)
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
            // Store in conversation history immediately for user
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
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showLoading() {
        // No longer needed; do nothing
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            // Keep only the welcome message
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
        // For now, just show a message about file upload
        // In a real implementation, you'd process the files and send them to the API
        const fileNames = files.map(f => f.name).join(', ');
        this.addMessage(`Files uploaded: ${fileNames}\n\nNote: File processing for RAG is not yet implemented in this demo.`, 'assistant');
    }

    // Utility method to check API health
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

    initializeTheme() {
        // Get saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }
    
    initializeFeature() {
        // Set the dropdown to the current feature
        this.featureSelect.value = this.currentFeature;
        this.applyFeatureSettings();
    }
    
    switchFeature(featureId) {
        if (!this.features[featureId] || !this.features[featureId].enabled) {
            // Feature not available, show message
            this.showNotification(`Feature "${this.features[featureId]?.name || featureId}" is not yet implemented. Stay tuned!`, 'info');
            // Reset to current feature
            this.featureSelect.value = this.currentFeature;
            return;
        }
        
        // Save selected feature
        this.currentFeature = featureId;
        localStorage.setItem('selected_feature', featureId);
        
        // Apply feature settings
        this.applyFeatureSettings();
        
        // Clear chat when switching features
        this.clearChat();
        
        // Show feature description
        this.showNotification(`Switched to: ${this.features[featureId].name} - ${this.features[featureId].description}`, 'success');
    }
    
    applyFeatureSettings() {
        const feature = this.features[this.currentFeature];
        
        // Update system prompt
        this.developerMessage = feature.systemPrompt;
        localStorage.setItem('developer_message', this.developerMessage);
        if (this.developerMessageInput) {
            this.developerMessageInput.value = this.developerMessage;
        }
        
        // Show/hide UI components based on feature
        const components = feature.components;
        
        // Upload file button
        if (this.uploadFileBtn) {
            this.uploadFileBtn.style.display = components.uploadFile ? 'flex' : 'none';
        }
        
        // Export chat button
        if (this.exportChatBtn) {
            this.exportChatBtn.style.display = components.exportChat ? 'flex' : 'none';
        }
        
        // Debug panel button
        if (this.debugBtn) {
            this.debugBtn.style.display = components.debugPanel ? 'flex' : 'none';
        }
        
        // Add feature-specific UI elements here in future implementations
        // For example: RAG controls, agent panels, etc.
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 4 seconds
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
        
        // Update button icon
        const icon = this.themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            this.themeToggle.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            this.themeToggle.title = 'Switch to Dark Mode';
        }
    }
}

// Initialize the chat interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatInterface = new ChatInterface();
    
    // Check API health on load
    window.chatInterface.checkAPIHealth().then(isHealthy => {
        if (!isHealthy) {
            console.warn('API server may not be running. Please start the backend server.');
        }
    });
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('messageInput').focus();
    }
    
    // Ctrl/Cmd + L to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        window.chatInterface.clearChat();
    }
    
    // Escape to close modals or debug viewer
    if (e.key === 'Escape') {
        if (window.chatInterface.debugViewer.isActive) {
            window.chatInterface.exitDebugViewer();
        } else {
            const modal = document.getElementById('settingsModal');
            if (modal.classList.contains('active')) {
                window.chatInterface.closeSettings();
            }
        }
    }
    
    // Arrow key navigation for debug viewer
    if (window.chatInterface.debugViewer.isActive) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            window.chatInterface.navigateDebugEntry(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            window.chatInterface.navigateDebugEntry(1);
        }
    }
}); 