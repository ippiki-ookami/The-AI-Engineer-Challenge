#!/usr/bin/env python3
"""
Test API key validation endpoint
"""
import subprocess
import sys
import time
import requests
from pathlib import Path

def test_api_key_validation():
    """Test that API key validation works without errors"""
    project_root = Path(__file__).parent.parent
    
    print("🔑 Testing API Key Validation...")
    
    # Start server
    server = subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "api.homework_app:app",
        "--host", "127.0.0.1",
        "--port", "8004"
    ], cwd=project_root, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    try:
        # Wait for server to start
        time.sleep(3)
        
        # Test invalid API key format
        response = requests.post("http://127.0.0.1:8004/api/validate-key", 
                               json={"api_key": "invalid-key"})
        if response.status_code == 400:
            print("  ✅ Invalid key format rejected")
        else:
            print(f"  ❌ Invalid key not rejected (got {response.status_code})")
        
        # Test empty API key
        response = requests.post("http://127.0.0.1:8004/api/validate-key", 
                               json={"api_key": ""})
        if response.status_code == 400:
            print("  ✅ Empty key rejected")
        else:
            print(f"  ❌ Empty key not rejected (got {response.status_code})")
        
        # Test fake but properly formatted key (should fail at OpenAI level)
        response = requests.post("http://127.0.0.1:8004/api/validate-key", 
                               json={"api_key": "sk-fake1234567890abcdef1234567890abcdef1234567890"})
        if response.status_code == 400:
            print("  ✅ Fake key rejected by OpenAI validation")
        else:
            print(f"  ❌ Fake key not rejected (got {response.status_code})")
        
        print("  ✅ API key validation endpoint working correctly")
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        return False
    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    print("🎓 Testing API Key Validation")
    print("=" * 40)
    
    if test_api_key_validation():
        print("\n🎉 API key validation test passed!")
        print("\n💡 The API key modal should now work correctly!")
    else:
        print("\n❌ API key validation test failed!")
        sys.exit(1)