#!/usr/bin/env python3
"""
Quick test to verify the unified frontend loads correctly
"""
import subprocess
import sys
import time
import requests
from pathlib import Path

def test_unified_frontend():
    """Test that the unified frontend serves correctly"""
    project_root = Path(__file__).parent.parent
    
    print("🧪 Testing Unified Frontend Loading...")
    
    # Start server
    server = subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "api.homework_app:app",
        "--host", "127.0.0.1",
        "--port", "8003"
    ], cwd=project_root, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    try:
        # Wait for server to start
        time.sleep(3)
        
        # Test main page loads
        response = requests.get("http://127.0.0.1:8003/")
        if response.status_code == 200:
            content = response.text
            
            # Check for key elements
            checks = [
                ("HTML structure", "<!DOCTYPE html>" in content),
                ("LLM Bootcamp title", "LLM Bootcamp" in content),
                ("Feature dropdown", 'id="featureSelect"' in content),
                ("Base CSS", '/base/frontend/base.css' in content),
                ("Homework platform JS", '/frontend/homework-platform.js' in content),
                ("Unified welcome", "Unified Platform" in content),
            ]
            
            print(f"  ✅ Frontend loads (status: {response.status_code})")
            
            for check_name, check_result in checks:
                if check_result:
                    print(f"  ✅ {check_name}")
                else:
                    print(f"  ❌ {check_name}")
            
            # Test static file endpoints
            static_tests = [
                ("/api/health", "API health"),
                ("/api/homework", "Homework list"),
                ("/base/frontend/base.css", "Base CSS"),
                ("/frontend/homework-platform.js", "Platform JS")
            ]
            
            for url, name in static_tests:
                try:
                    resp = requests.get(f"http://127.0.0.1:8003{url}")
                    if resp.status_code == 200:
                        print(f"  ✅ {name} loads")
                    else:
                        print(f"  ❌ {name} failed ({resp.status_code})")
                except:
                    print(f"  ❌ {name} request failed")
            
            return True
        else:
            print(f"  ❌ Frontend failed to load (status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False
    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    print("🎓 Testing Unified Homework Platform Frontend")
    print("=" * 50)
    
    if test_unified_frontend():
        print("\n🎉 Frontend test passed!")
        print("\n🚀 To run the unified platform:")
        print("   python scripts/run_feature.py --unified")
    else:
        print("\n❌ Frontend test failed!")
        sys.exit(1)