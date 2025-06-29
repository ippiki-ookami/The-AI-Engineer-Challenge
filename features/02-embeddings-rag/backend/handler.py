"""
Embeddings and RAG Handler - Document upload and retrieval-augmented generation
Inherits from BaseChatHandler with simplified debug tracking and document processing
"""
import sys
from pathlib import Path

# Add base directory to path so we can import base modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from base.backend.base_handler import BaseChatHandler, BaseChatRequest
from base.backend.debug_logger import debug_track


class RAGRequest(BaseChatRequest):
    """Request model specific to RAG feature"""
    
    def __init__(self, user_message: str, api_key: str, model: str = "gpt-4.1-mini", **kwargs):
        super().__init__(user_message, api_key, model, **kwargs)
        # RAG-specific fields
        self.uploaded_documents = kwargs.get('uploaded_documents', [])
        self.search_query = kwargs.get('search_query', '')


class RAGHandler(BaseChatHandler):
    """
    RAG (Retrieval-Augmented Generation) chat handler
    Demonstrates document upload, processing, and retrieval-augmented chat
    Simplified debug tracking without extra function checks
    """
    
    def __init__(self):
        super().__init__("Embeddings and RAG")
        self.document_store = []  # Simple in-memory document storage for demo
    
    @debug_track("Getting RAG System Prompt")
    async def get_system_prompt(self) -> str:
        """Return the system prompt for RAG"""
        return """You are an AI assistant specialized in Retrieval-Augmented Generation (RAG).

Your capabilities:
- Analyze and understand uploaded documents (PDF, Word, TXT)
- Answer questions based on document content
- Provide citations and references from the uploaded materials
- Help users explore and understand their documents

Your personality:
- Analytical and thorough
- Always reference the source documents when possible
- Clear about when you're using uploaded content vs. general knowledge
- Helpful in organizing and summarizing information

When documents are available, prioritize information from those documents.
When answering, indicate which document(s) you're referencing.
"""
    
    @debug_track("Processing RAG User Message")
    async def process_user_message(self, request: BaseChatRequest) -> str:
        """
        Process user message for RAG feature
        Simple processing without extra debug checks
        """
        message = request.user_message.strip()
        
        # Add document context if available
        if hasattr(request, 'uploaded_documents') and request.uploaded_documents:
            context_note = f"\n\n[Available documents: {', '.join([doc['name'] for doc in request.uploaded_documents])}]"
            enhanced_message = f"{message}{context_note}"
            return enhanced_message
        
        # For regular messages without documents
        return message
    
    @debug_track("Enhancing Messages with Document Context")
    async def enhance_messages(self, messages: list, request: BaseChatRequest) -> list:
        """
        Enhance messages with document context for RAG
        """
        # For RAG, we can add document summaries or relevant excerpts
        # For now, just return messages as-is since we haven't implemented document processing yet
        
        if self.document_store:
            # Add a simple document context message
            doc_context = f"Available documents ({len(self.document_store)}): "
            doc_context += ", ".join([doc['name'] for doc in self.document_store])
            
            # Insert context before the user message
            context_message = {
                "role": "system", 
                "content": f"Document context: {doc_context}"
            }
            # Insert before the last message (user message)
            messages.insert(-1, context_message)
        
        return messages
    
    @debug_track("Processing Document Upload")
    async def process_document_upload(self, file_name: str, file_content: str, file_type: str) -> dict:
        """
        Process uploaded document and add to document store
        This shows in debug panel so users can see the content
        """
        # Simple document processing for demo
        document = {
            "name": file_name,
            "content": file_content,
            "type": file_type,
            "length": len(file_content),
            "preview": file_content[:500] + "..." if len(file_content) > 500 else file_content
        }
        
        # Add to our simple document store
        self.document_store.append(document)
        
        return {
            "success": True,
            "document_name": file_name,
            "document_type": file_type,
            "content_length": len(file_content),
            "total_documents": len(self.document_store),
            "content_preview": document["preview"]
        }
    
    @debug_track("Searching Document Store")
    async def search_documents(self, query: str) -> list:
        """
        Simple document search (for demo - would use embeddings in real implementation)
        """
        if not self.document_store:
            return []
        
        # Simple keyword search for demo
        results = []
        query_lower = query.lower()
        
        for doc in self.document_store:
            if query_lower in doc['content'].lower():
                # Find the context around the match
                content_lower = doc['content'].lower()
                match_index = content_lower.find(query_lower)
                start = max(0, match_index - 100)
                end = min(len(doc['content']), match_index + 200)
                context = doc['content'][start:end]
                
                results.append({
                    "document": doc['name'],
                    "match_context": f"...{context}...",
                    "relevance_score": content_lower.count(query_lower)
                })
        
        # Sort by relevance (number of matches)
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:3]  # Return top 3 matches