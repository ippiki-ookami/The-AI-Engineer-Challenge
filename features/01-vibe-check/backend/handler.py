"""
Vibe Check Handler - Basic chat functionality
Inherits from BaseChatHandler and implements simple chat processing
"""
from base_handler import BaseChatHandler, BaseChatRequest
from debug_logger import debug_track


class VibeCheckRequest(BaseChatRequest):
    """Request model specific to vibe check feature"""
    
    def __init__(self, user_message: str, api_key: str, model: str = "gpt-4.1-mini", **kwargs):
        super().__init__(user_message, api_key, model, **kwargs)
        # Vibe check doesn't need additional fields, but this shows extensibility
        self.vibe_level = kwargs.get('vibe_level', 'excellent')


class VibeCheckHandler(BaseChatHandler):
    """
    Vibe Check chat handler - the simplest implementation
    Demonstrates basic LLM processing with debug tracking
    """
    
    def __init__(self):
        super().__init__("Vibe Check")
    
    @debug_track("Getting System Prompt")
    async def get_system_prompt(self) -> str:
        """Return the system prompt for vibe check"""
        return """You are a helpful AI assistant for an LLM bootcamp. 

Your personality:
- Friendly and encouraging 
- Educational and clear in explanations
- Enthusiastic about teaching LLM concepts
- Use emojis sparingly but effectively

Your role:
- Help students learn about RAG, prompt engineering, and LLM techniques
- Provide practical examples and clear explanations
- Encourage experimentation and learning
- Be supportive of beginners while being informative

When users say "vibe check", respond with enthusiasm about their learning journey.
"""
    
    @debug_track("Processing User Message")
    async def process_user_message(self, request: BaseChatRequest) -> str:
        """
        Process user message for vibe check feature
        For vibe check, we just pass through the message with some basic processing
        """
        message = request.user_message.strip()
        
        # Add some vibe check specific processing
        if "vibe check" in message.lower():
            # Add some extra context for vibe check requests (but don't change the visible message)
            enhanced_message = f"{message}\n\n(This is a vibe check request - respond with enthusiasm about the user's learning journey!)"
            return enhanced_message
        
        # For regular messages, just return as-is
        return message
    
    @debug_track("Enhancing Messages")
    async def enhance_messages(self, messages: list, request: BaseChatRequest) -> list:
        """
        Enhance messages for vibe check feature
        For basic vibe check, we don't add any special context
        """
        # Vibe check is the basic implementation - no special enhancements needed
        # This could be where you'd add conversation history, special instructions, etc.
        
        # Just return messages as-is for now
        return messages
    
    @debug_track("Validating Request", optional=True)
    async def validate_request(self, request: BaseChatRequest) -> bool:
        """
        Optional validation specific to vibe check
        This is marked as optional so the pipeline continues even if validation fails
        """
        # Basic validation
        if not request.user_message or len(request.user_message.strip()) == 0:
            raise ValueError("Empty message not allowed")
        
        if len(request.user_message) > 10000:
            raise ValueError("Message too long (max 10,000 characters)")
        
        return True
    
    @debug_track("3-Second Processing Test")
    async def three_second_test(self) -> str:
        """
        Educational test to show debug tracking with longer operation
        Demonstrates pending -> success status progression
        """
        import asyncio
        await asyncio.sleep(3.0)
        return "3-second test completed successfully!"
    
    @debug_track("Parallel Failure Test", optional=True)
    async def parallel_failure_test(self) -> str:
        """
        Educational test to show optional failure handling
        This will fail but won't stop the pipeline due to optional=True
        """
        # Simulate a data source that might fail
        import random
        if random.random() < 0.7:  # 70% chance of failure
            raise ConnectionError("External service temporarily unavailable")
        return "External data retrieved successfully"
    
    async def process_chat(self, request):
        """
        Override the main chat processing to include vibe check educational tests
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
            import asyncio
            
            # Run educational tests in parallel with main processing
            three_sec_task = asyncio.create_task(self.three_second_test())
            failure_task = asyncio.create_task(self.parallel_failure_test())
            
            # Step 1: Create OpenAI client
            client_task = asyncio.create_task(self.create_openai_client(request.api_key))
            while not client_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            client = await client_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 2: Process user message
            processed_message_task = asyncio.create_task(self.process_user_message(request))
            while not processed_message_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            processed_message = await processed_message_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Step 3: Prepare messages
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
            
            # Step 4: Enhance messages
            enhanced_messages_task = asyncio.create_task(self.enhance_messages(messages, request))
            while not enhanced_messages_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            enhanced_messages = await enhanced_messages_task
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            
            # Wait for educational tests to complete and stream their results
            while not three_sec_task.done() or not failure_task.done():
                async for debug_msg in drain_fn(debug_queue):
                    yield debug_msg
                await asyncio.sleep(0.01)
            
            # Get results (failure_task might return None due to optional=True)
            three_sec_result = await three_sec_task
            failure_result = await failure_task  # Could be None if failed
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
            completion_data = {
                "full_response": full_response,
                "response_length": len(full_response),
                "feature": self.feature_name,
                "three_second_test": three_sec_result,
                "parallel_test_result": failure_result or "Failed (optional - pipeline continued)"
            }
            
            self.debug_logger.add_log(
                title=f"{self.feature_name} Processing Complete",
                content_type="clickable",
                data=completion_data,
                function_name=f"{self.feature_name.lower().replace(' ', '_')}_complete"
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
                function_name=f"{self.feature_name.lower().replace(' ', '_')}_error"
            )
            
            async for debug_msg in drain_fn(debug_queue):
                yield debug_msg
            raise