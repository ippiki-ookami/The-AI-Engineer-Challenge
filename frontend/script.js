// LLM Bootcamp Chat Interface - Main JavaScript
class ChatInterface {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.conversation = [];
        this.isLoading = false;
        this.currentModel = 'gpt-4.1-mini';
        this.developerMessage = localStorage.getItem('developer_message') || 'You are a helpful AI assistant for an LLM bootcamp. Help students learn about RAG, prompt engineering, and other LLM techniques. Be clear, educational, and provide practical examples.';
        this.apiBaseUrl = 'http://localhost:8000'; // Backend API server URL
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateUI();
    }

    initializeElements() {
        // Core elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.apiKeySection = document.getElementById('apiKeySection');
        this.apiKeyStatus = document.getElementById('apiKeyStatus');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.modelSelect = document.getElementById('modelSelect');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.defaultModel = document.getElementById('defaultModel');
        this.developerMessageInput = document.getElementById('developerMessage');
        
        // Buttons
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.clearChatBtn = document.getElementById('clearChat');
        this.settingsBtn = document.getElementById('settings');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.exportChatBtn = document.getElementById('exportChat');
        this.uploadFileBtn = document.getElementById('uploadFile');
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
            this.updateUI();
        });
        
        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
        
        // Settings form events
        this.defaultModel.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.modelSelect.value = e.target.value;
            this.updateUI();
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
    }

    updateUI() {
        // Update API key section visibility
        if (this.apiKey) {
            this.apiKeySection.classList.add('hidden');
            this.sendButton.disabled = false;
            this.updateApiKeyStatus('API key saved', 'success');
        } else {
            this.apiKeySection.classList.remove('hidden');
            this.sendButton.disabled = true;
            this.updateApiKeyStatus('API key required to start chatting', 'warning');
        }
        
        // Update model selector
        this.modelSelect.value = this.currentModel;
    }

    updateApiKeyStatus(message, type) {
        const icon = this.apiKeyStatus.querySelector('i');
        const text = this.apiKeyStatus.querySelector('span');
        
        text.textContent = message;
        
        // Update icon and color based on type
        icon.className = 'fas';
        if (type === 'success') {
            icon.classList.add('fa-check-circle');
            this.apiKeyStatus.style.color = 'var(--secondary-color)';
        } else if (type === 'warning') {
            icon.classList.add('fa-exclamation-triangle');
            this.apiKeyStatus.style.color = 'var(--accent-color)';
        } else if (type === 'error') {
            icon.classList.add('fa-times-circle');
            this.apiKeyStatus.style.color = 'var(--danger-color)';
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.updateApiKeyStatus('Please enter an API key', 'error');
            return;
        }
        
        // Basic validation (OpenAI API keys start with 'sk-')
        if (!apiKey.startsWith('sk-')) {
            this.updateApiKeyStatus('Invalid API key format', 'error');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        this.updateUI();
        this.updateApiKeyStatus('API key saved successfully', 'success');
        
        // Clear the input
        this.apiKeyInput.value = '';
    }

    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || !this.apiKey;
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

        // Show loading state
        this.isLoading = true;
        this.showLoading(true);
        this.addTypingIndicator();

        try {
            const response = await this.callAPI(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.removeTypingIndicator();
            this.addErrorMessage(error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async callAPI(userMessage) {
        const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                developer_message: this.developerMessage,
                user_message: userMessage,
                model: this.currentModel,
                api_key: this.apiKey
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullResponse += chunk;
            
            // Update the last message with streaming content
            this.updateLastMessage(fullResponse);
        }

        return fullResponse;
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
        
        // Store in conversation history
        this.conversation.push({ role, content });
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
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-message';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span>AI is typing</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
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

    updateLastMessage(content) {
        const lastMessage = this.chatMessages.lastElementChild;
        if (lastMessage && lastMessage.classList.contains('assistant-message')) {
            const messageText = lastMessage.querySelector('.message-text');
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

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
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
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal.classList.contains('active')) {
            window.chatInterface.closeSettings();
        }
    }
}); 