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
        this.setupRAGConfiguration();
        this.setupRAGConsole();
        document.querySelector('.chat-container')?.classList.add('rag-fade-active');
        
        // Initialize configuration (load from localStorage or use defaults)
        this.loadSavedConfig();
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
        this.toggleDocumentsBtn = document.getElementById('toggleDocumentsBtn');

        if (!this.documentsBtn) return;

        // Show the documents button for RAG homework
        this.documentsBtn.style.display = 'flex';
        
        // Show the config button for RAG homework
        const ragConfigBtn = document.getElementById('ragConfigBtn');
        if (ragConfigBtn) {
            ragConfigBtn.style.display = 'flex';
        }

        // Event listeners
        this.documentsBtn.addEventListener('click', () => this.openDocumentsModal());
        this.closeDocumentsModal?.addEventListener('click', () => this.closeDocumentsModalHandler());
        this.addDocumentBtn?.addEventListener('click', () => this.triggerFileUpload());
        this.toggleDocumentsBtn?.addEventListener('click', () => this.toggleDocumentsList());
        
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
            // Set up console event listeners when modal opens
            this.setupConsoleEventListeners();
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

    toggleDocumentsList() {
        if (!this.documentsList || !this.toggleDocumentsBtn) return;
        
        const isCollapsed = this.documentsList.classList.contains('collapsed');
        const documentsSection = document.querySelector('.documents-section');
        
        if (isCollapsed) {
            // Expand
            this.documentsList.classList.remove('collapsed');
            this.toggleDocumentsBtn.classList.remove('collapsed');
            documentsSection?.classList.remove('documents-collapsed');
        } else {
            // Collapse
            this.documentsList.classList.add('collapsed');
            this.toggleDocumentsBtn.classList.add('collapsed');
            documentsSection?.classList.add('documents-collapsed');
        }
    }

    async handleDocumentUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Show progress bar
        this.showProgressBar();

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.updateProgressBar(i / files.length * 50, `Processing ${file.name}...`);
                await this.uploadDocument(file);
                this.updateProgressBar((i + 1) / files.length * 100, `Completed ${file.name}`);
            }
        } catch (error) {
            this.updateProgressBar(0, `Error: ${error.message}`, true);
            setTimeout(() => this.hideProgressBar(), 3000);
            return;
        }

        // Clear the input
        event.target.value = '';
        
        // Update the documents display
        this.renderDocuments();
        
        // Hide progress bar after short delay
        setTimeout(() => this.hideProgressBar(), 1000);
        
        // Show console area if we have documents
        this.updateConsoleVisibility();
    }

    async uploadDocument(file) {
        // Validate file type
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'text/markdown'];
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Unsupported file type: ${file.type}. Please upload TXT, PDF, DOC, DOCX, or MD files.`);
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('Please enter your API key first');
        }

        // Read file content as bytes
        const fileContent = await this.readFileAsBytes(file);
        
        // Upload to backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-document', {
            method: 'POST',
            body: formData,
            headers: {
                'Feature-ID': '02-embeddings-rag',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Add to local document store
        const documentId = result.document_id || (Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        const docData = {
            id: documentId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            content: result.content_preview || 'Content processed by server',
            processed: true,
            chunks_created: result.chunks_created,
            vector_db_ready: result.vector_db_ready
        };

        this.uploadedDocuments.push(docData);
        this.showNotification(`${file.name} uploaded successfully! ${result.chunks_created} chunks created.`, 'success');
    }

    async readFileAsBytes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    showProgressBar() {
        // Create progress bar if it doesn't exist
        let progressBar = document.getElementById('documentProgressBar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'documentProgressBar';
            progressBar.className = 'document-progress-bar';
            progressBar.innerHTML = `
                <div class="progress-info">
                    <span class="progress-text">Initializing...</span>
                    <span class="progress-percentage">0%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill"></div>
                </div>
            `;
            
            // Add to documents modal
            const modalBody = this.documentsModal.querySelector('.modal-body');
            modalBody.appendChild(progressBar);
        }
        
        progressBar.style.display = 'block';
    }

    updateProgressBar(percentage, text, isError = false) {
        const progressBar = document.getElementById('documentProgressBar');
        if (!progressBar) return;
        
        const progressText = progressBar.querySelector('.progress-text');
        const progressPercentage = progressBar.querySelector('.progress-percentage');
        const progressFill = progressBar.querySelector('.progress-fill');
        
        if (progressText) progressText.textContent = text;
        if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
            progressFill.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        }
    }

    hideProgressBar() {
        const progressBar = document.getElementById('documentProgressBar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
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

        // Update console visibility when documents are available
        this.updateConsoleVisibility();

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
                    <button class="action-btn view" onclick="window.ragManager.viewDocument('${doc.id}')" title="View Document">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="window.ragManager.deleteDocument('${doc.id}')" title="Delete Document">
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
        const docData = this.uploadedDocuments.find(doc => doc.id === documentId);
        if (!docData) return;

        // Get document content from backend if needed
        this.fetchDocumentContent(documentId).then(contentData => {
            // Create a modal to show document content
            const modal = document.createElement('div');
            modal.className = 'modal active';
            
            // Extract content (could be string or object)
            const fullContent = typeof contentData === 'string' ? contentData : contentData.full_content;
            const wordCount = contentData.word_count || 0;
            const lineCount = contentData.line_count || 0;
            
            modal.innerHTML = `
                <div class="modal-content document-viewer-modal">
                    <div class="modal-header">
                        <h3><i class="fas ${this.getFileIcon(docData.type)}"></i> ${docData.name}</h3>
                        <div class="document-stats">
                            <span class="stat"><i class="fas fa-file-alt"></i> ${this.formatFileSize(docData.size)}</span>
                            <span class="stat"><i class="fas fa-align-left"></i> ${wordCount.toLocaleString()} words</span>
                            <span class="stat"><i class="fas fa-list-ol"></i> ${lineCount.toLocaleString()} lines</span>
                            ${docData.chunks_created ? `<span class="stat"><i class="fas fa-puzzle-piece"></i> ${docData.chunks_created} chunks</span>` : ''}
                            <span class="stat ${docData.vector_db_ready ? 'ready' : 'processing'}">
                                <i class="fas ${docData.vector_db_ready ? 'fa-check-circle' : 'fa-clock'}"></i> 
                                ${docData.vector_db_ready ? 'Vector DB Ready' : 'Processing...'}
                            </span>
                        </div>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="document-content-viewer">
                            <div class="content-header">
                                <h4>Complete Document Content</h4>
                                <p class="content-info">
                                    Full extracted text with start/end markers. 
                                    <strong>Scroll to view entire document.</strong>
                                    If you see the end marker, the document was fully processed.
                                </p>
                            </div>
                            <div class="document-text-content full-document-content">
                                ${this.formatDocumentContent(fullContent)}
                            </div>
                            <div class="scroll-indicator">
                                <i class="fas fa-arrow-down"></i>
                                <span>Scroll to view more content</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            
            // Add scroll event listener to hide/show scroll indicator
            const textContent = modal.querySelector('.document-text-content');
            const scrollIndicator = modal.querySelector('.scroll-indicator');
            
            if (textContent && scrollIndicator) {
                textContent.addEventListener('scroll', () => {
                    const isScrolledToBottom = textContent.scrollTop + textContent.clientHeight >= textContent.scrollHeight - 10;
                    scrollIndicator.style.display = isScrolledToBottom ? 'none' : 'flex';
                });
                
                // Initial check
                const isScrolledToBottom = textContent.scrollTop + textContent.clientHeight >= textContent.scrollHeight - 10;
                scrollIndicator.style.display = isScrolledToBottom ? 'none' : 'flex';
            }
        }).catch(error => {
            this.showNotification(`Error loading document: ${error.message}`, 'error');
        });
    }

    async fetchDocumentContent(documentId) {
        const docData = this.uploadedDocuments.find(doc => doc.id === documentId);
        if (!docData) {
            throw new Error('Document not found');
        }

        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('API key required to view document content');
        }

        try {
            // Fetch full document content from backend
            const response = await fetch(`/api/document/${documentId}/content`, {
                method: 'GET',
                headers: {
                    'Feature-ID': '02-embeddings-rag',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch document content: ${response.statusText}`);
            }

            const contentData = await response.json();
            return contentData;

        } catch (error) {
            console.error('Error fetching document content:', error);
            // Fallback to local content if API fails
            return {
                full_content: docData.content || 'No content available',
                word_count: docData.word_count || 0,
                line_count: docData.line_count || 0
            };
        }
    }

    formatDocumentContent(content) {
        // Escape HTML and preserve line breaks
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Convert line breaks to HTML breaks
        return escaped.replace(/\n/g, '<br>');
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

        // Get API key from localStorage
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            this.showNotification('Please enter your API key first', 'error');
            return;
        }

        // Show upload progress in chat
        this.addUploadMessage(file.name, 'uploading');

        try {
            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
                headers: {
                    'Feature-ID': '02-embeddings-rag',
                    'Authorization': `Bearer ${apiKey}`
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

            // Update upload message to success with RAG details
            this.updateUploadMessage(file.name, 'success', result);
            
            // Show detailed success notification with RAG pipeline info
            const pipelineStatus = result.vector_db_ready ? '✅ RAG Pipeline Ready' : '⏳ Processing...';
            this.showNotification(
                `${file.name} uploaded! ${result.chunks_created} chunks created. ${pipelineStatus}`, 
                'success'
            );

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
        
        let statusText = '';
        if (status === 'success') {
            statusText = `Successfully processed with RAG pipeline!
            • Content: ${result.content_length} characters
            • Chunks: ${result.chunks_created} created
            • Vector DB: ${result.total_chunks_in_db} total chunks
            • Pipeline: ${result.vector_db_ready ? 'Ready for questions!' : 'Processing...'}`;
        } else {
            statusText = `Upload failed: ${result.error}`;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <i class="fas ${statusIcon}" style="color: ${statusColor}"></i>
                    <span>RAG Document Processing</span>
                </div>
                <div class="message-text">
                    <strong>${fileName}</strong>
                    <br><span style="white-space: pre-line;">${statusText}</span>
                    ${status === 'success' && result.content_preview ? 
                        `<br><br><em>Preview:</em><br><code style="font-size: 0.8em; background: var(--bg-tertiary); padding: 0.5rem; border-radius: 4px; display: block; margin-top: 0.5rem;">${result.content_preview}</code>` : ''}
                </div>
            </div>
        `;
    }

    async searchDocuments(query) {
        try {
            // Get API key from localStorage
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) {
                this.showNotification('Please enter your API key first', 'error');
                return;
            }

            const response = await fetch('/api/search-documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Feature-ID': '02-embeddings-rag',
                    'Authorization': `Bearer ${apiKey}`
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
        console.log('📚 RAG Manager cleaned up');
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

        // Hide the config button when switching away from RAG
        const ragConfigBtn = document.getElementById('ragConfigBtn');
        if (ragConfigBtn) {
            ragConfigBtn.style.display = 'none';
        }

        // Close the modals if they're open
        if (this.documentsModal) {
            this.documentsModal.style.display = 'none';
        }
        
        const ragConfigModal = document.getElementById('ragConfigModal');
        if (ragConfigModal) {
            ragConfigModal.style.display = 'none';
        }

        document.querySelector('.chat-container')?.classList.remove('rag-fade-active');
    }

    // ==================== RAG CONFIGURATION METHODS ====================

    setupRAGConfiguration() {
        // Get modal elements
        this.ragConfigBtn = document.getElementById('ragConfigBtn');
        this.ragConfigModal = document.getElementById('ragConfigModal');
        this.closeRagConfigModal = document.getElementById('closeRagConfigModal');

        if (!this.ragConfigBtn || !this.ragConfigModal) return;

        // Event listeners
        this.ragConfigBtn.addEventListener('click', () => this.openRagConfigModal());
        this.closeRagConfigModal?.addEventListener('click', () => this.closeRagConfigModalHandler());

        // Configuration action buttons
        document.getElementById('saveRagConfig')?.addEventListener('click', () => this.saveRagConfig());
        document.getElementById('resetRagConfig')?.addEventListener('click', () => this.resetRagConfig());
        document.getElementById('exportRagConfig')?.addEventListener('click', () => this.exportRagConfig());
        document.getElementById('importRagConfigBtn')?.addEventListener('click', () => this.triggerImportConfig());
        document.getElementById('importRagConfig')?.addEventListener('change', (e) => this.importRagConfig(e));

        // Close modal when clicking outside
        this.ragConfigModal?.addEventListener('click', (e) => {
            if (e.target === this.ragConfigModal) {
                this.closeRagConfigModalHandler();
            }
        });
    }

    getDefaultConfig() {
        return {
            textProcessing: {
                chunkSize: 1000,
                chunkOverlap: 200,
                previewLength: 500,
                snippetLength: 200
            },
            embeddings: {
                embeddingModel: 'text-embedding-3-small',
                batchSize: 100
            },
            searchRetrieval: {
                searchResultsK: 5,
                ragContextK: 4,
                adjacentChunks: 1,
                scoringStrategy: 'reembed',
                comparisonChunkSize: 3000
            },
            llmGeneration: {
                ragModel: 'gpt-4o-mini',
                temperature: 0.1,
                responseStyle: 'detailed',
                includeScores: true
            }
        };
    }

    openRagConfigModal() {
        if (!this.ragConfigModal) return;
        
        // Load current configuration into form
        this.loadConfigIntoForm();
        this.ragConfigModal.style.display = 'flex';
    }

    closeRagConfigModalHandler() {
        if (this.ragConfigModal) {
            this.ragConfigModal.style.display = 'none';
        }
    }

    loadConfigIntoForm() {
        const defaultConfig = this.getDefaultConfig();
        const config = this.ragConfig || defaultConfig;

        // Merge with defaults to ensure all properties exist
        const mergedConfig = {
            textProcessing: { ...defaultConfig.textProcessing, ...config.textProcessing },
            embeddings: { ...defaultConfig.embeddings, ...config.embeddings },
            searchRetrieval: { ...defaultConfig.searchRetrieval, ...config.searchRetrieval },
            llmGeneration: { ...defaultConfig.llmGeneration, ...config.llmGeneration }
        };

        // Text Processing
        document.getElementById('chunkSize').value = mergedConfig.textProcessing.chunkSize;
        document.getElementById('chunkOverlap').value = mergedConfig.textProcessing.chunkOverlap;
        document.getElementById('previewLength').value = mergedConfig.textProcessing.previewLength;
        document.getElementById('snippetLength').value = mergedConfig.textProcessing.snippetLength;

        // Embeddings
        document.getElementById('embeddingModel').value = mergedConfig.embeddings.embeddingModel;
        document.getElementById('batchSize').value = mergedConfig.embeddings.batchSize;

        // Search & Retrieval
        document.getElementById('searchResultsK').value = mergedConfig.searchRetrieval.searchResultsK;
        document.getElementById('ragContextK').value = mergedConfig.searchRetrieval.ragContextK;
        document.getElementById('adjacentChunks').value = mergedConfig.searchRetrieval.adjacentChunks;
        document.getElementById('scoringStrategy').value = mergedConfig.searchRetrieval.scoringStrategy;
        document.getElementById('comparisonChunkSize').value = mergedConfig.searchRetrieval.comparisonChunkSize;

        // LLM Generation
        document.getElementById('ragModel').value = mergedConfig.llmGeneration.ragModel;
        document.getElementById('temperature').value = mergedConfig.llmGeneration.temperature;
        document.getElementById('responseStyle').value = mergedConfig.llmGeneration.responseStyle;
        document.getElementById('includeScores').value = mergedConfig.llmGeneration.includeScores.toString();
    }

    saveRagConfig() {
        try {
            // Gather configuration from form
            const newConfig = {
                textProcessing: {
                    chunkSize: parseInt(document.getElementById('chunkSize').value),
                    chunkOverlap: parseInt(document.getElementById('chunkOverlap').value),
                    previewLength: parseInt(document.getElementById('previewLength').value),
                    snippetLength: parseInt(document.getElementById('snippetLength').value)
                },
                embeddings: {
                    embeddingModel: document.getElementById('embeddingModel').value,
                    batchSize: parseInt(document.getElementById('batchSize').value)
                },
                searchRetrieval: {
                    searchResultsK: parseInt(document.getElementById('searchResultsK').value),
                    ragContextK: parseInt(document.getElementById('ragContextK').value),
                    adjacentChunks: parseInt(document.getElementById('adjacentChunks').value),
                    scoringStrategy: document.getElementById('scoringStrategy').value,
                    comparisonChunkSize: parseInt(document.getElementById('comparisonChunkSize').value)
                },
                llmGeneration: {
                    ragModel: document.getElementById('ragModel').value,
                    temperature: parseFloat(document.getElementById('temperature').value),
                    responseStyle: document.getElementById('responseStyle').value,
                    includeScores: document.getElementById('includeScores').value === 'true'
                }
            };

            // Validate configuration
            if (this.validateConfig(newConfig)) {
                // Save configuration
                this.ragConfig = newConfig;
                localStorage.setItem('rag_config', JSON.stringify(newConfig));
                
                // Send configuration to backend (if needed)
                this.sendConfigToBackend(newConfig);
                
                this.showNotification('RAG configuration saved successfully!', 'success');
                this.closeRagConfigModalHandler();
            }
        } catch (error) {
            console.error('Error saving RAG config:', error);
            this.showNotification('Failed to save configuration: ' + error.message, 'error');
        }
    }

    validateConfig(config) {
        // Validate chunk sizes
        if (config.textProcessing.chunkSize < 100 || config.textProcessing.chunkSize > 5000) {
            this.showNotification('Chunk size must be between 100 and 5000', 'error');
            return false;
        }

        if (config.textProcessing.chunkOverlap >= config.textProcessing.chunkSize) {
            this.showNotification('Chunk overlap must be less than chunk size', 'error');
            return false;
        }

        // Validate k values
        if (config.searchRetrieval.searchResultsK < 1 || config.searchRetrieval.searchResultsK > 20) {
            this.showNotification('Search results k must be between 1 and 20', 'error');
            return false;
        }

        if (config.searchRetrieval.ragContextK < 1 || config.searchRetrieval.ragContextK > 10) {
            this.showNotification('RAG context k must be between 1 and 10', 'error');
            return false;
        }
        
        if (config.searchRetrieval.adjacentChunks < 0 || config.searchRetrieval.adjacentChunks > 5) {
            this.showNotification('Adjacent chunks must be between 0 and 5', 'error');
            return false;
        }
        
        if (config.searchRetrieval.comparisonChunkSize < 1000 || config.searchRetrieval.comparisonChunkSize > 8000) {
            this.showNotification('Comparison chunk size must be between 1000 and 8000', 'error');
            return false;
        }

        // Validate temperature
        if (config.llmGeneration.temperature < 0 || config.llmGeneration.temperature > 2) {
            this.showNotification('Temperature must be between 0.0 and 2.0', 'error');
            return false;
        }

        // Validate response style
        const validResponseStyles = ['detailed', 'concise', 'brief'];
        if (!validResponseStyles.includes(config.llmGeneration.responseStyle)) {
            this.showNotification('Response style must be detailed, concise, or brief', 'error');
            return false;
        }

        // Validate include scores
        if (typeof config.llmGeneration.includeScores !== 'boolean') {
            this.showNotification('Include scores must be true or false', 'error');
            return false;
        }

        return true;
    }

    resetRagConfig() {
        if (confirm('Reset all RAG configuration to defaults? This cannot be undone.')) {
            this.ragConfig = this.getDefaultConfig();
            localStorage.removeItem('rag_config');
            this.loadConfigIntoForm();
            this.showNotification('RAG configuration reset to defaults', 'info');
        }
    }

    exportRagConfig() {
        try {
            const config = this.ragConfig || this.getDefaultConfig();
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `rag-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('RAG configuration exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export configuration', 'error');
        }
    }

    triggerImportConfig() {
        const fileInput = document.getElementById('importRagConfig');
        if (fileInput) {
            fileInput.click();
        }
    }

    async importRagConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedConfig = JSON.parse(text);
            
            // Validate imported configuration
            if (this.validateImportedConfig(importedConfig)) {
                this.ragConfig = importedConfig;
                localStorage.setItem('rag_config', JSON.stringify(importedConfig));
                this.loadConfigIntoForm();
                this.showNotification('RAG configuration imported successfully!', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Failed to import configuration: Invalid JSON file', 'error');
        }

        // Clear the file input
        event.target.value = '';
    }

    validateImportedConfig(config) {
        // Check if config has required structure
        const requiredSections = ['textProcessing', 'embeddings', 'searchRetrieval', 'llmGeneration'];
        for (const section of requiredSections) {
            if (!config[section]) {
                this.showNotification(`Invalid config: Missing ${section} section`, 'error');
                return false;
            }
        }

        // Validate using existing validation
        return this.validateConfig(config);
    }

    async sendConfigToBackend(config) {
        // Send configuration to backend for dynamic updates
        // This would require backend API endpoint to accept configuration updates
        try {
            const apiKey = localStorage.getItem('openai_api_key');
            if (!apiKey) return;

            const response = await fetch('/api/rag-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Feature-ID': '02-embeddings-rag',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ config: config })
            });

            if (response.ok) {
                console.log('Configuration sent to backend successfully');
            }
        } catch (error) {
            console.log('Backend config update not available:', error.message);
            // This is optional - the configuration will still work for frontend operations
        }
    }

    // Load configuration from localStorage on initialization
    loadSavedConfig() {
        try {
            const savedConfig = localStorage.getItem('rag_config');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                
                // Merge saved config with defaults to handle missing properties
                const defaultConfig = this.getDefaultConfig();
                this.ragConfig = {
                    textProcessing: { ...defaultConfig.textProcessing, ...parsedConfig.textProcessing },
                    embeddings: { ...defaultConfig.embeddings, ...parsedConfig.embeddings },
                    searchRetrieval: { ...defaultConfig.searchRetrieval, ...parsedConfig.searchRetrieval },
                    llmGeneration: { ...defaultConfig.llmGeneration, ...parsedConfig.llmGeneration }
                };
                return;
            }
        } catch (error) {
            console.log('Error loading saved config:', error);
        }
        
        // Fallback to defaults
        this.ragConfig = this.getDefaultConfig();
    }

    // ==================== RAG CONSOLE METHODS ====================

    setupRAGConsole() {
        // Initialize console state
        this.consoleHistory = [];
        this.consoleHistoryIndex = -1;
    }
    
    setupConsoleEventListeners() {
        const consoleInput = document.getElementById('consoleInput');
        const executeBtn = document.getElementById('consoleExecute');
        
        if (consoleInput && !consoleInput.hasEventListener) {
            consoleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeConsoleCommand();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory(1);
                }
            });
            consoleInput.hasEventListener = true; // Prevent duplicate listeners
        }
        
        if (executeBtn && !executeBtn.hasEventListener) {
            executeBtn.addEventListener('click', () => this.executeConsoleCommand());
            executeBtn.hasEventListener = true; // Prevent duplicate listeners
        }
    }

    updateConsoleVisibility() {
        const consoleArea = document.getElementById('ragConsole');
        if (this.uploadedDocuments.length > 0) {
            if (!consoleArea) {
                this.createConsoleArea();
            }
        } else if (consoleArea) {
            consoleArea.style.display = 'none';
        }
    }

    createConsoleArea() {
        const modalBody = this.documentsModal?.querySelector('.modal-body');
        if (!modalBody) return;

        // Check if console already exists
        let consoleArea = document.getElementById('ragConsole');
        if (consoleArea) {
            consoleArea.style.display = 'block';
            return;
        }

        consoleArea = document.createElement('div');
        consoleArea.id = 'ragConsole';
        consoleArea.className = 'rag-console';
        consoleArea.innerHTML = `
            <div class="console-header">
                <h4><i class="fas fa-terminal"></i> RAG Console</h4>
                <p class="console-info">Test commands against your vector database and RAG system</p>
            </div>
            <div class="console-output" id="consoleOutput">
                <div class="console-welcome">
                    <div class="console-line">
                        <span class="console-prompt">rag></span> 
                        <span class="console-text">Welcome to RAG Console! Try these commands:</span>
                    </div>
                    <div class="console-line">
                        <span class="console-prompt">   </span> 
                        <span class="console-text">vector_db.search_by_text("your query", k=3)</span>
                    </div>
                    <div class="console-line">
                        <span class="console-prompt">   </span> 
                        <span class="console-text">handler.get_documents_info()</span>
                    </div>
                    <div class="console-line">
                        <span class="console-prompt">   </span> 
                        <span class="console-text">vector_db.get_stats()</span>
                    </div>
                    <div class="console-line">
                        <span class="console-prompt">   </span> 
                        <span class="console-text">help() - show available commands</span>
                    </div>
                </div>
            </div>
            <div class="console-input-area">
                <span class="console-prompt">rag></span>
                <input type="text" id="consoleInput" class="console-input" placeholder="Enter command..." />
                <button id="consoleExecute" class="console-execute-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;

        modalBody.appendChild(consoleArea);

        // Setup event listeners
        const consoleInput = document.getElementById('consoleInput');
        const executeBtn = document.getElementById('consoleExecute');

        consoleInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeConsoleCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        executeBtn?.addEventListener('click', () => this.executeConsoleCommand());
    }

    navigateHistory(direction) {
        const consoleInput = document.getElementById('consoleInput');
        if (!consoleInput || this.consoleHistory.length === 0) return;

        if (direction === -1) { // Up arrow
            this.consoleHistoryIndex = Math.max(0, this.consoleHistoryIndex - 1);
        } else { // Down arrow
            this.consoleHistoryIndex = Math.min(this.consoleHistory.length - 1, this.consoleHistoryIndex + 1);
        }

        if (this.consoleHistoryIndex >= 0 && this.consoleHistoryIndex < this.consoleHistory.length) {
            consoleInput.value = this.consoleHistory[this.consoleHistoryIndex];
        }
    }

    async executeConsoleCommand() {
        const consoleInput = document.getElementById('consoleInput');
        const consoleOutput = document.getElementById('consoleOutput');
        
        if (!consoleInput || !consoleOutput) return;

        const command = consoleInput.value.trim();
        if (!command) return;

        // Add to history
        this.consoleHistory.push(command);
        this.consoleHistoryIndex = this.consoleHistory.length;

        // Clear input immediately
        consoleInput.value = '';

        // Add command to output
        this.addConsoleOutput(`rag> ${command}`, 'command');

        try {
            const result = await this.executeRAGCommand(command);
            this.addConsoleOutput(result, 'result');
        } catch (error) {
            this.addConsoleOutput(`Error: ${error.message}`, 'error');
        }

        this.scrollConsoleToBottom();
    }

    async executeRAGCommand(command) {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error('API key required for console commands');
        }

        // Send command to backend for execution
        const response = await fetch('/api/rag-console', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Feature-ID': '02-embeddings-rag',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ command: command })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Command failed: ${response.statusText}`);
        }

        const result = await response.json();
        return this.formatConsoleResult(result);
    }

    formatConsoleResult(result) {
        if (typeof result === 'string') return result;
        
        // Handle new backend response format
        if (result.success !== undefined) {
            if (!result.success) {
                return `Error: ${result.output}`;
            }
            return result.output;
        }
        
        // Legacy format handling
        if (result.type === 'search_results') {
            let formatted = `Found ${result.results.length} results:\n`;
            result.results.forEach((item, index) => {
                formatted += `\n[${index + 1}] Score: ${item.similarity_score.toFixed(4)}\n`;
                formatted += `    Text: ${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}\n`;
            });
            return formatted;
        }

        if (result.type === 'documents_info') {
            let formatted = `Documents loaded: ${result.count}\n`;
            result.documents.forEach((doc, index) => {
                formatted += `\n[${index + 1}] ${doc.name}\n`;
                formatted += `    Type: ${doc.type}, Size: ${doc.size} chars\n`;
                formatted += `    Chunks: ${doc.chunks_created || 'N/A'}\n`;
            });
            return formatted;
        }

        if (result.type === 'stats') {
            return `Vector Database Stats:
Documents: ${result.document_count}
Total Chunks: ${result.total_chunks}
Embedding Model: ${result.embedding_model}
Status: ${result.status}`;
        }

        if (result.type === 'help') {
            return result.help_text;
        }

        return JSON.stringify(result, null, 2);
    }

    addConsoleOutput(text, type = 'result') {
        const consoleOutput = document.getElementById('consoleOutput');
        if (!consoleOutput) return;

        const outputDiv = document.createElement('div');
        outputDiv.className = `console-line console-${type}`;
        
        if (type === 'command') {
            outputDiv.innerHTML = `<span class="console-text">${this.escapeHtml(text)}</span>`;
        } else if (type === 'error') {
            outputDiv.innerHTML = `<span class="console-error">${this.escapeHtml(text)}</span>`;
        } else {
            outputDiv.innerHTML = `<span class="console-result">${this.escapeHtml(text)}</span>`;
        }

        consoleOutput.appendChild(outputDiv);
    }

    scrollConsoleToBottom() {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
}

// Export for use in homework platform
window.RAGManager = RAGManager;