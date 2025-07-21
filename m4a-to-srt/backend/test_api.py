#!/usr/bin/env python3
"""
Test script for M4A to SRT Converter API
"""

import requests
import os
import tempfile

# API base URL - change this to your deployed URL
BASE_URL = "http://localhost:8000"  # For local testing
# BASE_URL = "https://your-app.onrender.com"  # For deployed testing

def test_health():
    """Test the health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def test_root():
    """Test the root endpoint"""
    print("\nTesting root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            print(f"Content length: {len(response.text)} characters")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")

def test_convert_without_file():
    """Test the convert endpoint without a file (should fail)"""
    print("\nTesting convert endpoint without file...")
    try:
        response = requests.post(f"{BASE_URL}/api/convert")
        if response.status_code == 422:  # Validation error
            print("✅ Convert endpoint correctly rejected request without file")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Convert endpoint error: {e}")

def test_convert_with_invalid_file():
    """Test the convert endpoint with an invalid file"""
    print("\nTesting convert endpoint with invalid file...")
    try:
        # Create a temporary text file
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"This is not an audio file")
            temp_file = f.name
        
        with open(temp_file, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            response = requests.post(f"{BASE_URL}/api/convert", files=files)
        
        os.unlink(temp_file)
        
        if response.status_code == 400:
            print("✅ Convert endpoint correctly rejected invalid file type")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Convert endpoint error: {e}")

def main():
    """Run all tests"""
    print("🧪 Testing M4A to SRT Converter API")
    print("=" * 50)
    
    test_health()
    test_root()
    test_convert_without_file()
    test_convert_with_invalid_file()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nTo test with a real M4A file:")
    print("1. Prepare an M4A audio file")
    print("2. Use curl or the frontend interface")
    print("3. Example curl command:")
    print(f"   curl -X POST '{BASE_URL}/api/convert' \\")
    print("     -F 'file=@your-audio.m4a' \\")
    print("     -F 'words_per_segment=10' \\")
    print("     -F 'frame_rate=30.0' \\")
    print("     --output subtitles.srt")

if __name__ == "__main__":
    main() 