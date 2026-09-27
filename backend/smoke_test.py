"""
Smoke test for the backend — run this AFTER starting the FastAPI server
(uvicorn app.main:app --reload --port 8000) to verify everything works,
in mock mode or real mode.

Usage:
    cd backend
    python smoke_test.py
"""
import io
import sys
import requests
from PIL import Image
import numpy as np

BASE_URL = "http://localhost:8000"


def make_fake_mri_bytes():
    """Generates a random grayscale-ish JPEG in memory to use as a test upload."""
    arr = np.random.default_rng(42).integers(0, 255, (224, 224, 3), dtype="uint8")
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def main():
    print(f"Testing backend at {BASE_URL} ...\n")

    # 1. Health check
    r = requests.get(f"{BASE_URL}/")
    r.raise_for_status()
    health = r.json()
    print("[1/5] Health check:", health)
    mode = "MOCK MODE" if health.get("mock_mode") else "REAL MODEL"
    print(f"      -> Backend is running in {mode}\n")

    # 2. Classes
    r = requests.get(f"{BASE_URL}/classes")
    r.raise_for_status()
    print("[2/5] Classes:", r.json())
    print()

    # 3. Predict
    files = {"file": ("test_mri.jpg", make_fake_mri_bytes(), "image/jpeg")}
    data = {"patient_name": "Smoke Test Patient"}
    r = requests.post(f"{BASE_URL}/predict", files=files, data=data)
    r.raise_for_status()
    result = r.json()
    print("[3/5] Prediction:", result)
    assert result["prediction"] in ("Glioma", "Meningioma", "No Tumor", "Pituitary")
    assert 0 <= result["confidence"] <= 100
    assert abs(sum(result["all_scores"].values()) - 100) < 1.0
    print("      -> Prediction shape and values look correct\n")

    # 4. History
    r = requests.get(f"{BASE_URL}/history")
    r.raise_for_status()
    history = r.json()["history"]
    print(f"[4/5] History has {len(history)} record(s), most recent:", history[0])
    print()

    # 5. PDF report
    record_id = result["id"]
    r = requests.get(f"{BASE_URL}/history/{record_id}/report")
    r.raise_for_status()
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:5] == b"%PDF-"
    print(f"[5/5] PDF report for id={record_id}: {len(r.content)} bytes, valid PDF header\n")

    print("✅ ALL CHECKS PASSED — backend is fully working.")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect. Is the backend running?")
        print("   Run: uvicorn app.main:app --reload --port 8000")
        sys.exit(1)
    except AssertionError as e:
        print(f"❌ Check failed: {e}")
        sys.exit(1)
