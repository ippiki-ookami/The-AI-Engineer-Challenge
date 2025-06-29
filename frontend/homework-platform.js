// Unified Homework Platform - Seamless switching between isolated homework assignments
class HomeworkPlatform extends BaseChatInterface {
    constructor() {
        super();
        this.loadedHomeworkModules = new Map(); // Cache for homework-specific modules
        this.initializeHomeworkPlatform();
    }

    async initializeHomeworkPlatform() {
        // Load available homework from the unified backend
        await this.loadAvailableHomework();
        
        // Override the feature switching to use homework isolation
        this.setupHomeworkSwitching();
        
        console.log('🎓 Homework Platform initialized with isolated assignments!');
    }

    async loadAvailableHomework() {
        try {
            const response = await fetch('/api/homework');
            const data = await response.json();
            
            // Update the features list with homework data
            this.homework = data.homework;
            console.log('📚 Loaded homework assignments:', this.homework);
            
            // Update the dropdown
            this.updateHomeworkDropdown();
            
        } catch (error) {
            console.error('Failed to load homework assignments:', error);
            // Fallback to default features - use hardcoded for now
            this.homework = {
                "01-vibe-check": {"name": "Vibe Check", "enabled": true},
                "02-embeddings-rag": {"name": "Embeddings and RAG", "enabled": true},
                "03-agents": {"name": "AI Agents", "enabled": false},
                "04-fine-tuning": {"name": "Fine Tuning", "enabled": false},
                "05-multimodal": {"name": "Multimodal LLMs", "enabled": false}
            };
            this.updateHomeworkDropdown();
        }
    }

    updateHomeworkDropdown() {
        if (!this.featureSelect) return;
        
        // Clear existing options
        this.featureSelect.innerHTML = '';
        
        // Add homework options
        for (const [homeworkId, info] of Object.entries(this.homework)) {
            const option = document.createElement('option');
            option.value = homeworkId;
            option.textContent = `${homeworkId.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())} - ${info.name}`;
            option.disabled = !info.enabled;
            
            if (!info.enabled) {
                option.style.fontStyle = 'italic';
                option.textContent += ' (Coming Soon)';
            }
            
            this.featureSelect.appendChild(option);
        }
        
        // Set current selection
        this.featureSelect.value = this.currentFeature;
    }

    setupHomeworkSwitching() {
        // Override the feature selection to use homework isolation
        if (this.featureSelect) {
            // Remove ALL existing event listeners by cloning the element
            const newFeatureSelect = this.featureSelect.cloneNode(true);
            this.featureSelect.parentNode.replaceChild(newFeatureSelect, this.featureSelect);
            this.featureSelect = newFeatureSelect;
            
            // Add our homework switching event listener
            this.featureSelect.addEventListener('change', (e) => {
                console.log(`🎯 Dropdown changed to value: "${e.target.value}"`);
                console.log(`🎯 Selected option text: "${e.target.options[e.target.selectedIndex].text}"`);
                this.switchHomework(e.target.value);
            });
        }
    }

    async switchHomework(homeworkId) {
        console.log(`🔍 Attempting to switch to homework: ${homeworkId}`);
        console.log(`📊 Available homework:`, this.homework);
        console.log(`✅ Homework exists:`, !!this.homework[homeworkId]);
        console.log(`🔧 Homework enabled:`, this.homework[homeworkId]?.enabled);
        
        if (!this.homework[homeworkId] || !this.homework[homeworkId].enabled) {
            console.log(`❌ Homework ${homeworkId} not available or not enabled`);
            this.showNotification(
                `Homework "${this.homework[homeworkId]?.name || homeworkId}" is not yet implemented. Stay tuned!`, 
                'info'
            );
            this.featureSelect.value = this.currentFeature;
            return;
        }

        console.log(`🔄 Switching to isolated homework: ${homeworkId}`);
        
        // Save current homework
        this.currentFeature = homeworkId;
        localStorage.setItem('selected_feature', homeworkId);
        
        try {
            // Load homework-specific modules (completely isolated)
            await this.loadHomeworkModules(homeworkId);
            
            // Apply homework-specific settings
            this.applyHomeworkSettings(homeworkId);
            
            // Clear chat for fresh start (without confirmation when switching homework)
            this.clearChatSilent();
            
            // Show success notification
            this.showNotification(
                `Switched to: ${this.homework[homeworkId].name} - Each homework is completely isolated!`, 
                'success'
            );
            
        } catch (error) {
            console.error(`Failed to switch to homework ${homeworkId}:`, error);
            this.showNotification(`Failed to load homework: ${error.message}`, 'error');
            
            // Revert to previous
            this.featureSelect.value = this.currentFeature;
        }
    }

    async loadHomeworkModules(homeworkId) {
        // Cleanup previous homework modules
        this.cleanupPreviousHomework();
        
        // Check if already loaded (cached for performance)
        if (this.loadedHomeworkModules.has(homeworkId)) {
            const cachedModule = this.loadedHomeworkModules.get(homeworkId);
            this.applyHomeworkModule(cachedModule);
            return;
        }

        try {
            // Load homework-specific CSS first
            await this.loadHomeworkCSS(homeworkId);
            
            // Load homework-specific JavaScript
            await this.loadHomeworkJS(homeworkId);
            
        } catch (error) {
            console.error(`Failed to load homework module ${homeworkId}:`, error);
            // Continue with base functionality
        }
    }

    async loadHomeworkCSS(homeworkId) {
        const cssPath = `/features/${homeworkId}/`;
        let cssFile;
        
        // Different naming conventions for different homework
        if (homeworkId === '02-embeddings-rag') {
            cssFile = `${cssPath}rag.css`;
        } else {
            cssFile = `${cssPath}${homeworkId}.css`;
        }
        
        const cssExists = await this.checkModuleExists(cssFile);
        if (cssExists) {
            // Remove previous homework CSS
            const existingCSS = document.getElementById('homework-css');
            if (existingCSS) {
                existingCSS.remove();
            }
            
            // Add new CSS
            const link = document.createElement('link');
            link.id = 'homework-css';
            link.rel = 'stylesheet';
            link.href = cssFile;
            document.head.appendChild(link);
            
            console.log(`✅ Loaded CSS for homework: ${homeworkId}`);
        }
    }

    async loadHomeworkJS(homeworkId) {
        let jsFile;
        
        // Different naming conventions for different homework
        if (homeworkId === '02-embeddings-rag') {
            jsFile = `/features/${homeworkId}/rag.js`;
        } else {
            jsFile = `/features/${homeworkId}/${homeworkId}.js`;
        }
        
        const jsExists = await this.checkModuleExists(jsFile);
        if (jsExists) {
            // Dynamically load the script
            const script = document.createElement('script');
            script.src = jsFile;
            script.id = `homework-js-${homeworkId}`;
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // Initialize homework-specific manager
                    this.initializeHomeworkManager(homeworkId);
                    console.log(`✅ Loaded JS for homework: ${homeworkId}`);
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } else {
            console.log(`📝 Homework ${homeworkId} uses base functionality only`);
        }
    }

    initializeHomeworkManager(homeworkId) {
        // Initialize homework-specific managers
        if (homeworkId === '02-embeddings-rag' && window.RAGManager) {
            this.ragManager = new window.RAGManager();
            console.log('📄 RAG Manager initialized');
        }
        // Add other homework managers as needed
    }

    cleanupPreviousHomework() {
        // Cleanup RAG manager
        if (this.ragManager && this.ragManager.cleanup) {
            this.ragManager.cleanup();
            this.ragManager = null;
        }
        
        // Remove previous homework scripts
        const oldScripts = document.querySelectorAll('[id^="homework-js-"]');
        oldScripts.forEach(script => script.remove());
    }

    async checkModuleExists(modulePath) {
        try {
            const response = await fetch(modulePath, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    applyHomeworkModule(homeworkModule) {
        // Apply homework-specific extensions to the current interface
        if (homeworkModule.extensions) {
            Object.assign(this, homeworkModule.extensions);
        }
        
        // Call homework-specific initialization if available
        if (homeworkModule.initialize) {
            homeworkModule.initialize.call(this);
        }
    }

    applyHomeworkSettings(homeworkId) {
        // Get homework info
        const homework = this.homework[homeworkId];
        
        // Apply base feature settings
        super.applyFeatureSettings();
        
        // Homework-specific UI adjustments
        this.applyHomeworkUI(homeworkId);
        
        // Update welcome message for homework context
        this.updateWelcomeMessage(homework);
    }

    applyHomeworkUI(homeworkId) {
        // Add homework-specific body class for CSS targeting
        document.body.className = document.body.className.replace(/homework-\w+/g, '');
        document.body.classList.add(`homework-${homeworkId}`);
        
        // Update page title
        document.title = `${this.homework[homeworkId].name} - LLM Bootcamp`;
    }

    updateWelcomeMessage(homework) {
        const welcomeMessage = this.chatMessages.querySelector('.system-message');
        if (welcomeMessage) {
            const messageText = welcomeMessage.querySelector('.message-text');
            if (messageText) {
                messageText.innerHTML = `
                    Welcome to <strong>${homework.name}</strong>! 
                    <br><br>
                    This homework assignment is completely isolated - its code doesn't interfere with other assignments.
                    <br><br>
                    Enter your OpenAI API key to get started, then explore this specific homework's features!
                `;
            }
        }
    }

    // Override streamChat to use the unified backend with homework routing
    async streamChat(userMessage) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                developer_message: this.developerMessage,
                user_message: userMessage,
                model: this.currentModel,
                api_key: this.apiKey,
                feature_id: this.currentFeature  // Routes to isolated homework handler
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Process the stream (same as base implementation)
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
        
        if (assistantMessage) {
            this.conversation.push({ role: 'assistant', content: assistantMessage });
        }
    }

    // Override API key validation to use unified backend
    async validateApiKey(apiKey, isInitialLoad = false) {
        this.updateApiKeyStatus('Validating key...', 'loading');
        this.saveApiKeyBtn.disabled = true;

        try {
            const response = await fetch('/api/validate-key', {
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

    // Override checkAPIHealth for unified backend
    async checkAPIHealth() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                const health = await response.json();
                console.log('🎓 Homework Platform Health:', health);
                return true;
            }
            return false;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }

    // Silent chat clearing for homework switches (no confirmation dialog)
    clearChatSilent() {
        const welcomeMessage = this.chatMessages.querySelector('.system-message');
        this.chatMessages.innerHTML = '';
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
        
        this.conversation = [];
        this.scrollToBottom();
    }
}

// Initialize the unified homework platform
document.addEventListener('DOMContentLoaded', () => {
    // Wait for base elements to be ready
    setTimeout(() => {
        window.chatInterface = new HomeworkPlatform();
        
        // Check platform health
        window.chatInterface.checkAPIHealth().then(isHealthy => {
            if (!isHealthy) {
                console.warn('Homework platform server may not be running.');
            }
        });
        
        console.log('🎓 LLM Bootcamp Homework Platform ready!');
    }, 100);
});