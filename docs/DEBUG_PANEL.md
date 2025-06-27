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

## 5. Implementation Notes & Troubleshooting

This section contains specific implementation details and solutions to common issues encountered during development.

### 5.1. Backend: Data Streaming with SSE

-   **Server-Sent Events (SSE):** The backend uses SSE to stream data to the frontend. This is handled by returning a `StreamingResponse` with the `text/event-stream` media type.
-   **Structured Payload:** Every message sent to the client is a JSON object with a specific structure: `{"type": "...", "data": ...}`.
    -   `type`: Can be `chat`, `debug`, or `error`.
    -   `data`: The payload, which is a string for `chat` or a log object for `debug`.
-   **SSE Formatting:** A helper function `sse_format` in `api/app.py` wraps the JSON string in the required `data: ...\n\n` format.

### 5.2. Frontend: Rendering Logic

-   **Parsing the Stream:** The `streamChat` function in `script.js` reads the streaming response. It splits the incoming chunks by `\n\n` and parses each `data:` line as JSON.
-   **Rendering Debug Logs:** The `renderDebugLog` function is responsible for displaying the logs.
    -   It creates or **updates** a log entry based on its unique `id`. This is crucial for updating the status of a step (e.g., from `pending` to `success`).
    -   It uses `data-level` and `data-status` attributes to apply CSS for indentation and color-coding.
-   **Clickable Content & Modals:**
    -   If a log's `content.type` is `clickable`, a "View" button is rendered.
    -   An event listener is attached to this button, which calls `showContentModal`.
-   **JSON Formatting in Modal:**
    -   The `showContentModal` function does **not** simply dump the JSON into a `<pre>` tag.
    -   It parses the JSON and builds a custom HTML structure with `divs` and `spans` to achieve a **hanging indent** for long values. This is key for readability.
    -   **Word Wrapping:** CSS `overflow-wrap: break-word;` is used on the value `span` to ensure long strings (like prompts) wrap at word boundaries instead of being split mid-word.

### 5.3. Common Troubleshooting Scenarios

#### **Issue: The Debug Panel is blank and no logs appear.**

1.  **Is the backend server running?** The most common issue is that the `api/app.py` server is not running or has crashed.
2.  **Was the backend server restarted after changes?**
    -   **Problem:** If you add a new import or function to the backend, the server must be restarted.
    -   **Symptom:** You will see an `ImportError: attempted relative import with no known parent package` in the terminal if you run `python api/app.py` after adding a relative import like `from .debug_logger...`.
    -   **Solution:** Change the import to be direct (e.g., `from debug_logger...`) and **restart the server**.
3.  **Is the frontend pointing to the correct API URL?**
    -   **Problem:** The `fetch` call in `streamChat` might be using a relative path (`/api/chat`) instead of the full backend URL.
    -   **Symptom:** A silent failure. The request goes to the frontend server (e.g., port 3000) which can't handle the API call, resulting in a 404 error that might not be immediately obvious in the console.
    -   **Solution:** Ensure the `fetch` URL is `\${this.apiBaseUrl}/api/chat`, where `apiBaseUrl` is correctly set to `http://localhost:8000`.
4.  **Is there a JavaScript rendering error?**
    -   **Problem:** A subtle bug in the `renderDebugLog` function might prevent DOM elements from being created or appended correctly.
    -   **Symptom:** The network tab shows data being received, but nothing appears in the panel. No console errors are thrown.
    -   **Solution:** Verify that the logic for creating **and** replacing/appending elements in `renderDebugLog` is correct. Ensure a new `div` is always created and then either appended or used to replace an existing one.

{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant for an LLM bootcamp. Help students learn about RAG, prompt engineering, and 
                  other LLM techniques. Be clear, educational, and provide practical examples."
    },
    {
      "role": "user",
      "content": "test!"
    }
  ],
  "stream": true
}