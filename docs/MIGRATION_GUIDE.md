# Migration Guide: From Monolithic to Modular

## Current State vs. Future State

### Current (Monolithic)
- Single `app.py` file with all logic
- One chat endpoint handles everything
- All features in one JavaScript file

### Future (Modular)
- Feature-specific folders and handlers
- Dynamic loading based on selection
- Clean separation of concerns

## Quick Start Options

### Option 1: Keep Current Structure (Easiest)
For now, you can keep everything in the existing files and just add conditional logic:

```python
# In existing app.py
@app.post("/api/chat")
async def chat(request: ChatRequest):
    feature_id = request.get("feature_id", "01-vibe-check")
    
    if feature_id == "01-vibe-check":
        # Current logic
    elif feature_id == "02-embeddings-rag":
        # RAG logic
        return await process_rag_chat(request)
```

### Option 2: Gradual Migration (Recommended)
1. Keep `app.py` as the main entry point
2. Create feature modules that it imports
3. Migrate one feature at a time

```python
# In app.py
from api.features.embeddings_rag import rag_handler

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if request.feature_id == "02-embeddings-rag":
        return await rag_handler.process(request)
    # ... existing logic for vibe-check
```

### Option 3: Full Modular (Long-term)
Use the complete structure from PROJECT_STRUCTURE.md

## Simple Frontend Update

Add one line to your existing `streamChat` method:

```javascript
body: JSON.stringify({
    user_message: message,
    developer_message: this.developerMessage,
    api_key: this.apiKey,
    model: this.currentModel,
    feature_id: this.currentFeature  // ADD THIS LINE
})
```

## For Your Next Homework (RAG)

### Minimal Approach:
1. Add to existing `app.py`:
```python
@debug_track("Loading Document for RAG")
async def load_document(file_content: str):
    # Process document
    return chunks

@debug_track("Searching Context")
async def search_context(query: str, chunks: list):
    # Find relevant chunks
    return context

# In your chat endpoint:
if request.feature_id == "02-embeddings-rag":
    context = await search_context(request.user_message, stored_chunks)
    enhanced_message = f"Context: {context}\n\nQuestion: {request.user_message}"
    # Continue with existing OpenAI call
```

2. Add upload button handler in JavaScript:
```javascript
if (this.currentFeature === '02-embeddings-rag') {
    // Show upload button
    this.uploadFileBtn.style.display = 'flex';
}
```

### Modular Approach:
Create `api/features/embeddings_rag/handler.py` and import it

## Benefits of Each Approach

**Monolithic + Conditionals:**
- ✅ Fastest to implement
- ✅ No file restructuring needed
- ❌ Gets messy with many features
- ❌ Harder to test individual features

**Gradual Migration:**
- ✅ Balance of clean code and practicality
- ✅ Can migrate one feature at a time
- ✅ Easier collaboration
- ❌ Some duplication during transition

**Full Modular:**
- ✅ Cleanest separation
- ✅ Best for team development
- ✅ Easiest to test
- ❌ Most upfront work

## Recommendation

For your bootcamp homework:
1. Start with Option 1 (conditionals in existing files)
2. When adding RAG, create a separate `rag_utils.py` file
3. Import and use those utilities in main `app.py`
4. Gradually extract more as you add features

This gives you working code quickly while moving toward better organization!