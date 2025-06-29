# 📄 Homework 02: Embeddings and RAG

## 🎯 **Overview**

Homework 02 introduces **Retrieval-Augmented Generation (RAG)** - a powerful technique that combines document retrieval with language model generation. This homework demonstrates document upload, processing, and retrieval-augmented chat.

## ✨ **Key Features**

### 🔧 **Clean Debug Tracking**
- **No extra function checks** (no 3-second test or parallel failure test)
- **Focused debug tracking** for document processing only
- **Upload progress** visible in debug panel
- **Document content preview** in debug viewer

### 📁 **Document Upload System**
- **Upload button** appears next to input field when RAG is selected
- **Drag & drop support** in chat area
- **File type validation** (PDF, Word, TXT)
- **Real-time upload progress** with notifications
- **Content extraction** and preview

### 🔍 **Document Search**
- **Search input** appears after uploading documents
- **Keyword-based search** through uploaded content
- **Contextual excerpts** with relevance scoring
- **Search results** displayed in chat

### 🏗️ **Complete Code Isolation**
- **Separate folder structure**: `features/02-embeddings-rag/`
- **Independent backend handler**: No shared code with vibe check
- **Custom frontend**: RAG-specific CSS and JavaScript
- **Dynamic loading**: Only loads when selected from dropdown

## 🚀 **How to Use**

### 1. **Switch to RAG Homework**
```bash
# Option 1: Use unified platform (recommended)
python scripts/run_feature.py --unified

# Option 2: Run RAG homework individually  
python scripts/run_feature.py --feature 02-embeddings-rag
```

### 2. **Access the Interface**
- Open http://localhost:8000 (unified) or http://localhost:8001 (individual)
- Select **"02 - Embeddings and RAG"** from dropdown
- Upload button appears next to message input

### 3. **Upload Documents**
**Method 1: Upload Button**
- Click the upload button (📁) next to message input
- Select PDF, Word, or TXT files
- Watch upload progress in chat

**Method 2: Drag & Drop**
- Drag files directly into chat area
- Chat area highlights when dragging
- Supports multiple file upload

### 4. **Explore Debug Panel**
- Click debug button to open panel
- Watch document processing in real-time
- Click "View" on debug entries to see:
  - File content preview
  - Processing results
  - Upload metadata

### 5. **Search Documents**
- After uploading, search input appears
- Type keywords and press Enter
- View search results in chat
- Results show contextual excerpts

## 🛠️ **Technical Implementation**

### **Backend Architecture**
```
features/02-embeddings-rag/
├── backend/
│   └── handler.py          # RAGHandler class
└── frontend/
    ├── rag.css            # RAG-specific styles
    └── rag.js             # Upload & search functionality
```

### **Key Components**

#### **RAGHandler Class**
```python
class RAGHandler(BaseChatHandler):
    """RAG handler with simplified debug tracking"""
    
    @debug_track("Processing Document Upload")
    async def process_document_upload(self, file_name, file_content, file_type):
        # Document processing with debug visibility
    
    @debug_track("Searching Document Store") 
    async def search_documents(self, query):
        # Simple keyword search for demo
```

#### **Frontend Integration**
```javascript
class RAGManager {
    async handleFileUpload(files) {
        // Upload files to /api/upload-document
        // Show progress in chat
        // Update debug panel
    }
    
    async searchDocuments(query) {
        // Search via /api/search-documents
        // Display results in chat
    }
}
```

### **Debug Tracking Differences**

| Feature | Vibe Check (01) | RAG (02) |
|---------|----------------|----------|
| 3-Second Test | ✅ Included | ❌ Not included |
| Parallel Failure Test | ✅ Included | ❌ Not included |
| Document Processing | ❌ N/A | ✅ Included |
| Upload Progress | ❌ N/A | ✅ Included |
| Search Functionality | ❌ N/A | ✅ Included |

## 📋 **Supported File Types**

| Type | Extension | Processing |
|------|-----------|------------|
| **Text** | `.txt` | ✅ Full content extraction |
| **PDF** | `.pdf` | ⚠️ Metadata only (demo) |
| **Word** | `.doc`, `.docx` | ⚠️ Metadata only (demo) |

> **Note**: Full PDF/Word processing requires additional libraries (PyPDF2, python-docx). Current implementation shows the upload workflow with metadata preview.

## 🔧 **API Endpoints**

### **Upload Document**
```http
POST /api/upload-document
Content-Type: multipart/form-data
Feature-ID: 02-embeddings-rag

Body: file (multipart upload)
```

### **Search Documents**
```http
POST /api/search-documents
Content-Type: application/json
Feature-ID: 02-embeddings-rag

Body: {"query": "search keywords"}
```

## 📊 **Debug Panel Integration**

### **Upload Process**
1. **"Processing Document Upload"** - Shows file processing
2. **Content preview** - Clickable to view full content
3. **Upload results** - Metadata and success status

### **Search Process**
1. **"Searching Document Store"** - Shows search execution
2. **Search results** - Matching documents and excerpts
3. **Relevance scoring** - Number of keyword matches

## 🎓 **Educational Value**

### **Concepts Demonstrated**
- **Document Processing Pipeline**
- **Content Extraction and Storage**
- **Keyword-based Retrieval**
- **Debug Transparency**
- **File Upload Workflows**

### **Real-world Applications**
- **Document Q&A Systems**
- **Knowledge Base Search**
- **Content Management**
- **Research Tools**

## 🐛 **Troubleshooting**

### **Upload Button Not Appearing**
```bash
# Check if RAG is properly selected
# Console should show: "📄 RAG Manager initialized"
```

### **File Upload Fails**
```bash
# Check file type - only PDF, Word, TXT supported
# Check file size - ensure reasonable size limits
# Check server logs for detailed error info
```

### **Search Not Working**
```bash
# Ensure documents are uploaded first
# Search input only appears after successful upload
# Check debug panel for search process details
```

### **Debug Panel Empty**
```bash
# Ensure debug panel is open (click debug button)
# Upload or search to generate debug entries
# Check browser console for any errors
```

## 🚀 **Next Steps**

This homework provides the foundation for advanced RAG features:

- **Vector Embeddings** (Homework 03+)
- **Semantic Search** vs keyword search
- **Multiple Document Types** (images, code, etc.)
- **Advanced Chunking Strategies**
- **Citation and Source Tracking**

## 🏆 **Success Criteria**

✅ **Upload documents successfully**
✅ **See content in debug panel**
✅ **Search uploaded documents**
✅ **View search results in chat**
✅ **Experience complete code isolation**
✅ **Understand RAG workflow through debug transparency**

---

**Perfect for**: Learning document processing, understanding RAG concepts, exploring debug transparency in complex workflows.