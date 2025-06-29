"""
Base handler for all chat features
Provides common functionality that all homework features can use
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator
import json

# Import debug logger with fallback for direct execution
try:
    from ..debug_logger import debug_logger, debug_track
except ImportError:
    from debug_logger import debug_logger, debug_track


class BaseChatHandler(ABC):
    """Base class for all feature-specific chat handlers"""
    
    def __init__(self):
        self.debug_logger = debug_logger
    
    @abstractmethod
    async def process_chat(self, request) -> AsyncGenerator[str, None]:
        """Process chat request - must be implemented by each feature"""
        pass
    
    def sse_format(self, data: dict) -> str:
        """Format data for Server-Sent Events"""
        return f"data: {json.dumps(data)}\n\n"
    
    @debug_track("Validating API Key")
    async def validate_api_key(self, api_key: str) -> bool:
        """Common API key validation"""
        if not api_key or not api_key.startswith('sk-'):
            raise ValueError("Invalid API key format")
        return True
    
    async def stream_debug_updates(self, debug_queue) -> AsyncGenerator[str, None]:
        """Helper to stream debug updates from queue"""
        while not debug_queue.empty():
            try:
                log_entry = debug_queue.get_nowait()
                yield self.sse_format({"type": "debug", "data": log_entry})
            except:
                break