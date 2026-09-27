"""
Brain Tumor Detection - FastAPI Backend
=========================================

Endpoints:
    GET  /                         -> health check
    GET  /classes                  -> model classes
    POST /predict                  -> predict uploaded MRI
    GET  /history                  -> prediction history
    GET  /history/{id}/report      -> PDF report

The backend automatically uses the trained EfficientNetB0 model
when this file exists:

    backend/saved_model/brain_tumor_model.keras

Otherwise it falls back to MOCK MODE.
"""

import io
import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Form
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from PIL import Image

from .report import generate_pdf_report
from .mock_predictor import mock_predict


# ============================================================
# TENSORFLOW
# ============================================================

try:
    import tensorflow as tf

    TF_AVAILABLE = True

    print("[startup] TensorFlow available.")

except ImportError:

    TF_AVAILABLE = False

    print("[startup] TensorFlow is not installed.")


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "saved_model"
)

# IMPORTANT:
# Your trained model is .keras, NOT .h5
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "brain_tumor_model.keras"
)

META_PATH = os.path.join(
    MODEL_DIR,
    "metadata.json"
)

DB_PATH = os.path.join(
    BASE_DIR,
    "history.db"
)

REPORTS_DIR = os.path.join(
    BASE_DIR,
    "reports"
)

os.makedirs(
    REPORTS_DIR,
    exist_ok=True
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Brain Tumor Detection API",

    description=(
        "Upload a brain MRI scan and get "
        "a tumor-type prediction."
    ),

    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

_model = None

_class_names = [
    "glioma",
    "meningioma",
    "notumor",
    "pituitary"
]

_img_size = (
    224,
    224
)


# ============================================================
# LOAD METADATA
# ============================================================

if os.path.exists(META_PATH):

    try:

        with open(
            META_PATH,
            "r"
        ) as f:

            _meta = json.load(f)

        _class_names = _meta.get(
            "class_names",
            _class_names
        )

        _img_size = tuple(
            _meta.get(
                "image_size",
                _img_size
            )
        )

        print(
            "[startup] Metadata loaded."
        )

        print(
            f"[startup] Classes: {_class_names}"
        )

        print(
            f"[startup] Image size: {_img_size}"
        )

    except Exception as e:

        print(
            f"[startup] Could not load metadata: {e}"
        )


# ============================================================
# DISPLAY NAMES
# ============================================================

DISPLAY_NAMES = {

    "glioma":
        "Glioma",

    "meningioma":
        "Meningioma",

    "notumor":
        "No Tumor",

    "pituitary":
        "Pituitary"
}


# ============================================================
# MOCK MODE
# ============================================================

MODEL_EXISTS = os.path.exists(
    MODEL_PATH
)

MOCK_MODE = (
    not TF_AVAILABLE
    or not MODEL_EXISTS
)


if MOCK_MODE:

    if not TF_AVAILABLE:

        reason = (
            "TensorFlow is not installed"
        )

    else:

        reason = (
            "trained .keras model not found"
        )

    print(
        f"[startup] MOCK MODE: {reason}"
    )

    print(
        "[startup] Predictions will be simulated."
    )

else:

    print(
        "[startup] REAL MODEL FOUND."
    )

    print(
        f"[startup] Model: {MODEL_PATH}"
    )


# ============================================================
# LOAD MODEL
# ============================================================

def get_model():

    global _model

    if _model is None:

        if not TF_AVAILABLE:

            raise HTTPException(
                status_code=503,

                detail=(
                    "TensorFlow is not installed."
                )
            )

        if not os.path.exists(
            MODEL_PATH
        ):

            raise HTTPException(

                status_code=503,

                detail=(
                    "Model file not found. "
                    "Train the model first or place "
                    "brain_tumor_model.keras in "
                    "backend/saved_model/."
                )
            )

        try:

            print(
                "[model] Loading trained model..."
            )

            _model = tf.keras.models.load_model(
                MODEL_PATH
            )

            print(
                "[model] Trained model loaded successfully."
            )

        except Exception as e:

            print(
                f"[model] Failed to load model: {e}"
            )

            raise HTTPException(

                status_code=500,

                detail=(
                    f"Could not load trained model: {e}"
                )
            )

    return _model


# ============================================================
# DATABASE
# ============================================================

def init_db():

    conn = sqlite3.connect(
        DB_PATH
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            patient_name TEXT,

            prediction TEXT,

            confidence REAL,

            all_scores TEXT,

            created_at TEXT
        )
        """
    )

    conn.commit()

    conn.close()


init_db()


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(
    file_bytes: bytes
) -> np.ndarray:

    try:

        image = Image.open(
            io.BytesIO(file_bytes)
        ).convert("RGB")

    except Exception:

        raise HTTPException(

            status_code=400,

            detail=(
                "Could not read the uploaded image."
            )
        )

    image = image.resize(
        _img_size
    )

    # IMPORTANT:
    # Do NOT divide by 255 here.
    #
    # The training code also does not use
    # rescale=1/255 because Keras EfficientNetB0
    # already handles its expected preprocessing.

    arr = np.array(
        image
    ).astype(
        "float32"
    )

    arr = np.expand_dims(
        arr,
        axis=0
    )

    return arr


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def health_check():

    return {

        "status":
            "ok",

        "service":
            "Brain Tumor Detection API",

        "model_loaded":
            os.path.exists(
                MODEL_PATH
            ),

        "mock_mode":
            MOCK_MODE,

        "tensorflow_available":
            TF_AVAILABLE
    }


# ============================================================
# CLASSES
# ============================================================

@app.get("/classes")
def get_classes():

    return {

        "classes": [

            DISPLAY_NAMES.get(
                c,
                c
            )

            for c in _class_names
        ]
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
async def predict(

    file: UploadFile = File(...),

    patient_name: Optional[str] = Form(
        default="Anonymous"
    )
):

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    if file.content_type not in (
        "image/jpeg",
        "image/png",
        "image/jpg"
    ):

        raise HTTPException(

            status_code=400,

            detail=(
                "Please upload a JPEG or PNG image."
            )
        )

    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    file_bytes = await file.read()

    # --------------------------------------------------------
    # MOCK PREDICTION
    # --------------------------------------------------------

    if MOCK_MODE:

        try:

            pil_image = Image.open(
                io.BytesIO(file_bytes)
            ).convert("RGB")

        except Exception:

            raise HTTPException(

                status_code=400,

                detail=(
                    "Could not read the uploaded image."
                )
            )

        scores = mock_predict(
            pil_image,
            _class_names
        )

    # --------------------------------------------------------
    # REAL MODEL PREDICTION
    # --------------------------------------------------------

    else:

        input_arr = preprocess_image(
            file_bytes
        )

        model = get_model()

        try:

            preds = model.predict(
                input_arr,
                verbose=0
            )[0]

        except Exception as e:

            raise HTTPException(

                status_code=500,

                detail=(
                    f"Prediction failed: {e}"
                )
            )

        scores = {

            c: float(
                preds[i]
            )

            for i, c in enumerate(
                _class_names
            )
        }

    # ========================================================
    # FIND TOP PREDICTION
    # ========================================================

    top_class = max(
        scores,
        key=scores.get
    )

    prediction = DISPLAY_NAMES.get(
        top_class,
        top_class
    )

    confidence = (
        scores[top_class] * 100
    )

    # ========================================================
    # ALL CLASS SCORES
    # ========================================================

    all_scores = {

        DISPLAY_NAMES.get(
            c,
            c
        ):
            scores[c] * 100

        for c in _class_names
    }

    # ========================================================
    # SAVE HISTORY
    # ========================================================

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    conn = sqlite3.connect(
        DB_PATH
    )

    cur = conn.execute(

        """
        INSERT INTO predictions
        (
            patient_name,
            prediction,
            confidence,
            all_scores,
            created_at
        )

        VALUES (?, ?, ?, ?, ?)
        """,

        (
            patient_name,

            prediction,

            confidence,

            json.dumps(
                all_scores
            ),

            created_at
        )
    )

    record_id = cur.lastrowid

    conn.commit()

    conn.close()

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "id":
            record_id,

        "prediction":
            prediction,

        "confidence":
            round(
                confidence,
                2
            ),

        "all_scores": {

            k:
                round(
                    v,
                    2
                )

            for k, v in all_scores.items()
        },

        "patient_name":
            patient_name,

        "created_at":
            created_at,

        "mock_mode":
            MOCK_MODE
    }


# ============================================================
# HISTORY
# ============================================================

@app.get("/history")
def get_history(
    limit: int = 20
):

    conn = sqlite3.connect(
        DB_PATH
    )

    conn.row_factory = sqlite3.Row

    rows = conn.execute(

        """
        SELECT *
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
        """,

        (
            limit,
        )
    ).fetchall()

    conn.close()

    return {

        "history": [

            dict(row)

            for row in rows
        ]
    }


# ============================================================
# PDF REPORT
# ============================================================

@app.get(
    "/history/{record_id}/report"
)
def download_report(
    record_id: int
):

    conn = sqlite3.connect(
        DB_PATH
    )

    conn.row_factory = sqlite3.Row

    row = conn.execute(

        """
        SELECT *
        FROM predictions
        WHERE id = ?
        """,

        (
            record_id,
        )
    ).fetchone()

    conn.close()

    if row is None:

        raise HTTPException(

            status_code=404,

            detail="Record not found."
        )

    record = dict(
        row
    )

    record["all_scores"] = json.loads(
        record["all_scores"]
    )

    pdf_path = os.path.join(

        REPORTS_DIR,

        f"report_{record_id}.pdf"
    )

    generate_pdf_report(
        record,
        pdf_path
    )

    return FileResponse(

        pdf_path,

        media_type="application/pdf",

        filename=(
            f"brain_tumor_report_{record_id}.pdf"
        )
    )