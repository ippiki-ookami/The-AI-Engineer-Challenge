# Project Structure for Homework Features

## Recommended Folder Structure

```
The-AI-Engineer-Challenge/
│
├── api/
│   ├── __init__.py
│   ├── app.py                    # Main FastAPI app with route registration
│   ├── debug_logger.py           # Shared debug logging system
│   │
│   ├── core/                     # Shared/base functionality
│   │   ├── __init__.py
│   │   ├── base_handler.py       # Base chat handler
│   │   └── utils.py              # Shared utilities
│   │
│   └── features/                 # Feature-specific implementations
│       ├── __init__.py
│       ├── vibe_check/           # 01 - Basic chat
│       │   ├── __init__.py
│       │   └── handler.py
│       ├── embeddings_rag/       # 02 - RAG implementation
│       │   ├── __init__.py
│       │   ├── handler.py
│       │   ├── embeddings.py
│       │   └── vector_store.py
│       ├── agents/               # 03 - AI Agents
│       │   ├── __init__.py
│       │   ├── handler.py
│       │   └── tools.py
│       ├── fine_tuning/          # 04 - Fine tuning
│       │   ├── __init__.py
│       │   ├── handler.py
│       │   └── models.py
│       └── multimodal/           # 05 - Multimodal
│           ├── __init__.py
│           ├── handler.py
│           └── image_processor.py
│
├── frontend/
│   ├── index.html                # Base HTML (with feature placeholders)
│   ├── script.js                 # Main JS with feature loader
│   ├── styles.css                # Base styles
│   │
│   ├── components/               # Reusable UI components
│   │   ├── chat.js
│   │   ├── debug-panel.js
│   │   └── notifications.js
│   │
│   └── features/                 # Feature-specific frontend code
│       ├── vibe_check/
│       │   └── vibe_check.js
│       ├── embeddings_rag/
│       │   ├── rag.js
│       │   ├── rag.css
│       │   └── rag-panel.html
│       ├── agents/
│       │   ├── agents.js
│       │   └── agents.css
│       ├── fine_tuning/
│       │   ├── fine_tuning.js
│       │   └── model-selector.html
│       └── multimodal/
│           ├── multimodal.js
│           ├── multimodal.css
│           └── image-preview.html
│
├── docs/
│   ├── DEBUG_PANEL.md
│   ├── HOMEWORK_FEATURES.md
│   └── PROJECT_STRUCTURE.md
│
└── CLAUDE.md
```

## Implementation Strategy

### 1. Backend Organization

**Main App Router** (`api/app.py`):
```python
from fastapi import FastAPI
from api.features import vibe_check, embeddings_rag, agents

app = FastAPI()

# Register feature-specific routes
app.include_router(vibe_check.router, prefix="/api/vibe-check", tags=["vibe-check"])
app.include_router(embeddings_rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])

# Shared endpoint that routes based on feature
@app.post("/api/chat")
async def chat(request: ChatRequest):
    feature = request.feature_id
    
    if feature == "01-vibe-check":
        return await vibe_check.handler.process_chat(request)
    elif feature == "02-embeddings-rag":
        return await embeddings_rag.handler.process_chat(request)
    # ... etc
```

**Feature Handler Example** (`api/features/embeddings_rag/handler.py`):
```python
from api.debug_logger import debug_track
from .embeddings import create_embedding
from .vector_store import search_documents

@debug_track("RAG Document Search")
async def search_context(query: str):
    embedding = await create_embedding(query)
    return await search_documents(embedding)

async def process_chat(request):
    # RAG-specific chat processing
    context = await search_context(request.user_message)
    # ... rest of implementation
```

### 2. Frontend Organization

**Feature Loader** (`frontend/script.js`):
```javascript
class ChatInterface {
    async loadFeatureModule(featureId) {
        // Dynamically import feature-specific code
        switch(featureId) {
            case '02-embeddings-rag':
                const { RAGFeature } = await import('./features/embeddings_rag/rag.js');
                this.featureModule = new RAGFeature(this);
                break;
            case '03-agents':
                const { AgentsFeature } = await import('./features/agents/agents.js');
                this.featureModule = new AgentsFeature(this);
                break;
            // ... etc
        }
        
        // Initialize feature-specific UI
        if (this.featureModule) {
            await this.featureModule.initialize();
        }
    }
    
    switchFeature(featureId) {
        // Cleanup current feature
        if (this.featureModule) {
            this.featureModule.cleanup();
        }
        
        // Load new feature
        this.loadFeatureModule(featureId);
    }
}
```

**Feature Module Example** (`frontend/features/embeddings_rag/rag.js`):
```javascript
export class RAGFeature {
    constructor(chatInterface) {
        this.chat = chatInterface;
    }
    
    async initialize() {
        // Load RAG-specific UI
        await this.loadRAGPanel();
        this.setupEventListeners();
    }
    
    async loadRAGPanel() {
        const response = await fetch('./features/embeddings_rag/rag-panel.html');
        const html = await response.text();
        document.getElementById('ragContainer').innerHTML = html;
    }
    
    cleanup() {
        // Remove event listeners, clear UI
    }
}
```

### 3. Running Different Features

**Option 1: Single Server (Recommended)**
```bash
# All features available through one server
python3 -m uvicorn api.app:app --reload --port 8000
```

**Option 2: Feature-Specific Servers**
```bash
# Run specific feature only
python3 -m uvicorn api.features.embeddings_rag.app:app --reload --port 8001
```

### 4. Environment Variables

`.env` file:
```
# Feature flags
ENABLE_VIBE_CHECK=true
ENABLE_RAG=true
ENABLE_AGENTS=false
ENABLE_FINE_TUNING=false
ENABLE_MULTIMODAL=false

# Feature-specific configs
RAG_VECTOR_DB_PATH=./data/vectors
RAG_CHUNK_SIZE=500
AGENTS_TOOLS_ENABLED=calculator,web_search
```

## Benefits of This Structure

1. **Separation of Concerns**: Each feature has its own folder
2. **Code Reusability**: Shared components in `core/` and `components/`
3. **Easy Testing**: Test features independently
4. **Progressive Enhancement**: Add features without breaking existing ones
5. **Clear Dependencies**: Each feature declares what it needs
6. **Maintainability**: Easy to find and modify feature-specific code

## Migration Path

1. Start with current monolithic structure
2. Gradually extract feature-specific code
3. Create feature folders as you implement new homework
4. Keep shared functionality in core modules

## Example: Adding RAG Feature

1. Create `api/features/embeddings_rag/` folder
2. Implement RAG-specific handlers
3. Create `frontend/features/embeddings_rag/` folder
4. Add RAG UI components
5. Update feature config to `enabled: true`
6. Test independently before integration

This structure allows you to develop each homework feature in isolation while maintaining a cohesive application!