#!/usr/bin/env python3
import requests
import sys

try:
    print("🧪 Testing API...")
    r = requests.get('http://localhost:4201/api/lesson-templates', timeout=5)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"✅ SUCCESS! Got {len(data)} templates")
        if data:
            print(f"   First template: {data[0].get('title', 'N/A')}")
    else:
        print(f"❌ Error: {r.text[:200]}")
except Exception as e:
    print(f"❌ Exception: {e}")
    sys.exit(1)
