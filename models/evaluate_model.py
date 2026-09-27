"""
Evaluate the trained brain tumor model on the Testing set and produce a
confusion matrix + classification report.

Usage:
    python evaluate_model.py
"""
import os
import json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DIR = os.path.join(BASE_DIR, "..", "dataset", "Testing")
MODEL_PATH = os.path.join(BASE_DIR, "..", "backend", "saved_model", "brain_tumor_model.h5")
META_PATH = os.path.join(BASE_DIR, "..", "backend", "saved_model", "metadata.json")


def main():
    with open(META_PATH) as f:
        meta = json.load(f)
    class_names = meta["class_names"]
    img_size = tuple(meta["image_size"])

    model = tf.keras.models.load_model(MODEL_PATH)

    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255)
    test_gen = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=img_size,
        batch_size=32,
        class_mode="categorical",
        classes=class_names,
        shuffle=False,
    )

    preds = model.predict(test_gen)
    y_pred = np.argmax(preds, axis=1)
    y_true = test_gen.classes

    print(classification_report(y_true, y_pred, target_names=class_names))

    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45)
    ax.set_yticklabels(class_names)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix - Brain Tumor Classifier")
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black")
    fig.colorbar(im)
    plt.tight_layout()
    out_path = os.path.join(BASE_DIR, "..", "reports", "confusion_matrix.png")
    plt.savefig(out_path)
    print(f"Confusion matrix saved to {out_path}")


if __name__ == "__main__":
    main()
