# Debug Panel Implementation Guide

## 1. Introduction & Purpose

The Debug Panel is a crucial tool for this project, designed specifically for a learning and experimental environment. Its primary function is to provide a clear, "under-the-hood" view of the backend processes that occur during an LLM interaction.

This allows students and developers to:
-   **Understand the flow:** See the step-by-step execution of functions in the backend.
-   **Inspect data:** View the exact data being passed between functions (e.g., raw user input, formatted prompts, API responses).
-   **Debug issues:** Quickly identify which part of the process might be causing unexpected behavior.
-   **Learn advanced techniques:** Visualize complex processes like Retrieval-Augmented Generation (RAG) as they happen.

## 2. Core Principles

-   **Ephemeral Log:** The debug log is **not** a continuous, session-long record. It should be cleared and repopulated for **each new LLM response**. It only ever shows the process for the *most recent* interaction.
-   **Sequential & Nested View:** The log should present a chronological sequence of events. If a function calls another function, the child function's logs should be visually nested within the parent to represent the call stack and process flow.

## 3. Implementation Guide

To support the debug panel, the backend needs to generate a structured log of its execution. We will create a `DebugLogger` helper class/module to encapsulate this logic and keep `app.py` clean.

### 3.1. Generating the Debug Log

Each function in the backend that represents a significant step in the process should generate a log entry using the `DebugLogger`. The main chat function (`/api/chat`) will be responsible for aggregating these entries and returning them alongside the chat response.

For a seamless experience, the API should stream both the main chat content and the debug log entries as they are generated. This can be achieved using Server-Sent Events (SSE) or by formatting the streaming response to include distinct data types (e.g., `{"type": "chat", "data": "..."}` and `{"type": "debug", "data": {...}}`).

### 3.2. Data Structure for a Log Entry

A list of JSON objects is the recommended format for the log. Each object represents one step and should have a consistent structure.

```json
{
  "id": 1,
  "parent_id": null,
  "level": 0,
  "timestamp": "2023-10-27T10:00:01.123Z",
  "title": "User sends message",
  "status": "success",
  "content": {
    "type": "clickable",
    "data": "Hello, how does RAG work?"
  }
}
```

-   `id`: A unique identifier for the step.
-   `parent_id`: The `id` of the parent step. `null` for top-level steps. This allows the frontend to render the nested structure correctly.
-   `level`: The indentation level (can be derived from the `parent_id` hierarchy on the frontend).
-   `timestamp`: The time the event occurred, for debugging and performance analysis.
-   `title`: A human-readable description of the step (e.g., "Sending to OpenAI API," "Processing RAG results").
-   `status`: The outcome of the step (e.g., `success`, `pending`, `error`). This helps in color-coding the entries on the frontend.
-   `content`: An object containing the data associated with this step.
    -   `type`: Determines how the frontend should render the data:
        -   `'inline'`: For short strings, display directly in the debug log.
        -   `'clickable'`: For large objects (JSON payloads, long text), render a button.
    -   `data`: The actual content. For `'clickable'` types, this is the content that will be shown in the modal.

### 3.3. Handling Large Content with Clickables

When a log entry's content `type` is `'clickable'`, the frontend should render a button (e.g., "View Content," "Show API Request").

When this button is clicked, a **modal window** should appear in the center of the screen, displaying the full, un-truncated `data` payload. This modal should ideally include formatting for JSON to improve readability.

## 4. Example Scenarios

### 4.1. Basic Chat Flow

A simple user message would generate a series of log entries like this:

1.  **User sends message**
    -   *Content (clickable):* `{ "user_message": "Explain quantum computing." }`
2.  **Preparing API Request**
    -   *Content (clickable):* `{ "model": "gpt-4.1-mini", "messages": [...] }`
3.  **Sending to OpenAI API**
    -   *Status:* `pending`
4.  **Received API Response**
    -   *Status:* `success`
    -   *Content (clickable):* `{ "id": "chatcmpl-...", "object": "chat.completion.chunk", ... }`
5.  **Parsing Final Message**
    -   *Content (inline):* `"Quantum computing is..."`
6.  **Displaying to User**

### 4.2. Future: RAG Flow (Example)

A more complex RAG query could be visualized in the debug panel as follows:

1.  **User sends message**
    -   *Content (clickable):* `{ "user_message": "What did the paper say about attention mechanisms?" }`
2.  **Starting RAG Process**
    1.  **Embedding User Query**
        -   *Content (inline):* `"Using model text-embedding-ada-002"`
    2.  **Searching Vector Database**
        -   *Status:* `pending`
    3.  **Retrieved Sources**
        -   *Status:* `success`
        -   *Content (clickable):* `[ { "source": "doc1.pdf", "score": 0.92 }, { "source": "doc3.txt", "score": 0.88 } ]`
    4.  **Selecting Top-K Sources**
        -   *Content (inline):* `"Selected 2 sources."`
3.  **Generating Prompt with Context**
    -   *Content (clickable):* `{ "model": "gpt-4.1-mini", "messages": [ { "role": "system", "content": "Context: ... User query: ..." } ] }`
4.  **Sending to OpenAI API**
    -   ... (continues like the basic chat flow) ...

---

This guide provides a solid foundation for implementing and extending the debug panel. By adhering to these principles, we can create a powerful and intuitive learning tool for all users.

---

## 5. Current Implementation Details

### 5.1. Decorator-Based Function Tracking

The current implementation uses a **decorator pattern** to automatically track LLM-related functions in the debug panel. This approach eliminates the need for manual logging calls within each function.

#### **Core Decorator: `@debug_track`**

All functions that are part of the LLM processing pipeline should be decorated with `@debug_track()`:

```python
@debug_track("Preparing OpenAI API Request")
async def prepare_api_request(developer_message: str, user_message: str, model: str):
    """Prepare the API request payload for OpenAI"""
    # Function implementation...
    return api_payload
```

**Key Features:**
- **Automatic Status Tracking:** Functions automatically start with `pending` (yellow) status, then update to `success` (green) or `error` (red)
- **Input/Output Capture:** Decorator automatically captures function arguments and return values (filtered for JSON serialization)
- **Real-time Streaming:** Status updates are streamed to frontend immediately via callback system
- **Error Handling:** Exceptions are caught and displayed with full traceback information

#### **Decorator Parameters:**
- `title`: Custom display name (auto-generated from function name if omitted)
- `content_type`: Either `"clickable"` (default) or `"inline"`
- `track_args`: Whether to capture function arguments (default: `True`)
- `track_result`: Whether to capture function return value (default: `True`)

### 5.2. Real-Time Streaming Architecture

The implementation uses a **queue-based streaming system** to ensure debug updates appear in real-time:

```python
# Set up real-time debug streaming
debug_queue = asyncio.Queue()

def stream_debug_update(log_entry):
    debug_queue.put_nowait(log_entry)

debug_logger.set_status_callback(stream_debug_update)

# Execute functions as tasks and stream updates during execution
task = asyncio.create_task(decorated_function())
while not task.done():
    async for debug_msg in drain_debug_queue():
        yield sse_format({"type": "debug", "data": debug_msg})
    await asyncio.sleep(0.01)
```

**Key Benefits:**
- **Immediate Status Updates:** Pending status appears instantly when function starts
- **Progress Visibility:** Users can see which process is currently running (yellow status)
- **Stuck Process Detection:** Long-running processes remain yellow, making bottlenecks obvious

### 5.3. Frontend Debug Viewer System

The frontend includes an **in-place debug viewer** that replaces the chat window when viewing debug entries:

#### **Navigation Features:**
- **Keyboard Navigation:** Arrow keys (↑↓) to navigate between debug entries
- **Highlighting:** Currently viewed entry is highlighted in debug panel
- **Background Blur:** Everything except chat window and debug panel is blurred during viewing
- **ESC to Exit:** Returns to normal chat interface

#### **Visual Status Indicators:**
- **Green Border:** Completed successfully
- **Yellow Border:** Currently in progress (pending)
- **Red Border:** Error occurred

### 5.4. Backend Implementation Guide

#### **Required Decorators for LLM Functions:**

1. **API Preparation:** `@debug_track("Preparing OpenAI API Request")`
2. **API Calls:** `@debug_track("Calling OpenAI API", track_result=False)`
3. **Response Processing:** `@debug_track("Processing Response Stream")`
4. **Custom Operations:** `@debug_track("Custom Operation Name")`

#### **Import Requirements:**
```python
# In api/app.py
try:
    from .debug_logger import debug_logger, debug_track
except ImportError:
    from debug_logger import debug_logger, debug_track
```

### 5.5. Common Troubleshooting Scenarios

#### **Issue: Yellow status never appears**
- **Cause:** Debug updates not being streamed in real-time
- **Solution:** Ensure functions are run as `asyncio.create_task()` with proper queue draining

#### **Issue: Functions not appearing in debug panel**
- **Cause:** Missing `@debug_track` decorator
- **Solution:** Add decorator to all LLM pipeline functions

#### **Issue: JSON serialization errors**
- **Cause:** Non-serializable objects (like OpenAI client) in function arguments
- **Solution:** Decorator automatically filters these out and shows `<ObjectType object>`

#### **Issue: Debug viewer not working**
- **Cause:** CSS positioning or JavaScript event handling issues
- **Solution:** Verify debug viewer uses absolute positioning and proper event listeners
