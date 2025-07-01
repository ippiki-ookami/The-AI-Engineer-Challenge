/**
 * RAG Frontend - Document upload and management
 */

class RAGManager {
    constructor() {
        this.uploadedDocuments = [];
        this.init();
    }

    init() {
        console.log('📄 RAG Manager initialized');
        this.setupDocumentsModal();
        this.setupFileUpload();
        this.setupDocumentSearch();
        ensureChatFadeOverlay();
    }

    setupDocumentsModal() {
        // Get modal elements
        this.documentsBtn = document.getElementById('documentsBtn');
        this.documentsModal = document.getElementById('documentsModal');
        this.closeDocumentsModal = document.getElementById('closeDocumentsModal');
        this.addDocumentBtn = document.getElementById('addDocumentBtn');
        this.documentsList = document.getElementById('documentsList');
        this.documentsEmpty = document.getElementById('documentsEmpty');
        this.documentsCount = document.getElementById('documentsCount');
        this.documentFileInput = document.getElementById('documentFileInput');

        if (!this.documentsBtn) return;

        // Show the documents button for RAG homework
        this.documentsBtn.style.display = 'flex';

        // Event listeners
        this.documentsBtn.addEventListener('click', () => this.openDocumentsModal());
        this.closeDocumentsModal?.addEventListener('click', () => this.closeDocumentsModalHandler());
        this.addDocumentBtn?.addEventListener('click', () => this.triggerFileUpload());
        
        // Close modal when clicking outside
        this.documentsModal?.addEventListener('click', (e) => {
            if (e.target === this.documentsModal) {
                this.closeDocumentsModalHandler();
            }
        });

        // Handle file input change
        this.documentFileInput?.addEventListener('change', (e) => this.handleDocumentUpload(e));
    }

    openDocumentsModal() {
        if (this.documentsModal) {
            this.documentsModal.style.display = 'flex';
            this.renderDocuments();
        }
    }

    closeDocumentsModalHandler() {
        if (this.documentsModal) {
            this.documentsModal.style.display = 'none';
        }
    }

    triggerFileUpload() {
        if (this.documentFileInput) {
            this.documentFileInput.click();
        }
    }

    async handleDocumentUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            await this.uploadDocument(file);
        }

        // Clear the input
        event.target.value = '';
        
        // Update the documents display
        this.renderDocuments();
    }

    async uploadDocument(file) {
        // Add document to local storage (session-only)
        const documentId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const document = {
            id: documentId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            content: await this.readFileContent(file)
        };

        this.uploadedDocuments.push(document);
        this.showNotification(`${file.name} uploaded successfully!`, 'success');
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    renderDocuments() {
        if (!this.documentsList || !this.documentsEmpty || !this.documentsCount) return;

        // Update count
        this.documentsCount.textContent = this.uploadedDocuments.length;

        if (this.uploadedDocuments.length === 0) {
            this.documentsEmpty.style.display = 'block';
            this.documentsList.innerHTML = '<div class="documents-empty" id="documentsEmpty"><i class="fas fa-file-text"></i><p>No documents uploaded yet</p><span>Upload documents to enable RAG functionality</span></div>';
            return;
        }

        this.documentsEmpty.style.display = 'none';
        
        // Render document list
        const documentsHtml = this.uploadedDocuments.map(doc => `
            <div class="document-item" data-document-id="${doc.id}">
                <div class="document-info">
                    <div class="document-icon">
                        <i class="fas ${this.getFileIcon(doc.type)}"></i>
                    </div>
                    <div class="document-details">
                        <h4>${doc.name}</h4>
                        <p>${this.formatFileSize(doc.size)} • ${this.formatDate(doc.uploadedAt)}</p>
                    </div>
                </div>
                <div class="document-actions">
                    <button class="action-btn view" onclick="ragManager.viewDocument('${doc.id}')" title="View Document">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="ragManager.deleteDocument('${doc.id}')" title="Delete Document">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.documentsList.innerHTML = documentsHtml;
    }

    getFileIcon(type) {
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('word')) return 'fa-file-word';
        if (type.includes('text')) return 'fa-file-text';
        return 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    viewDocument(documentId) {
        const document = this.uploadedDocuments.find(doc => doc.id === documentId);
        if (!document) return;

        // Create a modal to show document content
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas ${this.getFileIcon(document.type)}"></i> ${document.name}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="document-preview">
                        ${document.content}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    deleteDocument(documentId) {
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        this.uploadedDocuments = this.uploadedDocuments.filter(doc => doc.id !== documentId);
        this.renderDocuments();
        this.showNotification('Document deleted successfully', 'info');
    }

    setupFileUpload() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'ragFileInput';
        fileInput.accept = '.pdf,.doc,.docx,.txt';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Setup upload button in input features
        const uploadBtn = document.getElementById('uploadFile');
        if (uploadBtn) {
            uploadBtn.style.display = 'flex'; // Show the upload button for RAG
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });

        // Setup drag and drop on chat area
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        chatMessages.addEventListener('dragover', (e) => {
            e.preventDefault();
            chatMessages.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
            chatMessages.style.border = '2px dashed var(--primary-color)';
        });

        chatMessages.addEventListener('dragleave', (e) => {
            e.preventDefault();
            chatMessages.style.backgroundColor = '';
            chatMessages.style.border = '';
        });

        chatMessages.addEventListener('drop', (e) => {
            e.preventDefault();
            chatMessages.style.backgroundColor = '';
            chatMessages.style.border = '';
            
            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter(file => 
                file.type === 'text/plain' || 
                file.type === 'application/pdf' ||
                file.type === 'application/msword' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            
            if (validFiles.length > 0) {
                this.handleFileUpload(validFiles);
            } else {
                this.showNotification('Please upload PDF, Word, or TXT files only.', 'error');
            }
        });
    }

    setupDocumentSearch() {
        // Add document search input to input features when RAG is active
        const inputFeatures = document.querySelector('.input-features');
        if (inputFeatures && !document.getElementById('documentSearch')) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.id = 'documentSearch';
            searchInput.className = 'document-search';
            searchInput.placeholder = 'Search documents...';
            searchInput.style.display = 'none'; // Hidden until documents are uploaded
            
            // Insert before export button
            const exportBtn = document.getElementById('exportChat');
            inputFeatures.insertBefore(searchInput, exportBtn);

            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter' && searchInput.value.trim()) {
                    this.searchDocuments(searchInput.value.trim());
                }
            });
        }
    }

    async handleFileUpload(files) {
        for (const file of files) {
            try {
                await this.uploadFile(file);
            } catch (error) {
                console.error('Upload failed for', file.name, error);
                this.showNotification(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }
        
        // Show document search if we have documents
        const searchInput = document.getElementById('documentSearch');
        if (searchInput && this.uploadedDocuments.length > 0) {
            searchInput.style.display = 'block';
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show upload progress in chat
        this.addUploadMessage(file.name, 'uploading');

        try {
            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
                headers: {
                    'Feature-ID': '02-embeddings-rag'
                }
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Add to our local store
            this.uploadedDocuments.push({
                name: file.name,
                size: file.size,
                type: file.type,
                uploadResult: result
            });

            // Update upload message to success
            this.updateUploadMessage(file.name, 'success', result);
            this.showNotification(`${file.name} uploaded successfully!`, 'success');

        } catch (error) {
            this.updateUploadMessage(file.name, 'error', { error: error.message });
            throw error;
        }
    }

    addUploadMessage(fileName, status) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.id = `upload-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        const statusIcon = status === 'uploading' ? 'fa-spinner fa-spin' : 
                          status === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const statusColor = status === 'uploading' ? 'var(--accent-color)' : 
                           status === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas ${statusIcon}" style="color: ${statusColor}"></i>
                    <span>Document Upload</span>
                </div>
                <div class="message-text">
                    <strong>${fileName}</strong>
                    <br>Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateUploadMessage(fileName, status, result) {
        const messageId = `upload-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const statusIcon = status === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const statusColor = status === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)';
        
        let statusText = status === 'success' ? 
            `Successfully uploaded! Content length: ${result.content_length} characters` :
            `Upload failed: ${result.error}`;

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas ${statusIcon}" style="color: ${statusColor}"></i>
                    <span>Document Upload</span>
                </div>
                <div class="message-text">
                    <strong>${fileName}</strong>
                    <br>Status: ${statusText}
                    ${status === 'success' && result.content_preview ? 
                        `<br><br><em>Preview:</em><br><code style="font-size: 0.8em; background: var(--bg-tertiary); padding: 0.5rem; border-radius: 4px; display: block; margin-top: 0.5rem;">${result.content_preview}</code>` : ''}
                </div>
            </div>
        `;
    }

    async searchDocuments(query) {
        try {
            const response = await fetch('/api/search-documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Feature-ID': '02-embeddings-rag'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const results = await response.json();
            this.displaySearchResults(query, results);

        } catch (error) {
            console.error('Document search failed:', error);
            this.showNotification(`Search failed: ${error.message}`, 'error');
        }
    }

    displaySearchResults(query, results) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        
        let resultText = `Search results for "<strong>${query}</strong>":\n\n`;
        
        if (results.length === 0) {
            resultText += 'No matching documents found.';
        } else {
            results.forEach((result, index) => {
                resultText += `${index + 1}. <strong>${result.document}</strong>\n`;
                resultText += `   ${result.match_context}\n`;
                resultText += `   (${result.relevance_score} matches)\n\n`;
            });
        }
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas fa-search" style="color: var(--primary-color)"></i>
                    <span>Document Search</span>
                </div>
                <div class="message-text">${resultText}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Method to clean up when switching away from RAG
    cleanup() {
        const searchInput = document.getElementById('documentSearch');
        if (searchInput) {
            searchInput.style.display = 'none';
        }
        
        const uploadBtn = document.getElementById('uploadFile');
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
        }

        // Hide the documents button when switching away from RAG
        if (this.documentsBtn) {
            this.documentsBtn.style.display = 'none';
        }

        // Close the modal if it's open
        if (this.documentsModal) {
            this.documentsModal.style.display = 'none';
        }

        removeChatFadeOverlay();
    }
}

// Export for use in homework platform
window.RAGManager = RAGManager;

// --- Star Wars fade overlay logic (now uses chat-viewport wrapper) ---
function ensureChatFadeOverlay() {
    const chatViewport = document.getElementById('chatViewport');
    if (chatViewport && !chatViewport.querySelector('.chat-fade-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-fade-overlay';
        chatViewport.appendChild(overlay);
    }
}
function removeChatFadeOverlay() {
    const chatViewport = document.getElementById('chatViewport');
    if (chatViewport) {
        chatViewport.querySelectorAll('.chat-fade-overlay').forEach(el => el.remove());
    }
}