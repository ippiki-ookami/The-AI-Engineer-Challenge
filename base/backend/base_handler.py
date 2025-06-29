"""
Base Chat Handler - Foundation for All Features
All homework features inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional
import json
import asyncio
from fastapi import HTTPException
from openai import OpenAI

from .debug_logger import debug_logger, debug_track


class BaseChatRequest:
    """Base request model that all features can extend"""
    def __init__(self, user_message: str, api_key: str, model: str = "gpt-4.1-mini", **kwargs):
        self.user_message = user_message
        self.api_key = api_key
        self.model = model
        self.extra_data = kwargs  # For feature-specific data


class BaseChatHandler(ABC):
    """
    Base class that all homework features inherit from
    Provides common functionality like debug logging, OpenAI calls, etc.
    """
    
    def __init__(self, feature_name: str):
        self.feature_name = feature_name
        self.debug_logger = debug_logger
        
    def sse_format(self, data: Dict[str, Any]) -> str:
        """Format data for Server-Sent Events"""
        return f"data: {json.dumps(data)}\n\n"
    
    @debug_track("Validating API Key")
    async def validate_api_key(self, api_key: str) -> bool:
        """Common API key validation for all features"""
        if not api_key or not api_key.startswith('sk-'):
            raise HTTPException(status_code=400, detail="Invalid API key format")
        return True
    
    @debug_track("Initializing OpenAI Client")
    async def create_openai_client(self, api_key: str) -> OpenAI:
        """Create OpenAI client with validation"""
        await self.validate_api_key(api_key)
        return OpenAI(api_key=api_key)
    
    async def setup_debug_streaming(self) -> tuple:
        """Set up debug streaming for real-time updates"""
        debug_queue = asyncio.Queue()
        
        def stream_debug_update(log_entry):
            try:
                debug_queue.put_nowait(log_entry)
            except asyncio.QueueFull:
                pass
        
        self.debug_logger.set_status_callback(stream_debug_update)
        return debug_queue, self.drain_debug_queue
    
    async def drain_debug_queue(self, debug_queue) -> AsyncGenerator[str, None]:
        """Helper to stream debug updates from queue"""
        while not debug_queue.empty():
            try:
                log_entry = debug_queue.get_nowait()
                yield self.sse_format({"type": "debug", "data": log_entry})
            except asyncio.QueueEmpty:
                break
    
    @debug_track("Preparing Base Messages")
    async def prepare_base_messages(self, user_message: str, system_prompt: str, message_chain: Optional[list] = None) -> list:
        """Prepare basic message structure that features can extend"""
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add message chain examples if provided (for few-shot prompting)
        if message_chain:
            for chain_msg in message_chain:
                if chain_msg.get('content', '').strip():  # Only add non-empty messages
                    messages.append({
                        "role": chain_msg.get('role', 'user'),
                        "content": chain_msg['content']
                    })
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        return messages
    
    @debug_track("Calling OpenAI API", track_result=False)
    async def call_openai(self, client: OpenAI, messages: list, model: str) -> Any:
        """Standard OpenAI call that all features can use"""
        await asyncio.sleep(0.1)  # Small delay for debug visibility
        return client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
    
    async def stream_response(self, stream) -> AsyncGenerator[tuple[str, str], None]:
        """Stream OpenAI response and return content + full response"""
        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content, full_response
    
    @abstractmethod
    async def get_system_prompt(self) -> str:
        """Each feature must define its system prompt"""
        pass
    
    @abstractmethod
    async def process_user_message(self, request: BaseChatRequest) -> str:
        """Each feature processes the user message differently"""
        pass
    
    @abstractmethod
    async def enhance_messages(self, messages: list, request: BaseChatRequest) -> list:
        """Each feature can enhance messages (add context, etc.)"""
        pass
    
    async def process_chat(self, request: BaseChatRequest) -> AsyncGenerator[str, None]:
        """
        Main chat processing pipeline that all features use
        Features can override specific steps while using the base flow
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
            function_name=f"{self.feature_name.lower()}_chat"
        )
        yield self.sse_format({"type": "debug", "data": self.debug_logger.get_logs()[-1]})
        
        try:
            # Step 1: Create OpenAI client
            client_task = asyncio.create_task(self.create_openai_client(request.api_key))
            while not client_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            client = await client_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 2: Process user message (feature-specific)
            processed_message_task = asyncio.create_task(self.process_user_message(request))
            while not processed_message_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            processed_message = await processed_message_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 3: Prepare messages
            # Use developer_message from request if provided, otherwise use feature's system prompt
            system_prompt = request.extra_data.get('developer_message') or await self.get_system_prompt()
            message_chain = request.extra_data.get('message_chain', [])
            messages_task = asyncio.create_task(self.prepare_base_messages(processed_message, system_prompt, message_chain))
            while not messages_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            messages = await messages_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 4: Enhance messages (feature-specific)
            enhanced_messages_task = asyncio.create_task(self.enhance_messages(messages, request))
            while not enhanced_messages_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            enhanced_messages = await enhanced_messages_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 5: Call OpenAI
            api_task = asyncio.create_task(self.call_openai(client, enhanced_messages, request.model))
            while not api_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            stream = await api_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 6: Stream response
            full_response = ""
            async for content, full in self.stream_response(stream):
                full_response = full
                yield self.sse_format({"type": "chat", "data": content})
            
            # Step 7: Log completion
            self.debug_logger.add_log(
                title=f"{self.feature_name} Processing Complete",
                content_type="clickable",
                data={
                    "full_response": full_response,
                    "response_length": len(full_response),
                    "feature": self.feature_name
                },
                function_name=f"{self.feature_name.lower()}_complete"
            )
            
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
                
        except Exception as e:
            # Log error
            import traceback
            self.debug_logger.add_log(
                title=f"{self.feature_name} Error",
                content_type="clickable",
                data={
                    "error_message": str(e),
                    "error_type": type(e).__name__,
                    "full_traceback": traceback.format_exc(),
                    "feature": self.feature_name
                },
                function_name=f"{self.feature_name.lower()}_error"
            )
            
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            raise