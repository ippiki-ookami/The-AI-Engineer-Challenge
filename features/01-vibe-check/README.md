# 01 - Vibe Check

The basic LLM chat interface feature that introduces users to the LLM Bootcamp platform.

## Description

Vibe Check is the foundational feature that provides:
- Basic chat interface with OpenAI models
- Real-time debug panel showing LLM processing pipeline
- Theme switching (dark/light mode)
- Chat export functionality
- Educational system prompts

This is perfect for:
- First-time users getting familiar with the platform
- Understanding how LLM processing works behind the scenes
- Learning about system prompts and model selection
- Seeing the debug tracking system in action

## Features

- ✅ **Chat Interface**: Clean, modern chat UI
- ✅ **Debug Panel**: Real-time view of processing steps
- ✅ **Model Selection**: Switch between GPT models
- ✅ **Theme Toggle**: Dark/light mode support
- ✅ **Export Chat**: Download conversation history
- ✅ **System Prompts**: Customizable AI behavior
- ✅ **API Key Management**: Secure local storage

## Architecture

```
01-vibe-check/
├── backend/
│   ├── __init__.py
│   ├── app.py          # FastAPI application
│   └── handler.py      # VibeCheckHandler (extends BaseChatHandler)
├── frontend/
│   ├── index.html      # Feature HTML (extends base template concept)
│   ├── vibe-check.css  # Feature-specific styles
│   └── vibe-check.js   # VibeCheckInterface (extends BaseChatInterface)
└── README.md
```

## Running the Feature

### Option 1: Direct Run
```bash
cd features/01-vibe-check/backend
python -m uvicorn app:app --reload --port 8000
```

### Option 2: Using the run script (when created)
```bash
python scripts/run_feature.py --feature 01-vibe-check
```

### Option 3: From project root
```bash
python -m uvicorn features.01-vibe-check.backend.app:app --reload --port 8000
```

## API Endpoints

- `GET /` - Serve the frontend
- `GET /api/health` - Health check
- `POST /api/validate-key` - Validate OpenAI API key
- `POST /api/chat` - Main chat endpoint (Server-Sent Events)
- `GET /api/features` - Get available features

## Usage

1. Start the backend server
2. Open http://localhost:8000 in your browser
3. Enter your OpenAI API key when prompted
4. Start chatting and watch the debug panel!

## Educational Value

This feature teaches:
- How LLM APIs work
- The request/response cycle
- System prompts and their impact
- Real-time streaming responses
- Debug tracking and observability
- Frontend/backend communication

## Special Commands

- Type "vibe check" for a fun response!
- Use keyboard shortcuts:
  - `Ctrl/Cmd + K` - Focus input
  - `Ctrl/Cmd + L` - Clear chat
  - `Esc` - Close modals/debug viewer
  - `↑/↓` - Navigate debug entries

## Next Steps

After mastering Vibe Check, you can progress to:
- **02 - Embeddings and RAG**: Document upload and retrieval
- **03 - AI Agents**: Tool usage and multi-step reasoning
- **04 - Fine Tuning**: Custom model training
- **05 - Multimodal**: Image and text processing