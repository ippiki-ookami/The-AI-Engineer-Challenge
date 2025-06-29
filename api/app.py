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
import asyncio
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import the debug logger
try:
    from .debug_logger import debug_logger, debug_track
except ImportError:
    # Fallback for when running directly
    from debug_logger import debug_logger, debug_track

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
    feature_id: Optional[str] = "01-vibe-check"  # Feature selection for homework modules

# Define a Pydantic model for API key validation requests
class ApiKeyRequest(BaseModel):
    api_key: str

# Helper to format Server-Sent Events (SSE)
def sse_format(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

# Helper functions with debug tracking
@debug_track("Preparing OpenAI API Request")
async def prepare_api_request(developer_message: str, user_message: str, model: str):
    """Prepare the API request payload for OpenAI"""
    # Small delay to ensure pending status is visible
    await asyncio.sleep(0.1)
    
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": developer_message},
            {"role": "user", "content": user_message}
        ],
        "stream": True
    }

@debug_track("Calling OpenAI API", track_result=False)
async def call_openai_api(client, api_payload):
    """Make the actual API call to OpenAI"""
    # Small delay to ensure pending status is visible
    await asyncio.sleep(0.1)
    
    return client.chat.completions.create(**api_payload)

@debug_track("Testing Yellow Status (3 Second Wait)")
async def test_yellow_status():
    """Test function that waits 3 seconds to show yellow status"""
    await asyncio.sleep(3.0)
    return {"test": "Yellow status should be visible for 3 seconds"}

@debug_track("Test Optional Data Source 1", optional=True)
async def test_optional_data_source_1():
    """Test function that always fails but is marked as optional"""
    await asyncio.sleep(0.5)
    raise Exception("Data source 1 is temporarily unavailable")

@debug_track("Test Optional Data Source 2", optional=True) 
async def test_optional_data_source_2():
    """Test function that succeeds and is marked as optional"""
    await asyncio.sleep(0.3)
    return {"data": "Successfully retrieved data from source 2"}

@debug_track("Test Critical Function")
async def test_critical_function():
    """Test function that would stop pipeline if it failed (not optional)"""
    await asyncio.sleep(0.2)
    return {"status": "Critical function completed successfully"}

@debug_track("Processing Response Stream")
async def process_response_stream(stream):
    """Process the streaming response from OpenAI"""
    # Small delay to ensure pending status is visible
    await asyncio.sleep(0.1)
    
    full_response = ""
    chunk_count = 0
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            content = chunk.choices[0].delta.content
            full_response += content
            chunk_count += 1
    
    return {
        "full_response": full_response,
        "chunk_count": chunk_count,
        "response_length": len(full_response)
    }

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
            # Create a queue for streaming debug updates in real-time
            debug_queue = asyncio.Queue()
            
            # Set up streaming callback to immediately send debug updates
            def stream_debug_update(log_entry):
                try:
                    debug_queue.put_nowait(log_entry)
                except asyncio.QueueFull:
                    pass  # Skip if queue is full
            
            debug_logger.set_status_callback(stream_debug_update)
            
            # Log initial user message
            debug_logger.add_log(
                title="Processing User Message",
                content_type="clickable",
                data={"user_message": request.user_message},
                function_name="chat_endpoint"
            )
            yield sse_format({"type": "debug", "data": debug_logger.get_logs()[-1]})

            # Initialize OpenAI client
            client = OpenAI(api_key=request.api_key)

            # Helper function to drain debug queue
            async def drain_debug_queue():
                while not debug_queue.empty():
                    try:
                        log_entry = debug_queue.get_nowait()
                        yield sse_format({"type": "debug", "data": log_entry})
                    except asyncio.QueueEmpty:
                        break

            # Test yellow status with 3-second delay
            test_task = asyncio.create_task(test_yellow_status())
            
            # Stream debug updates as they come in during the test
            while not test_task.done():
                async for debug_msg in drain_debug_queue():
                    yield debug_msg
                await asyncio.sleep(0.01)  # Small delay to prevent busy waiting
            
            # Wait for test to complete and get any remaining debug updates
            await test_task
            async for debug_msg in drain_debug_queue():
                yield debug_msg

            # Test optional failure scenario - simulating gathering data from multiple sources
            data_sources = []
            
            # Try to gather data from multiple sources (some may fail)
            source1_task = asyncio.create_task(test_optional_data_source_1())  # This will fail
            source2_task = asyncio.create_task(test_optional_data_source_2())  # This will succeed
            
            # Stream updates for both data source attempts
            tasks = [source1_task, source2_task]
            while any(not task.done() for task in tasks):
                async for debug_msg in drain_debug_queue():
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            # Collect results (None for failed optional functions)
            source1_result = await source1_task  # Will be None due to failure
            source2_result = await source2_task  # Will contain data
            
            # Add successful data to our collection
            if source1_result is not None:
                data_sources.append(source1_result)
            if source2_result is not None:
                data_sources.append(source2_result)
            
            async for debug_msg in drain_debug_queue():
                yield debug_msg
            
            # Continue with critical function (this would stop pipeline if it failed)
            critical_task = asyncio.create_task(test_critical_function())
            
            while not critical_task.done():
                async for debug_msg in drain_debug_queue():
                    yield debug_msg
                await asyncio.sleep(0.01)
                
            critical_result = await critical_task
            async for debug_msg in drain_debug_queue():
                yield debug_msg

            # Use decorated functions - they will automatically update debug logs
            api_task = asyncio.create_task(prepare_api_request(
                request.developer_message, 
                request.user_message, 
                request.model
            ))
            
            # Stream debug updates as they come in during API preparation
            while not api_task.done():
                async for debug_msg in drain_debug_queue():
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            api_payload = await api_task
            async for debug_msg in drain_debug_queue():
                yield debug_msg

            # Call OpenAI API
            call_task = asyncio.create_task(call_openai_api(client, api_payload))
            
            # Stream debug updates as they come in during API call
            while not call_task.done():
                async for debug_msg in drain_debug_queue():
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            stream = await call_task
            async for debug_msg in drain_debug_queue():
                yield debug_msg
            
            # Stream the actual chat response
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    # Stream chat content
                    yield sse_format({"type": "chat", "data": content})
            
            # Log the final response processing
            debug_logger.add_log(
                title="Response Processing Complete",
                content_type="clickable",
                data={
                    "full_response": full_response,
                    "response_length": len(full_response)
                },
                function_name="chat_endpoint"
            )
            
            # Stream final debug updates
            async for debug_msg in drain_debug_queue():
                yield debug_msg

        except Exception as e:
            import traceback
            error_data = {
                "error_message": str(e),
                "error_type": type(e).__name__,
                "full_traceback": traceback.format_exc(),
                "context": "Main chat endpoint processing"
            }
            debug_logger.add_log(
                title="Error in Chat Processing", 
                status="error", 
                content_type="clickable",  # Make main errors clickable too
                data=error_data,
                function_name="chat_endpoint"
            )
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

# Serve the frontend
# This must be after all API routes
# It serves files from the 'frontend' directory, which is one level up
static_files_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app.mount("/", StaticFiles(directory=static_files_dir, html=True), name="static")
