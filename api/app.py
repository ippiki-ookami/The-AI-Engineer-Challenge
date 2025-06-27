# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI, APIStatusError
import os
from typing import Optional, AsyncGenerator
import json

# Import the debug logger
from debug_logger import debug_logger

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: str = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define a Pydantic model for API key validation requests
class ApiKeyRequest(BaseModel):
    api_key: str

# Helper to format Server-Sent Events (SSE)
def sse_format(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

# Define an endpoint to validate the OpenAI API key
@app.post("/api/validate-key")
async def validate_key(request: ApiKeyRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        # Make a lightweight API call to check if the key is valid
        client.models.list()
        # If the call succeeds, the key is valid
        return {"status": "ok"}
    except APIStatusError as e:
        # Handle authentication errors specifically
        if e.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key.")
        # Handle other API errors
        raise HTTPException(status_code=500, detail=f"An API error occurred: {e}")
    except Exception as e:
        # Handle other exceptions (e.g., network issues)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    debug_logger.clear()

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            # Log 1: User sends message
            parent_id = debug_logger.add_log(
                title="User sends message",
                content_type="clickable",
                data={"user_message": request.user_message}
            )
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})

            # Initialize OpenAI client
            client = OpenAI(api_key=request.api_key)

            # Log 2: Prepare API Request
            api_payload = {
                "model": request.model,
                "messages": [
                    {"role": "system", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                "stream": True
            }
            debug_logger.add_log(
                title="Preparing API Request",
                content_type="clickable",
                data=api_payload,
                parent_id=parent_id
            )
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})

            # Log 3: Send to API
            debug_logger.add_log(title="Sending to OpenAI API...", status="pending", parent_id=parent_id)
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})

            # Create the stream
            stream = client.chat.completions.create(**api_payload)
            
            # Log 4: Receiving from API
            debug_logger.logs[-1]["status"] = "success"
            debug_logger.logs[-1]["title"] = "Sent to OpenAI API"
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})
            
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    # Stream chat content
                    yield sse_format({"type": "chat", "data": content})
            
            # Log 5: Message parsed
            debug_logger.add_log(
                title="Final message parsed",
                content_type="clickable",
                data={"full_response": full_response},
                parent_id=parent_id
            )
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})

        except Exception as e:
            error_message = f"An unexpected error occurred: {e}"
            debug_logger.add_log(title="Error", status="error", data=error_message)
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})
            # Also send an error for the chat
            yield sse_format({"type": "error", "data": str(e)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
