# Full Modular Structure for Homework Features

## Complete Feature Isolation with Base Inheritance

```
The-AI-Engineer-Challenge/
│
├── base/                          # Shared base code all features inherit from
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── base_handler.py       # Base chat handler class
│   │   ├── debug_logger.py       # Shared debug system
│   │   └── utils.py              # Common utilities
│   │
│   └── frontend/
│       ├── base.html             # Base HTML template
│       ├── base.css              # Core styles (variables, reset, etc.)
│       ├── base.js               # Core chat functionality
│       └── components/           # Reusable components
│           ├── chat.js
│           ├── debug-panel.js
│           └── theme-toggle.js
│
├── features/                      # Each homework gets its own folder
│   │
│   ├── 01-vibe-check/            # Basic chat
│   │   ├── backend/
│   │   │   ├── __init__.py
│   │   │   ├── app.py            # Feature-specific FastAPI app
│   │   │   └── handler.py        # Inherits from base_handler
│   │   │
│   │   ├── frontend/
│   │   │   ├── index.html        # Complete HTML for this feature
│   │   │   ├── vibe-check.css    # Feature-specific styles
│   │   │   └── vibe-check.js     # Feature-specific JS
│   │   │
│   │   ├── README.md             # Feature documentation
│   │   └── requirements.txt      # Feature-specific dependencies
│   │
│   ├── 02-embeddings-rag/
│   │   ├── backend/
│   │   │   ├── __init__.py
│   │   │   ├── app.py
│   │   │   ├── handler.py
│   │   │   ├── embeddings.py     # RAG-specific modules
│   │   │   ├── vector_store.py
│   │   │   └── document_processor.py
│   │   │
│   │   ├── frontend/
│   │   │   ├── index.html        # Includes upload UI
│   │   │   ├── rag.css
│   │   │   ├── rag.js
│   │   │   └── components/
│   │   │       ├── upload-panel.js
│   │   │       └── document-list.js
│   │   │
│   │   ├── data/                 # RAG data storage
│   │   │   └── .gitkeep
│   │   │
│   │   └── README.md
│   │
│   ├── 03-agents/
│   │   ├── backend/
│   │   │   ├── app.py
│   │   │   ├── handler.py
│   │   │   ├── agent_system.py
│   │   │   └── tools/
│   │   │       ├── calculator.py
│   │   │       ├── web_search.py
│   │   │       └── code_executor.py
│   │   │
│   │   └── frontend/
│   │       ├── index.html        # Tool selection UI
│   │       ├── agents.css
│   │       └── agents.js
│   │
│   └── [future features...]
│
├── scripts/                      # Helper scripts
│   ├── run_feature.py           # Script to run specific feature
│   └── create_feature.py        # Template generator for new features
│
└── docker-compose.yml           # Run multiple features as services
```

## Implementation Examples

### Base Handler (base/backend/base_handler.py)
```python
from abc import ABC, abstractmethod
from base.backend.debug_logger import debug_logger, debug_track

class BaseChatHandler(ABC):
    """Base class all features inherit from"""
    
    def __init__(self):
        self.debug_logger = debug_logger
        
    @abstractmethod
    async def process_message(self, message: str, context: dict):
        """Each feature must implement this"""
        pass
    
    @debug_track("Base Message Validation")
    async def validate_message(self, message: str):
        """Common validation all features use"""
        if not message or len(message) > 10000:
            raise ValueError("Invalid message")
        return True
```

### Feature Backend (features/02-embeddings-rag/backend/app.py)
```python
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from fastapi import FastAPI, UploadFile
from base.backend.base_handler import BaseChatHandler
from base.backend.debug_logger import debug_track

from .handler import RAGHandler
from .document_processor import DocumentProcessor

app = FastAPI(title="RAG Feature API")

handler = RAGHandler()
doc_processor = DocumentProcessor()

@app.post("/api/chat")
async def chat(request):
    """RAG-enhanced chat"""
    return await handler.process_message(request.message, request.context)

@app.post("/api/upload")
async def upload_document(file: UploadFile):
    """RAG-specific endpoint"""
    return await doc_processor.process_upload(file)
```

### Base HTML Template (base/frontend/base.html)
```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}LLM Bootcamp{% endblock %}</title>
    <link rel="stylesheet" href="/base/frontend/base.css">
    {% block styles %}{% endblock %}
</head>
<body>
    <div class="app-container">
        {% block header %}
        <header class="header">
            <div class="logo">LLM Bootcamp</div>
            {% block header_content %}{% endblock %}
        </header>
        {% endblock %}
        
        {% block main_content %}
        <main class="main-content">
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages"></div>
            </div>
        </main>
        {% endblock %}
        
        {% block input_area %}
        <div class="input-container">
            <textarea id="messageInput"></textarea>
            <button id="sendButton">Send</button>
        </div>
        {% endblock %}
    </div>
    
    <script src="/base/frontend/base.js"></script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

### Feature HTML (features/02-embeddings-rag/frontend/index.html)
```html
{% extends "base.html" %}

{% block title %}RAG Chat - LLM Bootcamp{% endblock %}

{% block styles %}
<link rel="stylesheet" href="./rag.css">
{% endblock %}

{% block header_content %}
<div class="rag-controls">
    <button id="uploadBtn">Upload Document</button>
    <span class="doc-count">0 documents loaded</span>
</div>
{% endblock %}

{% block main_content %}
{{ super() }}
<aside class="rag-sidebar">
    <div class="upload-panel" id="uploadPanel">
        <h3>Upload Documents</h3>
        <input type="file" id="fileInput" multiple accept=".pdf,.txt,.md">
        <div class="upload-progress" id="uploadProgress"></div>
    </div>
    <div class="document-list" id="documentList">
        <h3>Document Library</h3>
        <ul id="docList"></ul>
    </div>
</aside>
{% endblock %}

{% block scripts %}
<script src="./rag.js"></script>
<script src="./components/upload-panel.js"></script>
<script src="./components/document-list.js"></script>
{% endblock %}
```

### Running Features

#### Option 1: Run Specific Feature
```bash
# Run vibe-check
cd features/01-vibe-check/backend
uvicorn app:app --reload --port 8001

# Run RAG
cd features/02-embeddings-rag/backend
uvicorn app:app --reload --port 8002
```

#### Option 2: Run Script
```bash
# Create a run script
python scripts/run_feature.py --feature 02-embeddings-rag --port 8002
```

#### Option 3: Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  vibe-check:
    build: ./features/01-vibe-check
    ports:
      - "8001:8000"
      
  rag:
    build: ./features/02-embeddings-rag
    ports:
      - "8002:8000"
    volumes:
      - ./features/02-embeddings-rag/data:/app/data
```

### Feature Creation Script
```python
# scripts/create_feature.py
import os
import shutil

def create_feature(feature_id, feature_name):
    """Create a new feature from template"""
    template_dir = "templates/feature_template"
    feature_dir = f"features/{feature_id}-{feature_name}"
    
    # Copy template
    shutil.copytree(template_dir, feature_dir)
    
    # Update placeholders
    for root, dirs, files in os.walk(feature_dir):
        for file in files:
            if file.endswith(('.py', '.js', '.html', '.md')):
                update_placeholders(os.path.join(root, file), feature_id, feature_name)
```

## Benefits

1. **Complete Isolation**: Each feature is fully self-contained
2. **Easy Testing**: Run features independently
3. **Clear Dependencies**: Each feature has its own requirements.txt
4. **UI Freedom**: Completely different UIs per feature
5. **Deployment Flexibility**: Deploy features separately
6. **Team Development**: Multiple people can work on different features
7. **Version Control**: Easy to see what changed per feature

## Migration from Current Structure

1. Move current code to `features/01-vibe-check/`
2. Extract shared code to `base/`
3. Update imports to use base modules
4. Each new homework creates a new feature folder
5. Features can override or extend base functionality