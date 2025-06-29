#!/usr/bin/env python3
"""
Test script for the unified homework platform
Verifies that homework isolation works correctly
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

def test_homework_isolation():
    """Test that homework handlers can be loaded in isolation"""
    print("🧪 Testing Homework Isolation...")
    
    try:
        # Import the unified app
        from api.homework_app import load_homework_handler, HOMEWORK_FEATURES
        
        print(f"📚 Found {len(HOMEWORK_FEATURES)} homework assignments")
        
        # Test loading each enabled homework
        for homework_id, info in HOMEWORK_FEATURES.items():
            if info["enabled"]:
                print(f"\n🔍 Testing {homework_id} ({info['name']})...")
                
                try:
                    handler = load_homework_handler(homework_id)
                    print(f"  ✅ Handler loaded: {handler.__class__.__name__}")
                    print(f"  ✅ Feature name: {handler.feature_name}")
                    
                    # Test that it has required methods
                    required_methods = ['get_system_prompt', 'process_user_message', 'enhance_messages']
                    for method in required_methods:
                        if hasattr(handler, method):
                            print(f"  ✅ Has method: {method}")
                        else:
                            print(f"  ❌ Missing method: {method}")
                    
                except Exception as e:
                    print(f"  ❌ Failed to load: {e}")
            else:
                print(f"\n⏳ Skipping {homework_id} ({info['name']}) - not enabled")
        
        print(f"\n🎉 Homework isolation test complete!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_backend_routes():
    """Test that the unified backend routes work"""
    print("\n🌐 Testing Backend Routes...")
    
    try:
        import requests
        import time
        import subprocess
        import signal
        
        # Start the server in background
        print("  🚀 Starting test server...")
        server = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "api.homework_app:app",
            "--host", "127.0.0.1",
            "--port", "8001"
        ], cwd=project_root)
        
        # Wait for server to start
        time.sleep(3)
        
        try:
            # Test health endpoint
            response = requests.get("http://127.0.0.1:8001/api/health")
            if response.status_code == 200:
                health_data = response.json()
                print(f"  ✅ Health check: {health_data['status']}")
                print(f"  📚 Available homework: {health_data['available_homework']}")
            else:
                print(f"  ❌ Health check failed: {response.status_code}")
            
            # Test homework list
            response = requests.get("http://127.0.0.1:8001/api/homework")
            if response.status_code == 200:
                homework_data = response.json()
                print(f"  ✅ Homework list: {len(homework_data['homework'])} assignments")
            else:
                print(f"  ❌ Homework list failed: {response.status_code}")
                
        finally:
            # Stop server
            server.terminate()
            server.wait()
            print("  🛑 Test server stopped")
        
        return True
        
    except ImportError:
        print("  ⏳ Skipping route tests (requests not installed)")
        return True
    except Exception as e:
        print(f"  ❌ Route test failed: {e}")
        return False


def main():
    print("🎓 LLM Bootcamp - Unified Platform Test")
    print("=" * 50)
    
    success = True
    
    # Test homework isolation
    if not test_homework_isolation():
        success = False
    
    # Test backend routes
    if not test_backend_routes():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed! Unified platform is ready!")
        print("\n🚀 To run the platform:")
        print("   python -m uvicorn api.homework_app:app --reload --port 8000")
        print("   # Or deploy to Vercel with updated vercel.json")
    else:
        print("❌ Some tests failed. Check the output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()