#!/usr/bin/env python3
"""
Feature Runner Script
Easily run specific homework features with proper configuration
"""
import argparse
import sys
import os
import subprocess
from pathlib import Path


# Available features
FEATURES = {
    "01-vibe-check": {
        "name": "Vibe Check",
        "description": "Basic LLM chat interface with debug panel",
        "backend_path": "features/01-vibe-check/backend",
        "app_module": "app:app",
        "default_port": 8000,
        "enabled": True
    },
    "02-embeddings-rag": {
        "name": "Embeddings and RAG",
        "description": "RAG implementation with document upload and vector search",
        "backend_path": "features/02-embeddings-rag/backend",
        "app_module": "app:app", 
        "default_port": 8001,
        "enabled": True
    },
    "03-agents": {
        "name": "AI Agents",
        "description": "Multi-agent system with tool usage",
        "backend_path": "features/03-agents/backend",
        "app_module": "app:app",
        "default_port": 8002,
        "enabled": False
    },
    "04-fine-tuning": {
        "name": "Fine Tuning", 
        "description": "Fine-tuned model comparison and testing",
        "backend_path": "features/04-fine-tuning/backend",
        "app_module": "app:app",
        "default_port": 8003,
        "enabled": False
    },
    "05-multimodal": {
        "name": "Multimodal LLMs",
        "description": "Image and text understanding with multimodal models",
        "backend_path": "features/05-multimodal/backend", 
        "app_module": "app:app",
        "default_port": 8004,
        "enabled": False
    }
}


def get_project_root():
    """Get the project root directory"""
    script_dir = Path(__file__).parent
    return script_dir.parent


def list_features():
    """List all available features"""
    print("📚 Available LLM Bootcamp Features:\n")
    
    for feature_id, info in FEATURES.items():
        status = "✅ Ready" if info["enabled"] else "🚧 Coming Soon"
        print(f"  {feature_id:<20} {info['name']:<20} {status}")
        print(f"  {'':<20} {info['description']}")
        print(f"  {'':<20} Port: {info['default_port']}\n")


def validate_feature(feature_id):
    """Validate that a feature exists and is enabled"""
    if feature_id not in FEATURES:
        print(f"❌ Error: Feature '{feature_id}' not found.")
        print("\nAvailable features:")
        list_features()
        return False
    
    if not FEATURES[feature_id]["enabled"]:
        print(f"❌ Error: Feature '{feature_id}' is not yet implemented.")
        print(f"   {FEATURES[feature_id]['description']}")
        print("\nEnable features are:")
        for fid, info in FEATURES.items():
            if info["enabled"]:
                print(f"   {fid} - {info['name']}")
        return False
        
    return True


def run_feature(feature_id, port=None, reload=True, host="0.0.0.0"):
    """Run a specific feature"""
    if not validate_feature(feature_id):
        return False
    
    feature_info = FEATURES[feature_id]
    port = port or feature_info["default_port"]
    
    # Get paths
    project_root = get_project_root()
    backend_path = project_root / feature_info["backend_path"]
    
    # Validate backend exists
    if not backend_path.exists():
        print(f"❌ Error: Backend path not found: {backend_path}")
        return False
    
    app_file = backend_path / "app.py"
    if not app_file.exists():
        print(f"❌ Error: App file not found: {app_file}")
        return False
    
    print(f"🚀 Starting {feature_info['name']} ({feature_id})")
    print(f"📁 Backend path: {backend_path}")
    print(f"🌐 URL: http://localhost:{port}")
    print(f"📖 Description: {feature_info['description']}")
    print(f"\n{'='*60}")
    print(f"   Press Ctrl+C to stop the server")
    print(f"{'='*60}\n")
    
    # Build uvicorn command
    cmd = [
        sys.executable, "-m", "uvicorn",
        feature_info["app_module"],
        "--host", host,
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    # Change to backend directory and run
    try:
        os.chdir(backend_path)
        result = subprocess.run(cmd)
        return result.returncode == 0
    except KeyboardInterrupt:
        print(f"\n\n✅ {feature_info['name']} stopped successfully!")
        return True
    except Exception as e:
        print(f"❌ Error running feature: {e}")
        return False


def install_dependencies(feature_id):
    """Install dependencies for a specific feature"""
    if not validate_feature(feature_id):
        return False
    
    feature_info = FEATURES[feature_id]
    project_root = get_project_root()
    feature_dir = project_root / feature_info["backend_path"].replace("/backend", "")
    
    requirements_file = feature_dir / "requirements.txt"
    
    if requirements_file.exists():
        print(f"📦 Installing dependencies for {feature_info['name']}...")
        try:
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
            ])
            if result.returncode == 0:
                print(f"✅ Dependencies installed successfully!")
                return True
            else:
                print(f"❌ Failed to install dependencies")
                return False
        except Exception as e:
            print(f"❌ Error installing dependencies: {e}")
            return False
    else:
        print(f"ℹ️  No requirements.txt found for {feature_info['name']}")
        return True


def run_unified_platform(port=8000, reload=True, host="0.0.0.0"):
    """Run the unified homework platform with all features"""
    project_root = get_project_root()
    
    print("🎓 Starting LLM Bootcamp - Unified Homework Platform")
    print("📚 All homework assignments available in one app!")
    print(f"🌐 URL: http://localhost:{port}")
    print("🔄 Switch between homework using the dropdown")
    print("✨ Perfect code isolation with seamless UI!")
    print("\n💡 Features:")
    print("   • Beautiful dark theme with theme toggle")
    print("   • Real-time debug panel")  
    print("   • Seamless homework switching")
    print("   • Complete code isolation per homework")
    print("   • Ready for Vercel deployment")
    print(f"\n{'='*60}")
    print(f"   Press Ctrl+C to stop the server")
    print(f"{'='*60}\n")
    
    # Build uvicorn command for unified app
    cmd = [
        sys.executable, "-m", "uvicorn",
        "api.homework_app:app",
        "--host", host,
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    # Run from project root
    try:
        os.chdir(project_root)
        result = subprocess.run(cmd)
        return result.returncode == 0
    except KeyboardInterrupt:
        print(f"\n\n✅ Unified homework platform stopped successfully!")
        return True
    except Exception as e:
        print(f"❌ Error running unified platform: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Run LLM Bootcamp homework features",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/run_feature.py --list
  python scripts/run_feature.py --unified                    # All homework in one app!
  python scripts/run_feature.py --feature 01-vibe-check     # Individual homework
  python scripts/run_feature.py --feature 01-vibe-check --port 8080
  python scripts/run_feature.py --feature 01-vibe-check --install
        """
    )
    
    parser.add_argument(
        "--feature", "-f",
        help="Feature ID to run (e.g., 01-vibe-check)"
    )
    
    parser.add_argument(
        "--unified", "-u",
        action="store_true",
        help="Run unified platform with all homework assignments"
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available features"
    )
    
    parser.add_argument(
        "--port", "-p",
        type=int,
        help="Port to run the server on (default: feature's default port)"
    )
    
    parser.add_argument(
        "--no-reload",
        action="store_true", 
        help="Disable auto-reload for production"
    )
    
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)"
    )
    
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install dependencies for the feature"
    )
    
    args = parser.parse_args()
    
    # List features
    if args.list:
        list_features()
        return
    
    # Run unified platform
    if args.unified:
        success = run_unified_platform(
            port=args.port or 8000,
            reload=not args.no_reload,
            host=args.host
        )
        if not success:
            sys.exit(1)
        return
    
    # Feature is required for individual operations
    if not args.feature:
        print("❌ Error: Please specify a feature to run or use --unified for all homework.")
        print("\n💡 Quick start:")
        print("   python scripts/run_feature.py --unified      # All homework in one app")
        print("   python scripts/run_feature.py --list        # See available homework")
        parser.print_help()
        return
    
    # Install dependencies
    if args.install:
        success = install_dependencies(args.feature)
        if not success:
            sys.exit(1)
        return
    
    # Run feature
    success = run_feature(
        args.feature, 
        port=args.port,
        reload=not args.no_reload,
        host=args.host
    )
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()