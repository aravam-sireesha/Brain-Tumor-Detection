# 🧠 Brain Tumor Detection [End-to-End]

An end-to-end deep learning system that classifies brain MRI scans into
**Glioma**, **Meningioma**, **Pituitary**, or **No Tumor**, using transfer
learning (EfficientNetB0), a FastAPI backend, and a React + Tailwind frontend.

```
MRI Image → Preprocessing → EfficientNetB0 (CNN) → Prediction → Web App → Deployment
```

## Tech Stack

| Layer            | Technology                                  |
|-------------------|----------------------------------------------|
| Language          | Python, JavaScript                           |
| Deep Learning     | TensorFlow / Keras, EfficientNetB0 (transfer learning) |
| Image Processing  | OpenCV, Pillow                               |
| Backend           | FastAPI, Uvicorn, SQLite                     |
| Frontend          | React, Tailwind CSS, Vite (Streamlit version also included) |
| Reports           | ReportLab (PDF generation)                   |
| Deployment        | Render (backend), Vercel (frontend)          |

## Project Structure

```
Brain-Tumor-Detection/
├── dataset/                  # Kaggle MRI dataset goes here (not committed)
│   └── README.md             # download instructions
├── models/
│   ├── train_model.py        # trains EfficientNetB0 transfer-learning model
│   └── evaluate_model.py     # confusion matrix + classification report
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app: /predict, /history, /classes
│   │   └── report.py         # PDF report generator
│   ├── saved_model/          # trained model + metadata.json go here
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── UploadCard.jsx
│   │       ├── ResultPanel.jsx
│   │       └── HistoryList.jsx
│   ├── streamlit_app.py      # optional simple alternative UI
│   ├── package.json
│   └── vercel.json
├── reports/                  # generated confusion matrix / evaluation charts
├── requirements.txt           # root-level (train + backend + streamlit)
└── README.md
```

## ⚡ Quick Start — See It Working in 2 Minutes (no training required)

The backend automatically runs in **mock mode** if no trained model is found
yet — this lets you see the entire pipeline (upload → predict → history →
PDF report → frontend) working immediately, with simulated predictions.

```bash
# Terminal 1 — backend (lightweight install, no TensorFlow needed yet)
cd backend
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements-mock.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173, upload any image, and you'll see a prediction,
confidence scores, and a downloadable PDF — all wired up correctly. The
result panel will show an amber **"Mock mode"** banner to make clear these
aren't real predictions yet.

Verify the backend independently at any time:
```bash
cd backend
python smoke_test.py
```

Once you've trained the real model (Step 2 below) and placed it in
`backend/saved_model/`, restart the backend — it automatically switches to
real predictions, and the mock-mode banner disappears. No code changes needed.

---

## 1. Get the Dataset

Download the **Brain Tumor MRI Dataset** from Kaggle and place it under
`dataset/` — see `dataset/README.md` for exact steps. Expected classes:
`glioma`, `meningioma`, `notumor`, `pituitary`.

## 2. Train the Model

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cd models
python train_model.py --epochs 15 --fine-tune-epochs 8 --batch-size 32
```

This trains in two stages (frozen base → fine-tuned top layers), then saves:
- `backend/saved_model/brain_tumor_model.h5`
- `backend/saved_model/metadata.json` (class names, image size, test accuracy)

Optional evaluation with confusion matrix:

```bash
python evaluate_model.py
```

> No GPU? Train on **Google Colab** (free GPU) and download the `.h5` file
> into `backend/saved_model/` afterward.

## 3. Run the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt   # full install, includes TensorFlow
uvicorn app.main:app --reload --port 8000
```

Swagger docs: http://localhost:8000/docs

Check `GET /` — `"mock_mode": false` confirms it's using your trained model.
Run `python smoke_test.py` (in a second terminal, backend still running) to
verify all endpoints end-to-end.

**Endpoints:**

| Method | Route                        | Description                       |
|--------|-------------------------------|------------------------------------|
| GET    | `/`                            | Health check                       |
| GET    | `/classes`                     | List of tumor classes              |
| POST   | `/predict`                     | Upload MRI, get prediction         |
| GET    | `/history`                     | List past predictions              |
| GET    | `/history/{id}/report`         | Download PDF report                |

Example response from `POST /predict`:

```json
{
  "id": 1,
  "prediction": "Glioma",
  "confidence": 98.7,
  "all_scores": {
    "Glioma": 98.7,
    "Meningioma": 0.9,
    "No Tumor": 0.3,
    "Pituitary": 0.1
  },
  "patient_name": "Anonymous",
  "created_at": "2026-07-30T10:15:00"
}
```

## 4. Run the Frontend

### Option A — React + Tailwind (recommended)

```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_URL if backend isn't on localhost:8000
npm run dev
```

Visit http://localhost:5173

### Option B — Streamlit (quick internship demo)

```bash
cd frontend
pip install streamlit requests
streamlit run streamlit_app.py
```

## 5. Deployment

### Backend → Render

1. Push this repo to GitHub.
2. On Render: **New → Web Service**, connect the repo, root directory `backend/`.
3. Render auto-detects the `Dockerfile` (or use `render.yaml`).
4. Set the start command if not using Docker:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Important:** the trained `.h5` model file is large — either commit it with
   Git LFS, or upload it into a persistent disk / cloud storage (S3, GCS) and
   download it on startup.

### Frontend → Vercel

1. On Vercel: **New Project**, import the repo, set root directory to `frontend/`.
2. Framework preset: **Vite**.
3. Add environment variable `VITE_API_URL` = your Render backend URL
   (e.g. `https://brain-tumor-api.onrender.com`).
4. Deploy.

### Streamlit alternative → Streamlit Community Cloud

1. Point Streamlit Cloud at `frontend/streamlit_app.py`.
2. Set the `API_URL` secret/env var to your deployed backend URL.

## Features

- ✅ MRI upload (drag & drop or browse)
- ✅ Tumor type prediction (Glioma / Meningioma / Pituitary / No Tumor)
- ✅ Confidence score + per-class probability breakdown
- ✅ Image preview before analysis
- ✅ Prediction history (SQLite)
- ✅ Downloadable PDF report per prediction

## Model Pipeline

```
MRI Image → Resize (224×224) → Normalize (0–1) → EfficientNetB0 → Dense/Dropout head → Softmax → Prediction
```

## Roadmap (10 Days)

| Day | Task |
|-----|------|
| 1 | Download and understand the MRI dataset |
| 2 | Preprocess images (resize, normalize, augment) |
| 3 | Build and train the CNN/transfer-learning model |
| 4 | Evaluate accuracy and save the trained model |
| 5 | Build the FastAPI backend with `/predict` |
| 6 | Build the React (or Streamlit) frontend |
| 7 | Connect frontend to backend |
| 8 | Add confidence scores, history, error handling |
| 9 | Deploy (Render + Vercel) |
| 10 | Documentation, screenshots, presentation |

## Disclaimer

This project is for **educational purposes only**. It is not a certified
medical device and must not be used for real clinical diagnosis. Always
consult a licensed radiologist or physician.
