/**
 * Feature Adapter for Frontend
 * Shows how to modify the chat request to include feature selection
 */

// In your main script.js, modify the streamChat method:
/*
async streamChat(message) {
    const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_message: message,
            developer_message: this.developerMessage,
            api_key: this.apiKey,
            model: this.currentModel,
            feature_id: this.currentFeature  // Add this line
        })
    });
    
    // ... rest of the streaming logic
}
*/

// Example of feature-specific modules that can be loaded dynamically
export class VibeCheckFeature {
    constructor(chatInterface) {
        this.chat = chatInterface;
    }
    
    initialize() {
        console.log('Vibe Check feature initialized');
        // No special UI needed for basic chat
    }
    
    cleanup() {
        console.log('Vibe Check feature cleanup');
    }
}

export class RAGFeature {
    constructor(chatInterface) {
        this.chat = chatInterface;
    }
    
    async initialize() {
        console.log('RAG feature initialized');
        // Add RAG-specific UI elements
        this.addUploadPanel();
        this.addDocumentList();
    }
    
    addUploadPanel() {
        const panel = document.createElement('div');
        panel.id = 'ragUploadPanel';
        panel.innerHTML = `
            <div class="rag-panel">
                <h3>Document Upload</h3>
                <input type="file" id="ragFileInput" accept=".pdf,.txt,.md">
                <button onclick="uploadDocument()">Upload</button>
            </div>
        `;
        document.querySelector('.input-container').appendChild(panel);
    }
    
    addDocumentList() {
        const list = document.createElement('div');
        list.id = 'ragDocumentList';
        list.className = 'document-list';
        list.innerHTML = '<h4>Uploaded Documents</h4><ul></ul>';
        document.querySelector('.debug-panel').appendChild(list);
    }
    
    cleanup() {
        console.log('RAG feature cleanup');
        // Remove RAG-specific elements
        document.getElementById('ragUploadPanel')?.remove();
        document.getElementById('ragDocumentList')?.remove();
    }
    
    async uploadDocument() {
        const fileInput = document.getElementById('ragFileInput');
        const file = fileInput.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${this.chat.apiBaseUrl}/api/rag/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            this.chat.showNotification('Document uploaded successfully!', 'success');
            this.refreshDocumentList();
        }
    }
}