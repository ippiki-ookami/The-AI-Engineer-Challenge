# 🏗️ Homework Isolation Architecture

## 🎯 **Design Philosophy**

The LLM Bootcamp platform uses **complete code isolation** between homework assignments while providing a **seamless user experience**. Each homework is a self-contained module that doesn't interfere with others.

## 📁 **Project Structure**

```
LLM-Bootcamp/
├── api/
│   └── homework_app.py           # Unified backend router
├── base/
│   ├── backend/
│   │   ├── base_handler.py       # Shared base classes
│   │   └── debug_logger.py       # Debug tracking system
│   └── frontend/
│       ├── base.css              # Shared styles
│       └── base.js               # Base chat interface
├── features/                     # 🔥 ISOLATED HOMEWORK CODE
│   ├── 01-vibe-check/
│   │   └── backend/
│   │       └── handler.py        # VibeCheckHandler
│   └── 02-embeddings-rag/
│       ├── backend/
│       │   └── handler.py        # RAGHandler
│       └── frontend/
│           ├── rag.css           # RAG-specific styles
│           └── rag.js            # Upload functionality
├── frontend/
│   ├── unified.html              # Main interface
│   └── homework-platform.js     # Dynamic module loading
└── scripts/
    └── run_feature.py            # Development server
```

## 🔄 **Isolation Mechanisms**

### 1. **Backend Isolation**

#### **Dynamic Handler Loading**
```python
def load_homework_handler(feature_id: str):
    """Dynamically load isolated homework handlers"""
    
    # Build path to handler module
    handler_path = project_root / f"features/{feature_id}/backend/handler.py"
    
    # Dynamic import (completely isolated)
    spec = importlib.util.spec_from_file_location(f"{feature_id}_handler", handler_path)
    handler_module = importlib.util.module_from_spec(spec)
    
    # Instantiate isolated handler
    handler_class = getattr(handler_module, info["handler_class"])
    return handler_class()
```

#### **Per-Homework Routing**
```python
@app.post("/api/chat")
async def homework_chat(request: ChatRequest):
    # Route to specific isolated homework handler
    handler = load_homework_handler(request.feature_id)
    return StreamingResponse(handler.process_chat(request))
```

### 2. **Frontend Isolation**

#### **Dynamic Module Loading**
```javascript
class HomeworkPlatform {
    async loadHomeworkModules(homeworkId) {
        // Clean up previous homework
        this.cleanupPreviousHomework();
        
        // Load homework-specific CSS
        await this.loadHomeworkCSS(homeworkId);
        
        // Load homework-specific JavaScript
        await this.loadHomeworkJS(homeworkId);
        
        // Initialize homework manager
        this.initializeHomeworkManager(homeworkId);
    }
}
```

#### **Homework-Specific Managers**
```javascript
// RAG homework loads its own manager
if (homeworkId === '02-embeddings-rag' && window.RAGManager) {
    this.ragManager = new window.RAGManager();
}
```

### 3. **Static File Isolation**

#### **Per-Homework Static Mounting**
```python
# Mount individual homework static files
for feature_id, info in HOMEWORK_FEATURES.items():
    if info["enabled"]:
        feature_frontend_path = project_root / info["path"].replace("/backend", "/frontend")
        app.mount(
            f"/features/{feature_id}", 
            StaticFiles(directory=str(feature_frontend_path)), 
            name=f"homework_{feature_id}"
        )
```

## 🔀 **Seamless Switching**

### **User Experience Flow**
1. **User selects homework** from dropdown
2. **Previous homework cleanup** (CSS, JS, managers)
3. **Dynamic loading** of new homework assets
4. **Initialization** of homework-specific functionality
5. **UI update** to reflect new homework context

### **State Management**
```javascript
async switchHomework(homeworkId) {
    // Validate homework availability
    if (!this.homework[homeworkId]?.enabled) return;
    
    // Load isolated modules
    await this.loadHomeworkModules(homeworkId);
    
    // Apply homework settings
    this.applyHomeworkSettings(homeworkId);
    
    // Clear chat (no confirmation dialog)
    this.clearChatSilent();
    
    // Update UI context
    this.updateWelcomeMessage(homework);
}
```

## 🧩 **Inheritance vs Isolation**

### **What's Shared (Base Classes)**
- ✅ **Debug tracking system** (`debug_logger.py`)
- ✅ **Base chat interface** (`base.js`, `base.css`)
- ✅ **Core UI components** (modals, buttons, themes)
- ✅ **Authentication** (API key validation)
- ✅ **Streaming infrastructure** (SSE, OpenAI integration)

### **What's Isolated (Per Homework)**
- 🔒 **Business logic** (handlers, processing)
- 🔒 **Feature-specific UI** (upload buttons, search)
- 🔒 **Custom styling** (homework themes)
- 🔒 **Specialized endpoints** (file upload, search)
- 🔒 **Debug tracking content** (different functions tracked)

## 📊 **Debug Tracking Architecture**

### **Shared Debug Infrastructure**
```python
# Base debug decorator used by all homework
@debug_track("Function Description")
async def homework_function():
    # Automatic tracking of:
    # - Function start/end
    # - Arguments (safely serialized)
    # - Results (safely serialized)
    # - Errors (full traceback)
    pass
```

### **Homework-Specific Debug Content**

| Homework | Debug Functions | Focus |
|----------|----------------|--------|
| **01 - Vibe Check** | 3-second test, parallel failure test, basic chat | **Educational tests** |
| **02 - RAG** | Document upload, search, content processing | **Document workflows** |
| **03+ - Future** | Feature-specific operations | **Advanced concepts** |

## 🚀 **Development Workflow**

### **Adding New Homework**

#### 1. **Create Folder Structure**
```bash
mkdir -p features/03-new-homework/backend
mkdir -p features/03-new-homework/frontend
```

#### 2. **Implement Handler**
```python
# features/03-new-homework/backend/handler.py
class NewHomeworkHandler(BaseChatHandler):
    def __init__(self):
        super().__init__("New Homework")
    
    @debug_track("Homework-Specific Function")
    async def homework_function(self):
        # Isolated homework logic
        pass
```

#### 3. **Create Frontend Assets** (Optional)
```css
/* features/03-new-homework/frontend/new-homework.css */
.homework-specific-styles { }
```

```javascript
// features/03-new-homework/frontend/new-homework.js
class NewHomeworkManager {
    init() {
        // Homework-specific UI logic
    }
}
window.NewHomeworkManager = NewHomeworkManager;
```

#### 4. **Enable in Configuration**
```python
# api/homework_app.py
HOMEWORK_FEATURES = {
    "03-new-homework": {
        "name": "New Homework",
        "handler_class": "NewHomeworkHandler",
        "enabled": True  # 🔥 Enable the homework
    }
}
```

#### 5. **Update Frontend Loading** (If Custom Assets)
```javascript
// frontend/homework-platform.js
initializeHomeworkManager(homeworkId) {
    if (homeworkId === '03-new-homework' && window.NewHomeworkManager) {
        this.newHomeworkManager = new window.NewHomeworkManager();
    }
}
```

## 🔧 **Benefits of This Architecture**

### **For Development**
- ✅ **No code conflicts** between homework assignments
- ✅ **Easy to add new homework** without breaking existing ones
- ✅ **Clear separation of concerns**
- ✅ **Independent testing** of each homework
- ✅ **Modular deployment** options

### **For Education**
- ✅ **Focus on specific concepts** per homework
- ✅ **Progressive complexity** without baggage
- ✅ **Clear code organization** for learning
- ✅ **Debug transparency** for each homework's unique processes

### **For Production**
- ✅ **Unified user experience** despite code isolation
- ✅ **Scalable architecture** for many homework assignments
- ✅ **Easy maintenance** and updates
- ✅ **Flexible deployment** (individual or unified)

## 🎯 **Key Principles**

1. **🔒 Complete Isolation**: No shared state between homework assignments
2. **🔄 Seamless UX**: Users switch homework without page reloads
3. **📊 Debug Transparency**: Every homework shows its unique processes
4. **🏗️ Inheritance Where Helpful**: Share infrastructure, isolate business logic
5. **⚡ Dynamic Loading**: Only load what's needed when it's needed
6. **🧪 Educational Focus**: Architecture serves learning objectives

This architecture ensures that each homework assignment is a **clean slate** for learning new concepts while maintaining a **professional, unified interface** for the best educational experience.