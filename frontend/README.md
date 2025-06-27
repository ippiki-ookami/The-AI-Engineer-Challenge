# LLM Bootcamp Chat Interface

A sleek, futuristic chat interface designed for learning LLM techniques such as RAG, prompt engineering, and more.

## Features

- 🎨 **Modern UI**: Sleek, futuristic design with smooth animations
- 🤖 **Multi-Model Support**: Switch between GPT-4.1 Mini, GPT-4o, and GPT-3.5 Turbo
- 🔑 **Secure API Key Management**: Local storage with validation
- ⚙️ **Customizable Settings**: Theme, default model, and system prompts
- 📤 **Export Conversations**: Save your learning sessions as JSON
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⌨️ **Keyboard Shortcuts**: Quick access to common actions
- 🔄 **Real-time Streaming**: See AI responses as they're generated

## Quick Start

### Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Backend Server**: Make sure the FastAPI backend is running (see `/api/README.md`)

### Running the Application

**Both servers need to be running simultaneously:**

1. **Start the Backend API Server** (Terminal 1):
   ```bash
   cd api
   pip install -r requirements.txt
   python app.py
   ```
   The API will be available at `http://localhost:8000`

2. **Start the Frontend Server** (Terminal 2):
   ```bash
   cd frontend
   python -m http.server 3000
   ```
   The frontend will be available at `http://localhost:3000`

3. **Configure Your API Key**:
   - Open your browser and go to `http://localhost:3000`
   - Enter your OpenAI API key in the input field
   - Click "Save" to store it securely in your browser

4. **Start Chatting**:
   - Choose your preferred model from the dropdown
   - Type your message and press Enter to send
   - Use Shift+Enter for new lines

## Usage Guide

### Basic Chatting
- Type your message in the input field at the bottom
- Press Enter to send, Shift+Enter for new lines
- The AI will respond with streaming text

### Model Selection
- Use the dropdown in the header to switch between models
- Different models have different capabilities and costs
- Settings are saved automatically

### Settings
- Click the gear icon (⚙️) to open settings
- Customize your system prompt for different learning scenarios
- Change themes between dark and light
- Set your default model

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus on message input
- `Ctrl/Cmd + L`: Clear chat history
- `Escape`: Close modals
- `Enter`: Send message
- `Shift + Enter`: New line

### Exporting Conversations
- Click the download icon (📥) to export your chat
- Conversations are saved as JSON files
- Includes timestamp, model used, and full conversation history

### File Upload (Future Feature)
- Click the upload icon (📁) to upload files
- Currently shows a placeholder message
- Future versions will support RAG with uploaded documents

## Learning Scenarios

### Prompt Engineering
1. Set different system prompts in settings
2. Test how the AI responds to different instructions
3. Experiment with various prompt formats

### RAG (Retrieval-Augmented Generation)
1. Upload relevant documents (when implemented)
2. Ask questions about the uploaded content
3. Compare responses with and without context

### Model Comparison
1. Switch between different models
2. Ask the same question to different models
3. Compare response quality and speed

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with modern CSS (Port 3000)
- **Backend**: FastAPI with OpenAI integration (Port 8000)
- **Communication**: RESTful API with streaming responses
- **Storage**: Local browser storage for settings and API key

### Server Configuration
- **Frontend Server**: `http://localhost:3000` (serves static files)
- **Backend API**: `http://localhost:8000` (handles API requests)
- **API Endpoints**: 
  - `GET /api/health` - Health check
  - `POST /api/chat` - Chat completion with streaming

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

### Security
- API keys stored locally in browser
- No server-side storage of sensitive data
- HTTPS recommended for production use

## Troubleshooting

### Common Issues

**"API server may not be running"**
- Make sure the backend server is started on port 8000
- Check that it's running with `python app.py` in the `/api` directory
- Verify the API health endpoint responds at `http://localhost:8000/api/health`

**"Invalid API key format"**
- Ensure your API key starts with `sk-`
- Get a new key from OpenAI if needed
- Check for extra spaces or characters

**Messages not sending**
- Verify your API key is saved
- Check your internet connection
- Ensure both servers are running (frontend on 3000, backend on 8000)

**404 errors on API calls**
- Make sure the backend server is running on port 8000
- Check that the frontend is configured to call `http://localhost:8000/api/*`
- Verify CORS is enabled on the backend

**Styling issues**
- Clear browser cache
- Try a different browser
- Check for browser extensions that might interfere

### Getting Help

1. Check the browser console for error messages
2. Verify both servers are running and accessible
3. Test the API directly: `curl http://localhost:8000/api/health`
4. Try refreshing the page

## Development

### File Structure
```
frontend/
├── index.html      # Main HTML file
├── styles.css      # CSS styles and animations
├── script.js       # JavaScript functionality
└── README.md       # This file
```

### Customization
- Modify `styles.css` for visual changes
- Edit `script.js` for functionality changes
- Update `index.html` for structural changes
- Change `apiBaseUrl` in `script.js` if using different backend URL

### Adding Features
- The modular JavaScript class structure makes it easy to extend
- Add new methods to the `ChatInterface` class
- Update the UI in the HTML and CSS files

## License

This project is part of The AI Engineer Challenge.