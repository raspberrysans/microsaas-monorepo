#!/usr/bin/env python3
"""
Test script for the M4A to SRT Converter API.
Run this script to test the API endpoints.
"""

import requests
import json
import os
from pathlib import Path

# API base URL (change this to your deployed URL)
BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health check endpoint."""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint (web interface)."""
    print("Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint working (web interface served)")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_convert_endpoint_without_file():
    """Test the convert endpoint without a file (should fail)."""
    print("Testing convert endpoint without file...")
    try:
        response = requests.post(f"{BASE_URL}/convert/")
        if response.status_code == 422:  # Validation error expected
            print("✅ Convert endpoint correctly rejected request without file")
            return True
        else:
            print(f"❌ Convert endpoint unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Convert endpoint error: {e}")
        return False

def test_convert_endpoint_with_invalid_file():
    """Test the convert endpoint with invalid file type."""
    print("Testing convert endpoint with invalid file...")
    try:
        # Create a dummy text file
        with open("test.txt", "w") as f:
            f.write("This is not an audio file")
        
        with open("test.txt", "rb") as f:
            files = {"file": ("test.txt", f, "text/plain")}
            response = requests.post(f"{BASE_URL}/convert/", files=files)
        
        # Clean up
        os.remove("test.txt")
        
        if response.status_code == 400:
            print("✅ Convert endpoint correctly rejected invalid file type")
            return True
        else:
            print(f"❌ Convert endpoint unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Convert endpoint error: {e}")
        return False

def test_api_documentation():
    """Test if API documentation is accessible."""
    print("Testing API documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API documentation accessible")
            return True
        else:
            print(f"❌ API documentation not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API documentation error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Running M4A to SRT Converter API Tests")
    print("=" * 50)
    
    tests = [
        test_health_endpoint,
        test_root_endpoint,
        test_convert_endpoint_without_file,
        test_convert_endpoint_with_invalid_file,
        test_api_documentation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the API implementation.")
    
    print("\n📝 Next steps:")
    print("1. Start the API server: python main.py")
    print("2. Open http://localhost:8000 in your browser")
    print("3. Upload an M4A file to test the conversion")

if __name__ == "__main__":
    main() 