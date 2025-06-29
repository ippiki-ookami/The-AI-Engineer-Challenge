<p align = "center" draggable=”false” ><img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" 
     width="200px"
     height="auto"/>
</p>


## <h1 align="center" id="heading"> 👋 Welcome to the AI Engineer Challenge</h1>

## 🎓 LLM Bootcamp - Modular Learning Platform

> **New!** This repository has evolved into a comprehensive **modular learning platform** with multiple homework assignments. Each feature builds upon previous knowledge while maintaining complete isolation for focused learning.

> If you are a novice, and need a bit more help to get your dev environment off the ground, check out this [Setup Guide](docs/GIT_SETUP.md). This guide will walk you through the 'git' setup you need to get started.

> For additional context on LLM development environments and API key setup, you can also check out our [Interactive Dev Environment for LLM Development](https://github.com/AI-Maker-Space/Interactive-Dev-Environment-for-AI-Engineers).

## 🚀 Quick Start - Choose Your Learning Path

### **Option 1: Unified Platform (Recommended for Sharing)**
**All homework in one app with seamless dropdown switching:**

```bash
# Install dependencies
pip install fastapi uvicorn openai python-multipart

# Run unified platform with all homework
python scripts/run_feature.py --unified

# Open http://localhost:8000 and switch homework via dropdown!
```

### **Option 2: Individual Homework (Best for Development)**
**Focus on one homework at a time:**

```bash
# Run specific homework in isolation
python scripts/run_feature.py --feature 01-vibe-check

# Each homework runs independently
```

## 🏗️ Modular Architecture

```
features/
├── 01-vibe-check/            ✅ Basic chat with debug panel
├── 02-embeddings-rag/        🚧 RAG with document upload  
├── 03-agents/                🚧 Multi-agent systems
├── 04-fine-tuning/           🚧 Model fine-tuning
└── 05-multimodal/            🚧 Image + text processing
```

Each feature is completely self-contained with its own frontend, backend, and documentation!

## 🎯 Learning Path

### **Option A: Quick Learning (Recommended)**
Use the modular platform to learn through structured homework assignments:

1. **01 - Vibe Check**: Master the basics with debug panel
2. **02 - Embeddings and RAG**: Document upload and retrieval 
3. **03 - AI Agents**: Tool usage and multi-step reasoning
4. **04 - Fine Tuning**: Custom model training
5. **05 - Multimodal**: Vision + language understanding

### **Option B: Original Challenge** 
Follow the original vibe-coding tutorial below to build from scratch.

Are you ready? Let's get started!

<details>
  <summary>🖥️ Accessing "gpt-4.1-mini" (ChatGPT) like a developer</summary>

1. Head to [this notebook](https://colab.research.google.com/drive/1sT7rzY_Lb1_wS0ELI1JJfff0NUEcSD72?usp=sharing) and follow along with the instructions!

2. Complete the notebook and try out your own system/assistant messages!

That's it! Head to the next step and start building your application!

</details>


<details>
  <summary>🏗️ Forking & Cloning This Repository</summary>

Before you begin, make sure you have:

1. 👤 A GitHub account (you'll need to replace `YOUR_GITHUB_USERNAME` with your actual username)
2. 🔧 Git installed on your local machine
3. 💻 A code editor (like Cursor, VS Code, etc.)
4. ⌨️ Terminal access (Mac/Linux) or Command Prompt/PowerShell (Windows)
5. 🔑 A GitHub Personal Access Token (for authentication)

Got everything in place? Let's move on!

1. Fork [this](https://github.com/AI-Maker-Space/The-AI-Engineer-Challenge) repo!

     ![image](https://i.imgur.com/bhjySNh.png)

1. Clone your newly created repo.

     ``` bash
     # First, navigate to where you want the project folder to be created
     cd PATH_TO_DESIRED_PARENT_DIRECTORY

     # Then clone (this will create a new folder called The-AI-Engineer-Challenge)
     git clone git@github.com:<YOUR GITHUB USERNAME>/The-AI-Engineer-Challenge.git
     ```

     > Note: This command uses SSH. If you haven't set up SSH with GitHub, the command will fail. In that case, use HTTPS by replacing `git@github.com:` with `https://github.com/` - you'll then be prompted for your GitHub username and personal access token.

2. Verify your git setup:

     ```bash
     # Check that your remote is set up correctly
     git remote -v

     # Check the status of your repository
     git status

     # See which branch you're on
     git branch
     ```

     <!-- > Need more help with git? Check out our [Detailed Git Setup Guide](docs/GIT_SETUP.md) for a comprehensive walkthrough of git configuration and best practices. -->

3. Open the freshly cloned repository inside Cursor!

     ```bash
     cd The-AI-Engineering-Challenge
     cursor .
     ```

4. Check out the existing backend code found in `/api/app.py`

</details>

<details>
  <summary>🔥Setting Up for Vibe Coding Success </summary>

While it is a bit counter-intuitive to set things up before jumping into vibe-coding - it's important to remember that there exists a gradient betweeen AI-Assisted Development and Vibe-Coding. We're only reaching *slightly* into AI-Assisted Development for this challenge, but it's worth it!

1. Check out the rules in `.cursor/rules/` and add theme-ing information like colour schemes in `frontend-rule.mdc`! You can be as expressive as you'd like in these rules!
2. We're going to index some docs to make our application more likely to succeed. To do this - we're going to start with `CTRL+SHIFT+P` (or `CMD+SHIFT+P` on Mac) and we're going to type "custom doc" into the search bar. 

     ![image](https://i.imgur.com/ILx3hZu.png)
3. We're then going to copy and paste `https://nextjs.org/docs` into the prompt.

     ![image](https://i.imgur.com/psBjpQd.png)

4. We're then going to use the default configs to add these docs to our available and indexed documents.

     ![image](https://i.imgur.com/LULLeaF.png)

5. After that - you will do the same with Vercel's documentation. After which you should see:

     ![image](https://i.imgur.com/hjyXhhC.png) 

</details>

<details>
  <summary>😎 Vibe Coding a Front End for the FastAPI Backend</summary>

1. Use `Command-L` or `CTRL-L` to open the Cursor chat console. 

2. Set the chat settings to the following:

     ![image](https://i.imgur.com/LSgRSgF.png)

3. Ask Cursor to create a frontend for your application. Iterate as much as you like!

4. Run the frontend using the instructions Cursor provided. 

> NOTE: If you run into any errors, copy and paste them back into the Cursor chat window - and ask Cursor to fix them!

> NOTE: You have been provided with a backend in the `/api` folder - please ensure your Front End integrates with it!

</details>

<details>
  <summary>🚀 Deploying Your First LLM-powered Application with Vercel</summary>

1. Ensure you have signed into [Vercel](https://vercel.com/) with your GitHub account.

2. Ensure you have `npm` (this may have been installed in the previous vibe-coding step!) - if you need help with that, ask Cursor!

3. Run the command:

     ```bash
     npm install -g vercel
     ```

4. Run the command:

     ```bash
     vercel
     ```

5. Follow the in-terminal instructions. (Below is an example of what you will see!)

     ![image](https://i.imgur.com/D1iKGCq.png)

6. Once the build is completed - head to the provided link and try out your app!

> NOTE: Remember, if you run into any errors - ask Cursor to help you fix them!

</details>

### Vercel Link to Share

You'll want to make sure you share you *domains* hyperlink to ensure people can access your app!

![image](https://i.imgur.com/mpXIgIz.png)

> NOTE: Test this is the public link by trying to open your newly deployed site in an Incognito browser tab!

### 🎉 Congratulations! 

You just deployed your first LLM-powered application! 🚀🚀🚀 Get on linkedin and post your results and experience! Make sure to tag us at @AIMakerspace!

Here's a template to get your post started!

```
🚀🎉 Exciting News! 🎉🚀

🏗️ Today, I'm thrilled to announce that I've successfully built and shipped my first-ever LLM using the powerful combination of , and the OpenAI API! 🖥️

Check it out 👇
[LINK TO APP]

A big shoutout to the @AI Makerspace for all making this possible. Couldn't have done it without the incredible community there. 🤗🙏

Looking forward to building with the community! 🙌✨ Here's to many more creations ahead! 🥂🎉

Who else is diving into the world of AI? Let's connect! 🌐💡

#FirstLLMApp 
```

---

## 🎓 Advanced Learning: Modular Homework Platform

### Ready for More? Explore Structured Learning!

After completing the original challenge, dive deeper with our modular homework platform:

#### 🔧 Available Features

| Feature | Status | Description | Port |
|---------|--------|-------------|------|
| **01 - Vibe Check** | ✅ Ready | Basic chat with debug panel | 8000 |
| **02 - Embeddings and RAG** | 🚧 Coming Soon | Document upload and retrieval | 8001 |
| **03 - AI Agents** | 🚧 Coming Soon | Multi-agent systems | 8002 |
| **04 - Fine Tuning** | 🚧 Coming Soon | Custom model training | 8003 |
| **05 - Multimodal** | 🚧 Coming Soon | Vision + language | 8004 |

#### 🚀 Running Features

```bash
# List all available homework
python scripts/run_feature.py --list

# UNIFIED: All homework in one app (recommended for sharing)
python scripts/run_feature.py --unified

# INDIVIDUAL: Run specific homework (recommended for development)
python scripts/run_feature.py --feature 01-vibe-check

# Custom port
python scripts/run_feature.py --unified --port 8080
```

#### 🎯 What You'll Learn

**01 - Vibe Check (Start Here!)**
- LLM API fundamentals
- Real-time streaming responses  
- Debug panel for observability
- System prompt engineering
- Frontend/backend integration

**02 - Embeddings and RAG**
- Document processing pipelines
- Vector embeddings and search
- Retrieval-augmented generation
- Context injection strategies

**03 - AI Agents**
- Function calling and tool usage
- Multi-step reasoning
- Agent orchestration
- Error handling and recovery

**04 - Fine Tuning**
- Dataset preparation
- Model training workflows
- Evaluation and comparison
- Deployment optimization

**05 - Multimodal**
- Vision-language models
- Image understanding
- Cross-modal reasoning
- Multimodal prompt design

#### 🎨 Educational Features

Every homework includes:
- 🔍 **Debug Panel**: See exactly how LLM processing works
- 🎨 **Modern UI**: Dark/light themes, responsive design
- ⚡ **Real-time Streaming**: Watch responses generate live
- 📁 **Export**: Save conversations for review
- ⌨️ **Shortcuts**: Efficient keyboard navigation
- 📚 **Documentation**: Comprehensive learning guides

#### 💡 Getting Started with Features

1. **Pick your starting point**:
   ```bash
   python scripts/run_feature.py --feature 01-vibe-check
   ```

2. **Enter your OpenAI API key** when prompted

3. **Explore the debug panel** - it's educational magic! ✨

4. **Try the special commands**:
   - Type "vibe check" in 01-vibe-check for fun responses
   - Use `Ctrl+K` to focus input, `Ctrl+L` to clear chat
   - Navigate debug entries with arrow keys

5. **Progress through features** as they become available

Each feature builds upon the previous, creating a comprehensive learning journey from basic chat to advanced AI systems!

### 🤝 Contributing New Features

Want to add a homework assignment? 

1. Copy the `features/01-vibe-check/` structure
2. Implement your `FeatureHandler` extending `BaseChatHandler`
3. Create feature-specific UI extending `BaseChatInterface`
4. Add to `scripts/run_feature.py`
5. Document learning objectives

Perfect for educators creating AI curriculum! 👨‍🏫👩‍🏫
