// Vibe Check Feature - Extends Base Chat Interface
class VibeCheckInterface extends BaseChatInterface {
    constructor() {
        super();
        this.initializeVibeCheck();
    }

    initializeVibeCheck() {
        // Add vibe check specific initialization
        this.addVibeCheckInfo();
        this.setupVibeCheckAnimations();
        
        // Override current feature to ensure it's set to vibe check
        this.currentFeature = '01-vibe-check';
        localStorage.setItem('selected_feature', '01-vibe-check');
        
        console.log('🎉 Vibe Check feature initialized!');
    }

    addVibeCheckInfo() {
        // Add feature-specific info to debug panel
        const vibeInfo = document.createElement('div');
        vibeInfo.className = 'vibe-check-info';
        vibeInfo.innerHTML = `
            <h4><i class="fas fa-heart"></i> Vibe Check Active</h4>
            <p>This is the base LLM chat interface. Perfect for getting familiar with the system and seeing how the debug panel works. Try sending a message to see the LLM processing pipeline in action!</p>
        `;
        
        // Insert at the beginning of debug content
        if (this.debugContent) {
            this.debugContent.insertBefore(vibeInfo, this.debugContent.firstChild);
        }
    }

    setupVibeCheckAnimations() {
        // Add subtle animations for vibe check
        document.body.classList.add('vibe-check-active');
        
        // Add feature badge to chat area
        this.addFeatureBadge();
    }

    addFeatureBadge() {
        const badge = document.createElement('div');
        badge.className = 'feature-badge';
        badge.innerHTML = `
            <i class="fas fa-heart"></i>
            <span>01 - Vibe Check</span>
        `;
        
        // Insert badge before the first message
        if (this.chatMessages && this.chatMessages.firstChild) {
            this.chatMessages.insertBefore(badge, this.chatMessages.firstChild);
        }
    }

    // Override applyFeatureSettings for vibe check specifics
    applyFeatureSettings() {
        super.applyFeatureSettings();
        
        // Vibe check specific settings
        const feature = this.features[this.currentFeature];
        
        // Ensure upload file is hidden for vibe check
        if (this.uploadFileBtn) {
            this.uploadFileBtn.style.display = 'none';
        }
        
        // Show debug panel by default for educational purposes
        if (!this.mainContent.classList.contains('debug-open')) {
            this.toggleDebugPanel();
        }
    }

    // Override sendMessage to add vibe check specific behavior
    async sendMessage() {
        // Add some vibe check flair
        const message = this.messageInput.value.trim();
        
        // Check for vibe check specific commands
        if (message.toLowerCase().includes('vibe check')) {
            this.addVibeCheckResponse();
            this.messageInput.value = '';
            this.handleInputChange();
            return;
        }
        
        // Call parent method
        await super.sendMessage();
    }

    addVibeCheckResponse() {
        const vibeResponses = [
            "✨ Vibe is immaculate! You're in the perfect place to learn about LLMs.",
            "🚀 Great vibes detected! Ready to explore the world of AI together?",
            "💫 The vibe is strong with this one! Let's dive into some LLM magic.",
            "🎯 Vibe check passed! Welcome to your LLM learning journey.",
            "⚡ Excellent vibes! Perfect energy for mastering prompt engineering."
        ];
        
        const randomResponse = vibeResponses[Math.floor(Math.random() * vibeResponses.length)];
        this.addMessage(randomResponse, 'assistant');
        
        // Add to conversation history
        this.conversation.push({ role: 'assistant', content: randomResponse });
    }

    // Override formatMessage to add vibe check specific formatting
    formatMessage(content) {
        let formatted = super.formatMessage(content);
        
        // Add some vibe check specific emoji replacements
        formatted = formatted
            .replace(/\bvibe\b/gi, '✨ vibe ✨')
            .replace(/\bawesome\b/gi, '🚀 awesome')
            .replace(/\bgreat\b/gi, '🌟 great');
            
        return formatted;
    }

    // Add a method to demonstrate feature capabilities
    showVibeCheckFeatures() {
        this.addMessage(`
🎉 **Welcome to Vibe Check!**

This is your introduction to the LLM Bootcamp. Here's what you can explore:

🔍 **Debug Panel**: Watch the LLM processing pipeline in real-time
⚙️ **Settings**: Customize your system prompt and model selection
📊 **Export**: Save your conversations for later review
🎨 **Themes**: Toggle between light and dark modes
🔄 **Clear Chat**: Start fresh anytime

Try asking me about:
- How LLMs work
- Prompt engineering tips
- What happens behind the scenes when you send a message
- Anything else you're curious about!

Type "vibe check" anytime for a fun response! ✨
        `, 'assistant');
        
        this.conversation.push({ 
            role: 'assistant', 
            content: 'Welcome to Vibe Check! This is your introduction to the LLM Bootcamp with debug panel and basic chat functionality.' 
        });
    }
}

// Initialize the vibe check interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure base elements are ready
    setTimeout(() => {
        window.chatInterface = new VibeCheckInterface();
        
        // Check API health on load
        window.chatInterface.checkAPIHealth().then(isHealthy => {
            if (!isHealthy) {
                console.warn('API server may not be running. Please start the backend server.');
            }
        });
        
        // Show vibe check features after a delay if no API key
        setTimeout(() => {
            if (!window.chatInterface.apiKey) {
                // Don't show features until API key is set
                console.log('Set your API key to explore Vibe Check features!');
            }
        }, 2000);
    }, 100);
});