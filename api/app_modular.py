"""
Modular FastAPI app that routes to different homework features
This is an example of how to structure the app for multiple features
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# Import feature handlers
from api.features.vibe_check.handler import VibeCheckHandler
# Future imports:
# from api.features.embeddings_rag.handler import RAGHandler
# from api.features.agents.handler import AgentsHandler

app = FastAPI(title="LLM Bootcamp API - Modular")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize handlers
handlers = {
    "01-vibe-check": VibeCheckHandler(),
    # "02-embeddings-rag": RAGHandler(),
    # "03-agents": AgentsHandler(),
    # "04-fine-tuning": FineTuningHandler(),
    # "05-multimodal": MultimodalHandler(),
}


class ChatRequest(BaseModel):
    user_message: str
    developer_message: str
    api_key: str
    model: str = "gpt-4.1-mini"
    feature_id: str = "01-vibe-check"  # New field for feature selection


@app.get("/health")
async def health_check():
    return {"status": "healthy", "features_enabled": list(handlers.keys())}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint that routes to appropriate feature handler
    """
    # Get the appropriate handler
    handler = handlers.get(request.feature_id)
    if not handler:
        return {"error": f"Feature {request.feature_id} not implemented"}
    
    # Process with feature-specific handler
    return StreamingResponse(
        handler.process_chat(request),
        media_type="text/event-stream"
    )


# Feature-specific endpoints (optional)
@app.post("/api/vibe-check/chat")
async def vibe_check_chat(request: ChatRequest):
    """Direct endpoint for vibe check feature"""
    handler = handlers["01-vibe-check"]
    return StreamingResponse(
        handler.process_chat(request),
        media_type="text/event-stream"
    )


# Future feature-specific endpoints
# @app.post("/api/rag/upload")
# async def upload_document(file: UploadFile):
#     """RAG-specific document upload"""
#     handler = handlers["02-embeddings-rag"]
#     return await handler.upload_document(file)


# @app.post("/api/agents/tools")
# async def list_agent_tools():
#     """Agents-specific tool listing"""
#     handler = handlers["03-agents"]
#     return await handler.list_available_tools()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)