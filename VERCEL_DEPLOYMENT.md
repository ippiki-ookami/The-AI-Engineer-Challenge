# 🚀 Vercel Deployment Guide

## 🎯 **Quick Deployment**

Your unified homework platform is ready for Vercel! Here's everything you need to deploy:

```bash
# Deploy the unified platform
vercel

# Your homework assignments will be available at:
# https://your-app.vercel.app
```

## ⚙️ **Current Configuration**

### **Vercel Config** (`vercel.json`)
```json
{
    "functions": {
        "api/homework_app.py": {
            "runtime": "python3.9"
        }
    },
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "/api/homework_app.py"
        },
        {
            "src": "/(.*)",
            "dest": "/frontend/unified.html"
        }
    ]
}
```

### **What Gets Deployed**
- ✅ **Unified homework platform** (`api/homework_app.py`)
- ✅ **All homework assignments** (01-vibe-check, 02-embeddings-rag)
- ✅ **Complete code isolation** maintained in production
- ✅ **Document upload functionality** for RAG homework
- ✅ **Real-time debug panel** for all homework

## 📋 **Requirements for Production**

### **Python Dependencies** (`requirements.txt`)
The `vercel.json` already points to the correct backend. Ensure these dependencies are in your `pyproject.toml`:

```toml
[project]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn>=0.24.0",
    "openai>=1.3.0",
    "python-multipart>=0.0.20",  # 🔥 Required for file uploads
    "pydantic>=2.5.0"
]
```

### **Environment Variables**
Set these in your Vercel dashboard:

```bash
# No environment variables needed!
# Users provide their own OpenAI API keys via the UI
```

## 🏗️ **Deployment Architecture**

### **Production Structure**
```
Production Deployment:
├── api/homework_app.py           # 🎯 Main FastAPI app
├── features/                     # 🔒 Isolated homework code
│   ├── 01-vibe-check/backend/    # Vibe check handler
│   └── 02-embeddings-rag/       # RAG handler + frontend assets
├── base/                         # 🏗️ Shared infrastructure
│   ├── backend/                  # Base handlers, debug system
│   └── frontend/                 # Base CSS, JS
└── frontend/                     # 🎨 Unified interface
    ├── unified.html              # Main UI
    └── homework-platform.js      # Dynamic loading
```

### **Request Flow in Production**
1. **User visits** `https://your-app.vercel.app`
2. **Serves** `/frontend/unified.html` (unified interface)
3. **User selects homework** from dropdown
4. **Loads homework assets** dynamically from `/features/`
5. **API calls route** to appropriate isolated homework handler
6. **Complete isolation** maintained in production environment

## 🔧 **Vercel-Specific Features**

### **Static File Serving**
```python
# Automatic static file mounting for all homework
for feature_id, info in HOMEWORK_FEATURES.items():
    if info["enabled"]:
        app.mount(f"/features/{feature_id}", StaticFiles(...))
```

### **Serverless Function**
- ✅ **Single function** handles all homework assignments
- ✅ **Dynamic routing** to isolated handlers  
- ✅ **File upload support** via `python-multipart`
- ✅ **Real-time streaming** via Server-Sent Events

### **Edge Network Benefits**
- ✅ **Fast global access** to your homework platform
- ✅ **Automatic HTTPS** for secure API key transmission
- ✅ **CDN caching** for static assets (CSS, JS)

## 📊 **Production Features**

### **Available in Production**
- ✅ **All homework assignments** accessible via dropdown
- ✅ **Document upload** for RAG homework (up to Vercel limits)
- ✅ **Real-time debug panel** for educational transparency
- ✅ **Theme switching** (dark/light mode)
- ✅ **API key validation** and secure storage
- ✅ **Complete homework isolation** maintained

### **Homework-Specific Features**

| Homework | Production Status | Features Available |
|----------|------------------|-------------------|
| **01 - Vibe Check** | ✅ Fully Functional | Basic chat, 3-second test, parallel failure test, debug tracking |
| **02 - Embeddings RAG** | ✅ Fully Functional | Document upload, search, content processing, debug tracking |
| **03+ - Future** | 🚧 Ready for Addition | Add new homework without redeployment |

## 🔄 **Deployment Workflow**

### **Initial Deployment**
```bash
# 1. Ensure you're in project root
cd /path/to/LLM-Bootcamp

# 2. Deploy to Vercel
vercel

# 3. Follow prompts:
#    - Project name: llm-bootcamp-homework
#    - Framework: Other
#    - Root directory: ./
#    - Build command: (leave empty)
#    - Output directory: (leave empty)
```

### **Updates and Redeployment**
```bash
# Deploy updates
vercel --prod

# Or automatic deployment via Git integration
git push origin main  # Auto-deploys if connected
```

## 🎓 **User Experience in Production**

### **Perfect for Showcasing**
- **Professional interface** with dark theme
- **Seamless homework switching** via dropdown
- **Educational transparency** through debug panel
- **Complete feature isolation** prevents interference

### **Demo Flow**
1. **Visit your Vercel URL**
2. **Enter OpenAI API key** (stored securely in browser)
3. **Select "01 - Vibe Check"** to show basic functionality
4. **Switch to "02 - Embeddings and RAG"** to demonstrate document upload
5. **Upload a document** and show processing in debug panel
6. **Search uploaded documents** to show retrieval functionality

## 🛠️ **Troubleshooting**

### **Build Issues**
```bash
# If deployment fails, check:
# 1. Python version in vercel.json (currently python3.9)
# 2. Dependencies in pyproject.toml
# 3. File paths are correct (no absolute paths)
```

### **Static File Issues**
```bash
# If homework assets don't load:
# 1. Check feature is enabled in HOMEWORK_FEATURES
# 2. Verify files exist in features/*/frontend/
# 3. Check static file mounting in homework_app.py
```

### **File Upload Issues**
```bash
# If document upload fails:
# 1. Ensure python-multipart is in dependencies
# 2. Check Vercel function size limits
# 3. Verify file type validation
```

## 🎯 **Production Checklist**

### **Pre-Deployment**
- ✅ Test unified platform locally: `python scripts/run_feature.py --unified`
- ✅ Verify both homework assignments work
- ✅ Test document upload in RAG homework
- ✅ Confirm debug panel shows different content per homework
- ✅ Check theme switching works
- ✅ Test API key validation

### **Post-Deployment**
- ✅ Visit Vercel URL and verify interface loads
- ✅ Test homework switching via dropdown
- ✅ Upload document in RAG homework
- ✅ Verify debug panel works in production
- ✅ Test with actual OpenAI API key

## 🚀 **Scaling for More Homework**

### **Adding Homework 03+**
The architecture supports unlimited homework assignments:

```python
# Just add to HOMEWORK_FEATURES and redeploy
"03-agents": {
    "name": "AI Agents",
    "handler_class": "AgentHandler", 
    "enabled": True  # 🔥 Enable when ready
}
```

### **No Code Changes Needed**
- ✅ **Dynamic routing** automatically handles new homework
- ✅ **Frontend loading** adapts to new homework IDs
- ✅ **Static file mounting** automatically includes new assets
- ✅ **Debug tracking** works out of the box

---

**Result**: A production-ready homework platform showcasing complete code isolation with seamless user experience! 🎓✨

**Perfect for**: Portfolio demonstrations, educational showcases, LLM bootcamp presentations, and scalable homework platforms.