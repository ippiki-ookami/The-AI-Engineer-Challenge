"""
Embeddings and RAG Handler - Exact implementation matching homework template
Uses the real aimakerspace modules from the assignment
"""
import asyncio
from pathlib import Path
from typing import List, Dict, Tuple, Optional

# Add base directory to path so we can import base modules
# sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from base_handler import BaseChatHandler, BaseChatRequest
from debug_logger import debug_track

# Import the REAL aimakerspace modules from homework template
from aimakerspace.text_utils import TextFileLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.openai_utils.chatmodel import ChatOpenAI
from aimakerspace.openai_utils.prompts import SystemRolePrompt, UserRolePrompt


# Exact RAG Pipeline from homework template
class RetrievalAugmentedQAPipeline:
    def __init__(self, llm: ChatOpenAI, vector_db_retriever: VectorDatabase, 
                 response_style: str = "detailed", include_scores: bool = False) -> None:
        self.llm = llm
        self.vector_db_retriever = vector_db_retriever
        self.response_style = response_style
        self.include_scores = include_scores

    def run_pipeline(self, user_query: str, k: int = 4, **system_kwargs) -> dict:
        # Retrieve relevant contexts
        context_list = self.vector_db_retriever.search_by_text(user_query, k=k)
        
        context_prompt = ""
        similarity_scores = []
        
        for i, (context, score) in enumerate(context_list, 1):
            context_prompt += f"[Source {i}]: {context}\n\n"
            similarity_scores.append(f"Source {i}: {score:.3f}")
        
        # Create system message with parameters
        system_params = {
            "response_style": self.response_style,
            "response_length": system_kwargs.get("response_length", "detailed")
        }
        
        formatted_system_prompt = rag_system_prompt.create_message(**system_params)
        
        user_params = {
            "user_query": user_query,
            "context": context_prompt.strip(),
            "context_count": len(context_list),
            "similarity_scores": f"Relevance scores: {', '.join(similarity_scores)}" if self.include_scores else ""
        }
        
        formatted_user_prompt = rag_user_prompt.create_message(**user_params)

        return {
            "response": self.llm.run([formatted_system_prompt, formatted_user_prompt]), 
            "context": context_list,
            "context_count": len(context_list),
            "similarity_scores": similarity_scores if self.include_scores else None,
            "prompts_used": {
                "system": formatted_system_prompt,
                "user": formatted_user_prompt
            }
        }


# Exact prompts from homework template
RAG_SYSTEM_TEMPLATE = """You are a knowledgeable assistant that answers questions based strictly on provided context.

Instructions:
- Only answer questions using information from the provided context
- If the context doesn't contain relevant information, respond with "I don't know"
- Be accurate and cite specific parts of the context when possible
- Keep responses {response_style} and {response_length}
- Only use the provided context. Do not use external knowledge.
- Only provide answers when you are confident the context supports your response."""

RAG_USER_TEMPLATE = """Context Information:
{context}

Number of relevant sources found: {context_count}
{similarity_scores}

Question: {user_query}

Please provide your answer based solely on the context above."""

rag_system_prompt = SystemRolePrompt(
    RAG_SYSTEM_TEMPLATE,
    strict=True,
    defaults={
        "response_style": "concise",
        "response_length": "brief"
    }
)

rag_user_prompt = UserRolePrompt(
    RAG_USER_TEMPLATE,
    strict=True,
    defaults={
        "context_count": "",
        "similarity_scores": ""
    }
)


class RAGRequest(BaseChatRequest):
    """Request model specific to RAG feature"""
    
    def __init__(self, user_message: str, api_key: str, model: str = "gpt-4o-mini", **kwargs):
        super().__init__(user_message, api_key, model, **kwargs)
        # RAG-specific fields
        self.uploaded_documents = kwargs.get('uploaded_documents', [])
        self.search_query = kwargs.get('search_query', '')


class RAGHandler(BaseChatHandler):
    """
    RAG (Retrieval-Augmented Generation) chat handler
    Complete implementation using aimakerspace utilities from homework template
    """
    
    def __init__(self):
        super().__init__("Embeddings and RAG")
        
        # Initialize all components following homework template
        self.document_store = []  # Store document metadata
        self.document_texts = []  # Store all document texts for processing
        
        # Configuration with defaults (can be overridden by frontend config)
        self.config = {
            'chunk_size': 1000,
            'chunk_overlap': 200,
            'embedding_model': 'text-embedding-3-small',
            'rag_model': 'gpt-4o-mini',
            'temperature': 0.1,
            'search_k': 5,
            'rag_k': 4,
            'response_style': 'detailed',
            'include_scores': True
        }
        
        # Initialize components exactly like homework template
        # These will be set up when we have an API key
        self.text_splitter = None
        self.embedding_model = None
        self.vector_db = None
        self.chat_openai = None
        self.rag_pipeline = None
    
    @debug_track("Getting RAG System Prompt")
    async def get_system_prompt(self) -> str:
        """Return the exact system prompt from homework template"""
        return """You are a knowledgeable assistant that answers questions based strictly on provided context.

Instructions:
- Only answer questions using information from the provided context
- If the context doesn't contain relevant information, respond with "I don't know"
- Be accurate and cite specific parts of the context when possible
- Keep responses detailed and comprehensive
- Only use the provided context. Do not use external knowledge.
- Only provide answers when you are confident the context supports your response."""
    
    @debug_track("Processing Document Upload with Full RAG Pipeline")
    async def process_document_upload(self, file_name: str, file_content: str, file_type: str, api_key: str) -> dict:
        """
        Process uploaded document using the exact homework template pattern
        """
        # Initialize components with API key (like in homework template)
        await self._initialize_components_with_api_key(api_key)
        
        # Create document metadata
        document = {
            "name": file_name,
            "content": file_content,
            "type": file_type,
            "length": len(file_content),
            "preview": file_content[:self.config.get('preview_length', 500)] + "..." if len(file_content) > self.config.get('preview_length', 500) else file_content
        }
        
        # Add to document store
        self.document_store.append(document)
        self.document_texts.append(file_content)
        
        # Split all documents into chunks (homework template pattern)
        split_documents = await self._split_all_documents()
        
        # Build vector database exactly like homework template
        await self._build_vector_database_homework_style(split_documents)
        
        # Initialize RAG pipeline exactly like homework template
        await self._initialize_rag_pipeline_homework_style()
        
        return {
            "success": True,
            "document_name": file_name,
            "document_type": file_type,
            "content_length": len(file_content),
            "chunks_created": len(split_documents),
            "total_documents": len(self.document_store),
            "total_chunks_in_db": len(self.vector_db.vectors) if self.vector_db else 0,
            "content_preview": document["preview"],
            "vector_db_ready": self.rag_pipeline is not None
        }
    
    @debug_track("Initializing Components with API Key")
    async def _initialize_components_with_api_key(self, api_key: str):
        """Initialize all components with API key like homework template"""
        # Set API key in environment (homework template pattern)
        import os
        os.environ["OPENAI_API_KEY"] = api_key
        
        # Initialize components exactly like homework template
        self.text_splitter = CharacterTextSplitter(
            chunk_size=self.config['chunk_size'],
            chunk_overlap=self.config['chunk_overlap']
        )
        self.embedding_model = EmbeddingModel(self.config['embedding_model'])
        self.vector_db = VectorDatabase(self.embedding_model)
        self.chat_openai = ChatOpenAI(self.config['rag_model'])
    
    @debug_track("Splitting All Documents into Chunks")
    async def _split_all_documents(self) -> List[str]:
        """Split all documents exactly like homework template"""
        if not self.document_texts or not self.text_splitter:
            return []
        
        # Split all documents exactly like homework template
        split_documents = self.text_splitter.split_texts(self.document_texts)
        
        return split_documents
    
    @debug_track("Building Vector Database from Documents (Homework Template)")
    async def _build_vector_database_homework_style(self, split_documents: List[str]):
        """Build vector database exactly like homework template"""
        if not split_documents or not self.vector_db:
            return
        
        # Build vector database exactly like homework template
        # vector_db = asyncio.run(vector_db.abuild_from_list(split_documents))
        self.vector_db = await self.vector_db.abuild_from_list(split_documents)
    
    @debug_track("Initializing RAG Pipeline (Homework Template)")
    async def _initialize_rag_pipeline_homework_style(self):
        """Initialize RAG pipeline exactly like homework template"""
        if not self.vector_db or len(self.vector_db.vectors) == 0:
            self.rag_pipeline = None
            return
        
        # Initialize RAG pipeline exactly like homework template
        self.rag_pipeline = RetrievalAugmentedQAPipeline(
            llm=self.chat_openai,
            vector_db_retriever=self.vector_db,
            response_style=self.config['response_style'],
            include_scores=self.config['include_scores']
        )
    
    @debug_track("Semantic Search with Vector Database (Homework Template)")
    async def search_documents(self, query: str, api_key: str, k: int = None) -> list:
        """
        Search documents exactly like homework template
        """
        if not self.vector_db or len(self.vector_db.vectors) == 0:
            return []
        
        # Ensure components are initialized
        if not self.embedding_model:
            await self._initialize_components_with_api_key(api_key)
        
        k = k or self.config['search_k']
        
        # Use vector database search exactly like homework template
        search_results = self.vector_db.search_by_text(query, k=k)
        
        # Format results for display
        results = []
        for i, (text, similarity) in enumerate(search_results, 1):
            snippet_length = self.config.get('snippet_length', 200)
            results.append({
                "rank": i,
                "text_snippet": text[:snippet_length] + "..." if len(text) > snippet_length else text,
                "similarity_score": float(similarity),
                "full_text": text
            })
        
        return results
    
    @debug_track("Running Complete RAG Pipeline (Homework Template)")
    async def run_rag_pipeline(self, user_query: str, api_key: str, k: int = None) -> dict:
        """
        Run the complete RAG pipeline exactly like homework template
        """
        if not self.rag_pipeline:
            return {
                "response": "No documents have been uploaded yet. Please upload some documents first to enable RAG functionality.",
                "context": [],
                "context_count": 0,
                "similarity_scores": None,
                "rag_pipeline_ready": False
            }
        
        # Ensure components are initialized
        if not self.embedding_model:
            await self._initialize_components_with_api_key(api_key)
        
        k = k or self.config['rag_k']
        
        # Run pipeline exactly like homework template
        result = self.rag_pipeline.run_pipeline(
            user_query=user_query,
            k=k,
            response_length=self.config.get('response_length', 'detailed')
        )
        
        # Add our metadata exactly like homework template output
        result.update({
            "rag_pipeline_ready": True,
            "config_used": {
                "k": k,
                "response_style": self.config['response_style'],
                "include_scores": self.config['include_scores']
            }
        })
        
        return result
    
    @debug_track("Processing RAG User Message with Full Pipeline (Homework Template)")
    async def process_user_message(self, request: BaseChatRequest) -> str:
        """
        Process user message using homework template RAG pipeline
        """
        message = request.user_message.strip()
        
        # If we have documents and RAG pipeline is ready, use it exactly like homework template
        if self.rag_pipeline:
            rag_result = await self.run_rag_pipeline(message, request.api_key)
            return rag_result["response"]
        
        # If documents exist but pipeline not ready
        if self.document_store:
            context_note = f"\\n\\n[Available documents: {', '.join([doc['name'] for doc in self.document_store])}]"
            context_note += "\\n[Note: Documents are being processed. Please wait a moment and try again.]"
            return f"{message}{context_note}"
        
        # No documents available
        enhanced_message = f"{message}\\n\\n[Note: No documents uploaded yet. Upload documents to enable RAG functionality.]"
        return enhanced_message
    
    @debug_track("Enhancing Messages with RAG Context")
    async def enhance_messages(self, messages: list, request: BaseChatRequest) -> list:
        """
        Enhance messages with RAG context when documents are available
        """
        # If we have the RAG pipeline ready, add relevant context
        if self.rag_pipeline and messages:
            # Get the user message (last message)
            user_message = messages[-1]['content'] if messages else ""
            
            # Search for relevant context using vector database
            search_results = await self.search_documents(user_message, request.api_key, k=3)
            
            if search_results:
                # Add context to system message
                context_snippets = []
                for result in search_results:
                    snippet = result['text_snippet']
                    score = result['similarity_score']
                    context_snippets.append(f"• {snippet} (relevance: {score:.3f})")
                
                context_content = f"""Relevant document context found:
{chr(10).join(context_snippets)}

Use this context to provide more accurate and informed responses."""
                
                context_message = {
                    "role": "system",
                    "content": context_content
                }
                
                # Insert context before the user message
                messages.insert(-1, context_message)
        
        elif self.document_store:
            # Documents exist but pipeline not ready yet
            doc_list = ", ".join([doc['name'] for doc in self.document_store])
            context_message = {
                "role": "system", 
                "content": f"Documents available: {doc_list}. Documents are being processed for semantic search."
            }
            messages.insert(-1, context_message)
        
        return messages
    
    @debug_track("Updating RAG Configuration")
    async def update_configuration(self, new_config: dict) -> dict:
        """
        Update RAG configuration and reinitialize components as needed
        """
        old_config = self.config.copy()
        self.config.update(new_config)
        
        # Check if we need to rebuild vector database
        rebuild_needed = (
            old_config.get('chunk_size') != self.config['chunk_size'] or
            old_config.get('chunk_overlap') != self.config['chunk_overlap'] or
            old_config.get('embedding_model') != self.config['embedding_model']
        )
        
        # Check if we need to reinitialize pipeline
        pipeline_update_needed = (
            old_config.get('rag_model') != self.config['rag_model'] or
            old_config.get('response_style') != self.config['response_style'] or
            old_config.get('include_scores') != self.config['include_scores']
        )
        
        changes_applied = []
        
        if rebuild_needed and self.document_texts:
            # Rebuild vector database with new settings
            split_documents = await self._split_all_documents()
            # Note: Would need API key to rebuild - this is a limitation
            changes_applied.append("Document processing settings updated (rebuild required)")
        
        if pipeline_update_needed:
            # Update pipeline components
            self.chat_openai = ChatOpenAI(self.config['rag_model'])
            if self.rag_pipeline:
                await self._initialize_rag_pipeline()
            changes_applied.append("RAG pipeline settings updated")
        
        return {
            "success": True,
            "changes_applied": changes_applied,
            "current_config": self.config,
            "rebuild_needed": rebuild_needed and bool(self.document_texts)
        }
    
    async def process_chat(self, request: BaseChatRequest):
        """
        Override the base process_chat to use RAG pipeline directly when available
        This follows the homework template approach exactly
        """
        # Clear previous debug logs
        self.debug_logger.clear()
        
        # Set up debug streaming
        debug_queue, drain_fn = await self.setup_debug_streaming()
        
        # Log initial message
        self.debug_logger.add_log(
            title=f"Processing {self.feature_name} Message",
            content_type="clickable",
            data={"user_message": request.user_message},
            function_name=f"{self.feature_name.lower().replace(' ', '_')}_chat"
        )
        yield self.sse_format({"type": "debug", "data": self.debug_logger.get_logs()[-1]})
        
        try:
            # If we have RAG pipeline, use it directly (homework template approach)
            if self.rag_pipeline:
                # Run the complete RAG pipeline exactly like homework template
                rag_task = asyncio.create_task(self.run_rag_pipeline(request.user_message, request.api_key))
                
                # Stream debug updates while RAG pipeline runs
                while not rag_task.done():
                    async for debug_msg in drain_fn(debug_queue):
                        yield debug_msg
                    await asyncio.sleep(0.01)
                
                rag_result = await rag_task
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                
                # Stream the RAG response directly
                yield self.sse_format({"type": "content", "data": rag_result["response"]})
                
                # Log completion
                self.debug_logger.add_log(
                    title=f"{self.feature_name} Processing Complete",
                    content_type="clickable", 
                    data={"rag_result": "RAG pipeline completed successfully"},
                    function_name=f"{self.feature_name.lower().replace(' ', '_')}_complete"
                )
                yield self.sse_format({"type": "debug", "data": self.debug_logger.get_logs()[-1]})
                return
            
            # Otherwise, fall back to normal base handler flow
            async for chunk in super().process_chat(request):
                yield chunk
                
        except Exception as e:
            # Error handling
            self.debug_logger.add_log(
                title=f"{self.feature_name} Error",
                content_type="clickable",
                data={
                    "error_message": str(e),
                    "error_type": type(e).__name__,
                    "full_traceback": str(e),
                    "feature": self.feature_name
                },
                function_name=f"{self.feature_name.lower().replace(' ', '_')}_error"
            )
            yield self.sse_format({"type": "debug", "data": self.debug_logger.get_logs()[-1]})
            yield self.sse_format({"type": "error", "data": {"message": str(e)}})