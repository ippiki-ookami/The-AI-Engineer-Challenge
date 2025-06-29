"""
Vibe Check Feature API
FastAPI application for the basic vibe check feature
"""
import sys
from pathlib import Path
from typing import Optional

# Add base directory to path so we can import base modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
import asyncio

from base.backend.base_handler import BaseChatRequest
from .handler import VibeCheckHandler, VibeCheckRequest


# FastAPI app
app = FastAPI(
    title="Vibe Check - LLM Bootcamp",
    description="Basic LLM chat interface with debug panel",
    version="1.0.0"
)

# Initialize handler
handler = VibeCheckHandler()


class ChatRequest(BaseModel):
    developer_message: str
    user_message: str
    model: str
    api_key: str
    feature_id: Optional[str] = "01-vibe-check"


class KeyValidationRequest(BaseModel):
    api_key: str


# Serve static files (frontend)
frontend_path = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")


@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the vibe check frontend"""
    index_path = frontend_path / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text(), status_code=200)
    else:
        raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "feature": "vibe-check", "version": "1.0.0"}


@app.post("/api/validate-key")
async def validate_api_key(request: KeyValidationRequest):
    """Validate OpenAI API key"""
    try:
        await handler.validate_api_key(request.api_key)
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for vibe check feature
    Returns Server-Sent Events stream
    """
    try:
        # Create vibe check request
        vibe_request = VibeCheckRequest(
            user_message=request.user_message,
            api_key=request.api_key,
            model=request.model,
            developer_message=request.developer_message,
            feature_id=request.feature_id
        )
        
        # Process chat using the handler
        return StreamingResponse(
            handler.process_chat(vibe_request),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features")
async def get_features():
    """Get available features for the dropdown"""
    return {
        "current_feature": "01-vibe-check",
        "features": {
            "01-vibe-check": {
                "name": "Vibe Check",
                "description": "Basic LLM chat interface with debug panel",
                "enabled": True
            },
            "02-embeddings-rag": {
                "name": "Embeddings and RAG", 
                "description": "RAG implementation with document upload",
                "enabled": False
            },
            "03-agents": {
                "name": "AI Agents",
                "description": "Multi-agent system with tool usage", 
                "enabled": False
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )