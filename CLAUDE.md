# Development Guidelines for Claude

This document contains important guidelines and patterns for maintaining and extending this LLM chat application.

## Critical: Debug Panel Integration

### 🚨 MANDATORY: Decorator for LLM Functions

**EVERY function that is part of the LLM processing pipeline MUST be decorated with `@debug_track`.**

This is not optional - the debug panel is a core educational feature that helps users understand the backend processes.

#### When to Use `@debug_track`:

✅ **ALWAYS decorate these functions:**
- Functions that prepare API requests
- Functions that call external APIs (OpenAI, other LLM providers)
- Functions that process LLM responses
- Functions that handle embeddings or vector operations
- Functions that implement RAG (Retrieval-Augmented Generation)
- Functions that parse or transform LLM data
- Any function that represents a significant step in the LLM pipeline

✅ **Examples of functions that MUST be decorated:**
```python
@debug_track("Preparing OpenAI API Request")
async def prepare_api_request(messages, model):
    # Function implementation
    pass

@debug_track("Calling OpenAI API", track_result=False)
async def call_openai_api(client, payload):
    # Function implementation  
    pass

@debug_track("Processing Response Stream")
async def process_response(stream):
    # Function implementation
    pass

@debug_track("Generating Embeddings")
async def create_embeddings(texts):
    # Function implementation
    pass

@debug_track("Searching Vector Database") 
async def search_vectors(query_embedding):
    # Function implementation
    pass
```

❌ **DO NOT decorate these functions:**
- Utility functions (string manipulation, date formatting, etc.)
- Database connection functions (unless they're retrieving LLM context)
- Authentication functions
- Static file serving functions
- Health check endpoints

### Required Import Pattern

Always use this import pattern in files that need debug tracking:

```python
# Import debug logger with fallback for direct execution
try:
    from .debug_logger import debug_logger, debug_track
except ImportError:
    # Fallback for when running directly
    from debug_logger import debug_logger, debug_track
```

### Decorator Parameters

```python
@debug_track(
    title="Custom Display Name",    # Optional: Auto-generated from function name if omitted
    content_type="clickable",       # Optional: "clickable" (default) or "inline"
    track_args=True,                # Optional: Capture function arguments (default: True)
    track_result=True,              # Optional: Capture return value (default: True)
    optional=False                  # Optional: Allow pipeline to continue if function fails (default: False)
)
```

**Common Patterns:**
- Use `track_result=False` for functions that return large streams or non-serializable objects
- Use custom `title` for better user understanding (e.g., "Calling OpenAI API" instead of "Call Openai Api")
- Use `content_type="inline"` for simple string results that don't need a modal
- Use `optional=True` for data sources that may fail without stopping the pipeline

### Critical vs Optional Functions

#### **Critical Functions (default behavior):**
Use for functions that MUST succeed for the pipeline to work:
```python
@debug_track("Essential API Call")
async def call_openai_api():
    # If this fails, stop everything
    return await openai.chat.completions.create(...)

@debug_track("Core Data Processing") 
async def process_main_data():
    # If this fails, stop everything
    return processed_data
```

#### **Optional Functions:**
Use for functions that enhance the pipeline but aren't essential:
```python
@debug_track("Supplementary Data Source", optional=True)
async def fetch_enhancement_data():
    # If this fails, continue without this data
    return await external_api_call()

@debug_track("Cache Lookup", optional=True)
async def check_cache():
    # If cache is down, continue without cached data
    return await redis.get(key)

@debug_track("Optional Validation", optional=True)
async def validate_external_source():
    # If validation fails, continue anyway
    return await validation_service()
```

**Important:** Optional functions that fail will still show as **red errors** in the debug panel with full clickable error details - the only difference is that the pipeline continues executing instead of stopping.

#### **Handling Optional Function Results:**
```python
# Optional functions return None when they fail
cache_result = await check_cache()  # Could be None
enhancement_data = await fetch_enhancement_data()  # Could be None

# Always check for None before using results
available_data = []
if cache_result is not None:
    available_data.append(cache_result)
if enhancement_data is not None:
    available_data.append(enhancement_data)

# Continue with whatever data you have
final_result = await process_with_available_data(available_data)
```

### Real-Time Streaming Integration

When adding new LLM functions to the main chat flow in `api/app.py`, follow this pattern:

```python
# Execute as task for real-time streaming
task = asyncio.create_task(your_new_llm_function())

# Stream debug updates while function runs
while not task.done():
    async for debug_msg in drain_debug_queue():
        yield debug_msg
    await asyncio.sleep(0.01)

# Get result and final debug updates
result = await task
async for debug_msg in drain_debug_queue():
    yield debug_msg
```

## Code Style Guidelines

### Function Organization
- Keep LLM-related functions in separate, focused modules when possible
- Use descriptive function names that clearly indicate their purpose
- Add comprehensive docstrings explaining the function's role in the LLM pipeline

### Error Handling
- The `@debug_track` decorator automatically captures and displays errors
- Don't suppress exceptions unless absolutely necessary
- Provide meaningful error messages that help users understand what went wrong

### Async Patterns
- Use `async`/`await` consistently throughout the LLM pipeline
- Always use `asyncio.create_task()` for functions that need real-time debug streaming
- Don't block the event loop with synchronous operations

## Testing New Features

### Debug Panel Testing Checklist

When adding new LLM functions:

1. ✅ Function is decorated with `@debug_track`
2. ✅ Function appears in debug panel when executed
3. ✅ Status starts as yellow (pending) and changes to green (success) or red (error)
4. ✅ Function data is viewable by clicking "View" button
5. ✅ Function integrates with real-time streaming system
6. ✅ Errors are caught and displayed with full traceback

### Test with Long-Running Operations

Add temporary delays to verify yellow status visibility:

```python
@debug_track("Testing New Feature")
async def test_new_feature():
    await asyncio.sleep(2.0)  # Temporary: Remove after testing
    # Your actual implementation
    return result
```

## Extending the System

### Adding New LLM Providers

When adding support for new LLM providers (Anthropic, Cohere, etc.):

1. Create provider-specific functions with appropriate `@debug_track` decorators
2. Follow the same async task pattern for real-time streaming
3. Update the debug panel documentation with new function types
4. Test that all provider functions show proper status progression

### Adding RAG Capabilities

When implementing RAG features:

1. Each major RAG step should be a separate decorated function:
   - `@debug_track("Embedding User Query")`
   - `@debug_track("Searching Vector Database")`
   - `@debug_track("Retrieving Context Documents")`
   - `@debug_track("Generating RAG Prompt")`

2. Use nested functions to show the RAG pipeline hierarchy

### Performance Considerations

- The debug system adds minimal overhead (~0.05s delay per function for status visibility)
- Don't remove debug tracking for performance reasons - it's essential for the educational experience
- If performance becomes critical, add a production mode that disables debug tracking

## Common Pitfalls

### ❌ Forgetting the Decorator
```python
# WRONG - Function won't appear in debug panel
async def important_llm_function():
    return await openai_call()
```

```python
# CORRECT - Function will be tracked
@debug_track("Important LLM Operation")
async def important_llm_function():
    return await openai_call()
```

### ❌ Blocking the Event Loop
```python
# WRONG - Will block real-time streaming
@debug_track("Synchronous Operation")
def blocking_function():
    time.sleep(5)  # Blocks entire application
    return result
```

```python
# CORRECT - Non-blocking operation
@debug_track("Asynchronous Operation")
async def non_blocking_function():
    await asyncio.sleep(5)  # Allows other operations to continue
    return result
```

### ❌ Incorrect Streaming Integration
```python
# WRONG - Debug updates won't stream in real-time
result = await decorated_function()
# Updates only appear after completion
```

```python
# CORRECT - Real-time debug streaming
task = asyncio.create_task(decorated_function())
while not task.done():
    async for debug_msg in drain_debug_queue():
        yield debug_msg
    await asyncio.sleep(0.01)
result = await task
```

## Summary

The debug panel is a core feature that provides educational value by showing users exactly how the LLM pipeline works. Every function that plays a role in LLM processing must be decorated with `@debug_track` to maintain this transparency.

When in doubt, decorate the function - it's better to have too much visibility than too little in an educational environment.

## Homework Isolation Architecture

### 🏗️ **Creating New Homework Assignments**

When adding new homework assignments, follow this pattern for complete code isolation:

#### **1. Folder Structure**
```bash
features/
└── XX-homework-name/
    ├── backend/
    │   └── handler.py          # Isolated homework handler
    └── frontend/ (optional)
        ├── homework-name.css   # Homework-specific styles
        └── homework-name.js    # Homework-specific functionality
```

#### **2. Handler Implementation**
```python
# features/XX-homework-name/backend/handler.py
import sys
from pathlib import Path

# Add base directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from base.backend.base_handler import BaseChatHandler, BaseChatRequest
from base.backend.debug_logger import debug_track

class HomeworkNameHandler(BaseChatHandler):
    def __init__(self):
        super().__init__("Homework Name")
    
    @debug_track("Homework-Specific Function")
    async def homework_specific_function(self):
        # Isolated homework logic with debug tracking
        pass
    
    # Required abstract method implementations
    async def get_system_prompt(self) -> str:
        return "Homework-specific system prompt"
    
    async def process_user_message(self, request: BaseChatRequest) -> str:
        return request.user_message  # Homework-specific processing
    
    async def enhance_messages(self, messages: list, request: BaseChatRequest) -> list:
        return messages  # Homework-specific enhancements
```

#### **3. Enable in Configuration**
```python
# api/homework_app.py - Add to HOMEWORK_FEATURES
"XX-homework-name": {
    "name": "Homework Display Name",
    "path": "features/XX-homework-name/backend", 
    "handler_class": "HomeworkNameHandler",
    "enabled": True  # Set to True when ready
}
```

#### **4. Frontend Integration (Optional)**
```javascript
// features/XX-homework-name/frontend/homework-name.js
class HomeworkNameManager {
    init() {
        // Homework-specific UI logic
        console.log('📚 Homework Name Manager initialized');
    }
    
    cleanup() {
        // Clean up when switching away
    }
}
window.HomeworkNameManager = HomeworkNameManager;
```

### 🔍 **Debug Tracking Patterns for Different Homework**

#### **Document Processing (RAG-style)**
```python
@debug_track("Processing Document Upload")
async def process_document_upload(self, file_name: str, file_content: str):
    # Document processing logic
    return {"success": True, "content_preview": file_content[:500]}

@debug_track("Searching Document Store")
async def search_documents(self, query: str):
    # Search logic
    return search_results
```

#### **Educational Tests (Vibe Check-style)**
```python
@debug_track("3-Second Processing Test")
async def three_second_test(self) -> str:
    await asyncio.sleep(3.0)
    return "Test completed successfully!"

@debug_track("Parallel Failure Test", optional=True)
async def parallel_failure_test(self) -> str:
    # 70% chance of failure for educational purposes
    if random.random() < 0.7:
        raise ConnectionError("Simulated failure")
    return "Optional test succeeded"
```

#### **API Integration**
```python
@debug_track("Calling External API")
async def call_external_api(self, params: dict):
    # External service integration
    return api_response

@debug_track("Processing API Response", track_result=False)
async def process_api_response(self, response):
    # Large response processing
    return processed_data
```

### 🎯 **Homework-Specific Guidelines**

#### **✅ DO for Each Homework:**
- Create completely isolated handlers
- Use homework-specific debug track titles
- Implement all required abstract methods
- Follow the import pattern for base classes
- Add meaningful debug tracking for educational value

#### **❌ DON'T:**
- Share state between homework assignments
- Import code from other homework assignments
- Use generic function names across homework
- Skip debug tracking for homework-specific functions
- Mix homework logic in base classes

### 🔄 **Testing Homework Isolation**

When developing new homework:

1. ✅ **Switch between homework assignments** - ensure no interference
2. ✅ **Check debug panel content** - verify homework-specific functions appear
3. ✅ **Test with different API keys** - ensure isolation is maintained
4. ✅ **Verify frontend assets load correctly** - CSS/JS specific to homework
5. ✅ **Clear chat between switches** - ensure clean state

### 📊 **Deployment Considerations**

All homework assignments deploy together via `api/homework_app.py`:

```python
# Unified routing automatically handles all enabled homework
@app.post("/api/chat")
async def homework_chat(request: ChatRequest):
    handler = load_homework_handler(request.feature_id)  # Isolated loading
    return StreamingResponse(handler.process_chat(request))
```

This architecture ensures:
- ✅ **Complete code isolation** between assignments
- ✅ **Seamless user experience** via unified interface  
- ✅ **Educational transparency** through homework-specific debug tracking
- ✅ **Scalable deployment** of all homework assignments together