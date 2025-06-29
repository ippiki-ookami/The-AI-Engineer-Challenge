"""
Unified LLM Bootcamp App
Routes requests to isolated homework feature handlers
"""
import sys
import os
from pathlib import Path
from typing import Optional, Dict, Any
import importlib.util

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, HTTPException, Request, File, UploadFile, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel
import asyncio
import traceback


# Request models
class ChatRequest(BaseModel):
    developer_message: str
    user_message: str
    model: str
    api_key: str
    feature_id: Optional[str] = "01-vibe-check"


class KeyValidationRequest(BaseModel):
    api_key: str


class DocumentSearchRequest(BaseModel):
    query: str


# FastAPI app
app = FastAPI(
    title="LLM Bootcamp - All Homework",
    description="Unified platform for all homework assignments with seamless feature switching",
    version="1.0.0"
)

# Available homework features
HOMEWORK_FEATURES = {
    "01-vibe-check": {
        "name": "Vibe Check",
        "path": "features/01-vibe-check/backend",
        "handler_class": "VibeCheckHandler",
        "enabled": True
    },
    "02-embeddings-rag": {
        "name": "Embeddings and RAG", 
        "path": "features/02-embeddings-rag/backend",
        "handler_class": "RAGHandler",
        "enabled": True
    },
    "03-agents": {
        "name": "AI Agents",
        "path": "features/03-agents/backend", 
        "handler_class": "AgentHandler",
        "enabled": False
    },
    "04-fine-tuning": {
        "name": "Fine Tuning",
        "path": "features/04-fine-tuning/backend",
        "handler_class": "FineTuningHandler", 
        "enabled": False
    },
    "05-multimodal": {
        "name": "Multimodal LLMs",
        "path": "features/05-multimodal/backend",
        "handler_class": "MultimodalHandler",
        "enabled": False
    }
}

# Cache for loaded handlers (to avoid reimporting)
_handler_cache: Dict[str, Any] = {}


def load_homework_handler(feature_id: str):
    """
    Dynamically load a homework feature handler
    This ensures complete isolation - each homework's code is only loaded when needed
    """
    if feature_id in _handler_cache:
        return _handler_cache[feature_id]
    
    if feature_id not in HOMEWORK_FEATURES:
        raise HTTPException(status_code=404, detail=f"Homework feature '{feature_id}' not found")
    
    feature_info = HOMEWORK_FEATURES[feature_id]
    
    if not feature_info["enabled"]:
        raise HTTPException(
            status_code=501, 
            detail=f"Homework '{feature_info['name']}' is not yet implemented"
        )
    
    # Build path to handler module
    handler_path = project_root / feature_info["path"] / "handler.py"
    
    if not handler_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Handler not found for homework '{feature_id}' at {handler_path}"
        )
    
    try:
        # Dynamically import the handler module
        # This keeps each homework's code completely isolated
        spec = importlib.util.spec_from_file_location(
            f"{feature_id}_handler", 
            handler_path
        )
        handler_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(handler_module)
        
        # Get the handler class
        handler_class = getattr(handler_module, feature_info["handler_class"])
        
        # Instantiate and cache
        handler_instance = handler_class()
        _handler_cache[feature_id] = handler_instance
        
        return handler_instance
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load homework '{feature_id}': {str(e)}\n{traceback.format_exc()}"
        )


# Serve the unified frontend
frontend_path = project_root / "frontend"

@app.get("/", response_class=HTMLResponse)
async def serve_homework_platform():
    """Serve the unified homework platform frontend"""
    # Use the dedicated unified frontend
    unified_path = frontend_path / "unified.html"
    if unified_path.exists():
        return HTMLResponse(content=unified_path.read_text(), status_code=200)
    else:
        # Fallback: create a simple homework selector
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>LLM Bootcamp - Homework Platform</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .homework-card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
                .enabled { background: #f0f9ff; }
                .disabled { background: #f9f9f9; opacity: 0.6; }
            </style>
        </head>
        <body>
            <h1>🎓 LLM Bootcamp - Homework Platform</h1>
            <p>Welcome! Select a homework assignment to get started:</p>
            
            <div class="homework-card enabled">
                <h3>✅ 01 - Vibe Check</h3>
                <p>Basic LLM chat interface with debug panel</p>
                <a href="/features/01-vibe-check/">Start Homework 01 →</a>
            </div>
            
            <div class="homework-card disabled">
                <h3>🚧 02 - Embeddings and RAG</h3>
                <p>Document upload and retrieval-augmented generation</p>
                <p><em>Coming soon...</em></p>
            </div>
            
            <div class="homework-card disabled">
                <h3>🚧 03 - AI Agents</h3>
                <p>Multi-agent systems with tool usage</p>
                <p><em>Coming soon...</em></p>
            </div>
        </body>
        </html>
        """, status_code=200)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "platform": "LLM Bootcamp Unified",
        "available_homework": [
            f"{fid} ({info['name']})" 
            for fid, info in HOMEWORK_FEATURES.items() 
            if info["enabled"]
        ]
    }


@app.get("/api/homework")
async def get_homework_features():
    """Get all available homework features for the dropdown"""
    return {
        "homework": {
            fid: {
                "name": info["name"],
                "enabled": info["enabled"]
            }
            for fid, info in HOMEWORK_FEATURES.items()
        }
    }


@app.post("/api/validate-key")
async def validate_api_key(request: KeyValidationRequest):
    """
    Validate OpenAI API key using OpenAI library directly
    """
    try:
        # Import OpenAI directly for validation
        from openai import OpenAI
        
        # Basic format validation
        if not request.api_key or not request.api_key.startswith('sk-'):
            raise HTTPException(status_code=400, detail="Invalid API key format")
        
        # Test the API key by making a simple request
        client = OpenAI(api_key=request.api_key)
        
        # Make a minimal request to validate the key
        try:
            # List models to verify the key works
            models = client.models.list()
            if models:
                return {"valid": True, "message": "API key is valid"}
            else:
                raise HTTPException(status_code=400, detail="API key validation failed")
        except Exception as openai_error:
            if "authentication" in str(openai_error).lower() or "api_key" in str(openai_error).lower():
                raise HTTPException(status_code=400, detail="Invalid API key")
            else:
                raise HTTPException(status_code=400, detail=f"API validation error: {str(openai_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


@app.post("/api/chat")
async def homework_chat(request: ChatRequest):
    """
    Main chat endpoint that routes to specific homework handlers
    Each homework's code is completely isolated and only loaded when needed
    """
    try:
        # Load the specific homework handler (isolated code)
        handler = load_homework_handler(request.feature_id)
        
        # Import the base request class directly
        from base.backend.base_handler import BaseChatRequest
        
        # Create homework-specific request object
        homework_request = BaseChatRequest(
            user_message=request.user_message,
            api_key=request.api_key,
            model=request.model,
            # Pass additional data as kwargs
            developer_message=request.developer_message,
            feature_id=request.feature_id
        )
        
        # Process using the isolated homework handler
        return StreamingResponse(
            handler.process_chat(homework_request),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive", 
                "Content-Type": "text/event-stream",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing homework '{request.feature_id}': {str(e)}"
        )


@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    feature_id: Optional[str] = Header(default="02-embeddings-rag", alias="Feature-ID")
):
    """
    Upload and process document for RAG feature
    Shows document processing in debug panel
    """
    try:
        # Only allow for RAG feature
        if feature_id != "02-embeddings-rag":
            raise HTTPException(
                status_code=400, 
                detail="Document upload only available for Embeddings and RAG homework"
            )

        # Validate file type
        allowed_types = {
            'text/plain': 'txt',
            'application/pdf': 'pdf', 
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Supported: PDF, Word, TXT"
            )

        # Read file content
        content = await file.read()
        
        # For demo, we'll only handle text files properly
        # PDF and Word would need additional libraries (PyPDF2, python-docx)
        if file.content_type == 'text/plain':
            try:
                file_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    file_content = content.decode('latin-1')
                except UnicodeDecodeError:
                    raise HTTPException(status_code=400, detail="Could not decode text file")
        else:
            # For PDF/Word files in demo, just show metadata
            file_content = f"[{allowed_types[file.content_type].upper()} File: {file.filename}]\n"
            file_content += f"Size: {len(content)} bytes\n"
            file_content += f"Content-Type: {file.content_type}\n\n"
            file_content += "Note: Full PDF/Word processing would require additional libraries.\n"
            file_content += "This is a demo showing the upload workflow."

        # Load RAG handler to process the document
        handler = load_homework_handler(feature_id)
        
        # Process the document (this will show in debug panel)
        result = await handler.process_document_upload(
            file_name=file.filename,
            file_content=file_content,
            file_type=allowed_types[file.content_type]
        )
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")


@app.post("/api/search-documents")
async def search_documents(
    request: DocumentSearchRequest,
    feature_id: Optional[str] = Header(default="02-embeddings-rag", alias="Feature-ID")
):
    """
    Search uploaded documents
    Shows search process in debug panel
    """
    try:
        # Only allow for RAG feature
        if feature_id != "02-embeddings-rag":
            raise HTTPException(
                status_code=400,
                detail="Document search only available for Embeddings and RAG homework"
            )

        # Load RAG handler to search documents
        handler = load_homework_handler(feature_id)
        
        # Search documents (this will show in debug panel)
        results = await handler.search_documents(request.query)
        
        return JSONResponse(content=results)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document search failed: {str(e)}")


# Mount static file directories for complete homework isolation
# Each homework can serve its own static files

# Mount base static files (shared across all homework) - FIRST for priority
app.mount("/base", StaticFiles(directory=str(project_root / "base")), name="base")

# Mount individual homework static files (isolated per homework)
for feature_id, info in HOMEWORK_FEATURES.items():
    if info["enabled"]:
        feature_frontend_path = project_root / info["path"].replace("/backend", "/frontend")
        if feature_frontend_path.exists():
            app.mount(
                f"/features/{feature_id}", 
                StaticFiles(directory=str(feature_frontend_path)), 
                name=f"homework_{feature_id}"
            )

# Mount main frontend (for unified interface) - LAST so it doesn't override
if frontend_path.exists():
    app.mount("/frontend", StaticFiles(directory=str(frontend_path)), name="frontend_files")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "homework_app:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )