# Debug Panel Implementation Guide

## 1. Introduction & Purpose

The Debug Panel is a crucial tool for this project, designed specifically for a learning and experimental environment. Its primary function is to provide a clear, "under-the-hood" view of the backend processes that occur during an LLM interaction.

This allows students and developers to:
-   **Understand the flow:** See the step-by-step execution of functions in the backend.
-   **Inspect data:** View the exact data being passed between functions (e.g., raw user input, formatted prompts, API responses).
-   **Debug issues:** Quickly identify which part of the process might be causing unexpected behavior.
-   **Learn advanced techniques:** Visualize complex processes like Retrieval-Augmented Generation (RAG) as they happen.

## 2. Core Principles

-   **Ephemeral Log:** The debug log is **not** a continuous, session-long record. It is cleared and repopulated for **each new LLM response**. It only ever shows the process for the *most recent* interaction.
-   **Sequential & Nested View:** The log presents a chronological sequence of events. If a function calls another function, the child function's logs are visually nested within the parent to represent the call stack and process flow. The `level` property in the log entry controls this indentation on the frontend.

## 3. Implementation Details

### 3.1. Backend: Streaming with Server-Sent Events (SSE)

-   **`api/debug_logger.py`**: A singleton `DebugLogger` class handles the creation and formatting of log entries. It maintains the state of the log for a single request.
-   **`api/app.py`**: The `/api/chat` endpoint now uses an `event_stream` to send data.
-   **Structured Events**: Instead of a plain text stream, the API sends structured JSON objects formatted as Server-Sent Events (SSE). Each event has a `type` (`chat`, `debug`, or `error`) and a `data` payload. This allows the frontend to easily distinguish between different kinds of messages.
    ```python
    # Example of an SSE message
    yield f"data: {json.dumps(event_data)}\n\n"
    ```

### 3.2. Frontend: Parsing and Rendering

-   **`frontend/script.js`**:
    -   The `streamChat` function handles the SSE stream. It reads the incoming chunks, splits them into individual events, and parses the JSON data.
    -   Based on the `type`, it routes the data to the appropriate handler: updating the chat message, adding a log to the debug panel, or showing an error.
    -   The `renderDebugLog` function dynamically creates or updates `divs` in the debug panel for each log entry, styling them based on their `status` and `level`.
    -   The `showContentModal` function is responsible for rendering the content of "clickable" log entries. It includes logic to pretty-print JSON with hanging indents for readability.
-   **`frontend/styles.css`**:
    -   Contains rules for the debug panel layout, log entry styling (including status colors and indentation), and the content modal.
    -   The hanging indent for JSON is achieved using flexbox on `.json-line` elements.
    -   Word wrapping is handled with `overflow-wrap: break-word` to prevent splitting words.

## 4. Troubleshooting Common Issues

This section documents solutions to issues encountered during the initial implementation.

### 4.1. Issue: Debug Panel is Blank / Not Updating

This is the most common issue and usually points to a communication problem between the frontend and backend.

-   **Cause 1: Backend Server Not Restarted**
    -   **Symptom:** The app works initially, but fails after backend changes (e.g., adding a new endpoint).
    -   **Solution:** The FastAPI backend server must be **restarted** after any code change to load the new logic. Stop the server (`Ctrl+C`) and run `python api/app.py` again.

-   **Cause 2: Incorrect API URL in Frontend**
    -   **Symptom:** The browser's network tab shows requests to the wrong port (e.g., `http://localhost:3000/api/chat` instead of `8000`).
    -   **Solution:** Ensure the `apiBaseUrl` variable in `frontend/script.js` is set to the correct backend server address (`http://localhost:8000`). The `fetch` call in `streamChat` must use this variable.

-   **Cause 3: Frontend Rendering Bug**
    -   **Symptom:** The network tab shows the debug data is being received, but nothing appears in the panel.
    -   **Solution:** Check the `renderDebugLog` function in `frontend/script.js`. Ensure that new DOM elements are being created and appended correctly for each log entry. The logic should handle both creating new entries and updating existing ones (e.g., changing a status from `pending` to `success`).

### 4.2. Issue: Backend Fails to Start with an `ImportError`

-   **Symptom:** Running `python api/app.py` fails immediately with `ImportError: attempted relative import with no known parent package`.
-   **Cause:** This happens when a script run directly uses a relative import (e.g., `from .debug_logger import ...`). Python doesn't recognize the directory as a package in this context.
-   **Solution:** Change the relative import to a direct/absolute one. In `api/app.py`, change `from .debug_logger` to `from debug_logger`.

### 4.3. General Checklist

1.  **Are both servers running?** You need one terminal for the backend (`python api/app.py`) and another for the frontend (`python -m http.server 3000` in the `frontend` directory).
2.  **Check browser console:** Look for any JavaScript errors or failed network requests (404s, CORS errors).
3.  **Verify ports:** Ensure the backend is on port 8000 and the frontend is on 3000 (or whichever ports you are using).

---
This guide provides a solid foundation for implementing and extending the debug panel. By adhering to these principles, we can create a powerful and intuitive learning tool for all users.




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