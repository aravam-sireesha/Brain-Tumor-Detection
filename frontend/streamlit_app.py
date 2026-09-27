"""
Optional simple Streamlit frontend (alternative to the React app).
Handy if you just need something quick for an internship demo.

Run:
    streamlit run streamlit_app.py

Make sure the FastAPI backend is running first (default http://localhost:8000).
"""
import os
import requests
import streamlit as st

API_URL = os.environ.get("API_URL", "http://localhost:8000")

st.set_page_config(page_title="Brain Tumor Detection", page_icon="🧠", layout="centered")

st.title("🧠 Brain Tumor Detection")
st.caption("Upload a brain MRI scan to classify it as Glioma, Meningioma, Pituitary, or No Tumor.")

patient_name = st.text_input("Patient name (optional)", "")
uploaded_file = st.file_uploader("Upload MRI image", type=["jpg", "jpeg", "png"])

if uploaded_file:
    st.image(uploaded_file, caption="Uploaded MRI", use_column_width=True)

    if st.button("Analyze Scan", type="primary"):
        with st.spinner("Running inference..."):
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
            data = {"patient_name": patient_name or "Anonymous"}
            try:
                response = requests.post(f"{API_URL}/predict", files=files, data=data, timeout=60)
                response.raise_for_status()
                result = response.json()

                st.success(f"Prediction: **{result['prediction']}**")
                st.metric("Confidence", f"{result['confidence']:.2f}%")

                st.subheader("Class Probabilities")
                for label, score in result["all_scores"].items():
                    st.progress(score / 100, text=f"{label}: {score:.2f}%")

                report_url = f"{API_URL}/history/{result['id']}/report"
                st.markdown(f"[📄 Download PDF Report]({report_url})")

            except requests.exceptions.RequestException as e:
                st.error(f"Could not reach the backend: {e}")

st.divider()
st.subheader("Prediction History")
try:
    hist_resp = requests.get(f"{API_URL}/history", timeout=10)
    hist_resp.raise_for_status()
    history = hist_resp.json()["history"]
    if history:
        for item in history:
            st.write(
                f"**{item['prediction']}** ({item['confidence']:.1f}%) — "
                f"{item['patient_name']} · {item['created_at'][:19]}"
            )
    else:
        st.caption("No predictions yet.")
except requests.exceptions.RequestException:
    st.caption("Backend not reachable — start the FastAPI server to see history.")

st.divider()
st.caption(
    "⚠️ Educational/demonstration project only. Not a substitute for professional medical diagnosis."
)
