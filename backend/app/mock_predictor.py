"""
Mock predictor — used automatically when TensorFlow isn't installed or no
trained model exists yet in backend/saved_model/.

This is NOT a real tumor classifier. It derives a deterministic, image-based
pseudo-prediction from simple pixel statistics (brightness, contrast, and a
hash of the image bytes) purely so the rest of the pipeline — API, database,
PDF reports, frontend — can be built, demoed, and tested end-to-end before
the real EfficientNetB0 model is trained.

The same image always produces the same result. Different images produce
different (but plausible-looking) results. Replace by training the real
model — see models/train_model.py or the Colab notebook.
"""

import hashlib
import numpy as np
from PIL import Image


def mock_predict(pil_image: Image.Image, class_names: list[str]) -> dict:
    """Returns {class_name: probability} that sums to 1.0."""
    small = pil_image.convert("L").resize((32, 32))
    arr = np.array(small, dtype="float32") / 255.0

    brightness = float(arr.mean())
    contrast = float(arr.std())

    # Deterministic seed from image content so repeated uploads of the same
    # file give the same prediction (feels less random / more "modelled").
    digest = hashlib.md5(pil_image.tobytes()[:4096]).hexdigest()
    seed = int(digest[:8], 16)
    rng = np.random.default_rng(seed)

    # Base logits nudged by simple image statistics, then softmax'd.
    base = rng.normal(loc=0.0, scale=1.0, size=len(class_names))
    base[0] += (brightness - 0.5) * 2       # nudge toward/away class 0
    base[-1] += (contrast - 0.2) * 2         # nudge toward/away last class

    exp = np.exp(base - base.max())
    probs = exp / exp.sum()

    # Sharpen slightly so one class clearly "wins", like a confident model.
    probs = probs ** 2
    probs = probs / probs.sum()

    return {c: float(p) for c, p in zip(class_names, probs)}
