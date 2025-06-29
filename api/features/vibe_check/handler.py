"""
Vibe Check Feature Handler
Basic chat functionality - the foundation for all other features
"""
import asyncio
from typing import AsyncGenerator
from openai import OpenAI

try:
    from ...core.base_handler import BaseChatHandler
    from ...debug_logger import debug_track
except ImportError:
    # Fallback for testing
    import sys
    sys.path.append('../..')
    from core.base_handler import BaseChatHandler
    from debug_logger import debug_track


class VibeCheckHandler(BaseChatHandler):
    """Handler for basic chat functionality"""
    
    @debug_track("Preparing Vibe Check Request")
    async def prepare_request(self, developer_message: str, user_message: str, model: str):
        """Prepare the basic chat request"""
        messages = [
            {"role": "system", "content": developer_message},
            {"role": "user", "content": user_message}
        ]
        
        return {
            "model": model,
            "messages": messages,
            "stream": True
        }
    
    async def process_chat(self, request) -> AsyncGenerator[str, None]:
        """Process basic chat without any special features"""
        debug_queue = asyncio.Queue()
        
        # Set up debug callback
        def stream_debug_update(log_entry):
            try:
                debug_queue.put_nowait(log_entry)
            except asyncio.QueueFull:
                pass
        
        self.debug_logger.set_status_callback(stream_debug_update)
        
        # Log initial message
        self.debug_logger.add_log(
            title="Processing Vibe Check Message",
            content_type="clickable",
            data={"user_message": request.user_message},
            function_name="vibe_check"
        )
        yield self.sse_format({"type": "debug", "data": self.debug_logger.get_logs()[-1]})
        
        # Initialize OpenAI
        client = OpenAI(api_key=request.api_key)
        
        # Prepare request
        task = asyncio.create_task(self.prepare_request(
            request.developer_message,
            request.user_message,
            request.model
        ))
        
        while not task.done():
            async for debug_msg in self.stream_debug_updates(debug_queue):
                yield debug_msg
            await asyncio.sleep(0.01)
        
        api_payload = await task
        async for debug_msg in self.stream_debug_updates(debug_queue):
            yield debug_msg
        
        # Call OpenAI
        @debug_track("Calling OpenAI for Vibe Check", track_result=False)
        async def call_api():
            await asyncio.sleep(0.1)
            return client.chat.completions.create(**api_payload)
        
        call_task = asyncio.create_task(call_api())
        
        while not call_task.done():
            async for debug_msg in self.stream_debug_updates(debug_queue):
                yield debug_msg
            await asyncio.sleep(0.01)
        
        stream = await call_task
        async for debug_msg in self.stream_debug_updates(debug_queue):
            yield debug_msg
        
        # Stream response
        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                full_response += content
                yield self.sse_format({"type": "chat", "data": content})
        
        # Log completion
        self.debug_logger.add_log(
            title="Vibe Check Complete",
            content_type="clickable",
            data={
                "full_response": full_response,
                "response_length": len(full_response)
            },
            function_name="vibe_check"
        )
        
        async for debug_msg in self.stream_debug_updates(debug_queue):
            yield debug_msg