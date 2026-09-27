"""
Brain Tumor Detection - Model Training Script
================================================
EfficientNetB0 transfer-learning classifier for:

    glioma
    meningioma
    notumor
    pituitary

Dataset structure:

dataset/
    Training/
        glioma/
        meningioma/
        notumor/
        pituitary/
    Testing/
        glioma/
        meningioma/
        notumor/
        pituitary/

Run:

    python train_model.py --epochs 15 --fine-tune-epochs 8 --batch-size 32
"""

import os
import argparse
import json
from datetime import datetime, timezone

import tensorflow as tf

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import (
    GlobalAveragePooling2D,
    Dense,
    Dropout,
    BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator


# ============================================================
# CONFIGURATION
# ============================================================

IMG_SIZE = (224, 224)

CLASS_NAMES = [
    "glioma",
    "meningioma",
    "notumor",
    "pituitary"
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(
    BASE_DIR,
    "..",
    "dataset"
)

TRAIN_DIR = os.path.join(
    DATASET_DIR,
    "Training"
)

TEST_DIR = os.path.join(
    DATASET_DIR,
    "Testing"
)

SAVE_DIR = os.path.join(
    BASE_DIR,
    "..",
    "backend",
    "saved_model"
)


# ============================================================
# BUILD MODEL
# ============================================================

def build_model(
    num_classes: int,
    image_size=IMG_SIZE,
    fine_tune: bool = False
):

    print("Loading EfficientNetB0...")

    base_model = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(*image_size, 3),
        pooling=None
    )

    # Freeze/unfreeze the base model
    base_model.trainable = fine_tune

    # Classification head
    x = base_model.output

    x = GlobalAveragePooling2D()(x)

    x = BatchNormalization()(x)

    x = Dense(
        256,
        activation="relu"
    )(x)

    x = Dropout(0.4)(x)

    x = Dense(
        128,
        activation="relu"
    )(x)

    x = Dropout(0.3)(x)

    outputs = Dense(
        num_classes,
        activation="softmax"
    )(x)

    model = Model(
        inputs=base_model.input,
        outputs=outputs
    )

    return model, base_model


# ============================================================
# DATA GENERATORS
# ============================================================

def get_generators(batch_size: int):

    print("\nPreparing image generators...")

    # IMPORTANT:
    # Do NOT use rescale=1/255 here.
    #
    # Keras EfficientNetB0 already contains its own
    # input rescaling/preprocessing.

    train_datagen = ImageDataGenerator(

        rotation_range=15,

        width_shift_range=0.1,

        height_shift_range=0.1,

        zoom_range=0.1,

        horizontal_flip=True,

        brightness_range=(0.85, 1.15),

        validation_split=0.15
    )

    test_datagen = ImageDataGenerator()

    # --------------------------------------------------------
    # TRAINING DATA
    # --------------------------------------------------------

    train_gen = train_datagen.flow_from_directory(

        TRAIN_DIR,

        target_size=IMG_SIZE,

        batch_size=batch_size,

        class_mode="categorical",

        classes=CLASS_NAMES,

        subset="training",

        shuffle=True,

        seed=42
    )

    # --------------------------------------------------------
    # VALIDATION DATA
    # --------------------------------------------------------

    val_gen = train_datagen.flow_from_directory(

        TRAIN_DIR,

        target_size=IMG_SIZE,

        batch_size=batch_size,

        class_mode="categorical",

        classes=CLASS_NAMES,

        subset="validation",

        shuffle=False,

        seed=42
    )

    # --------------------------------------------------------
    # TEST DATA
    # --------------------------------------------------------

    test_gen = test_datagen.flow_from_directory(

        TEST_DIR,

        target_size=IMG_SIZE,

        batch_size=batch_size,

        class_mode="categorical",

        classes=CLASS_NAMES,

        shuffle=False
    )

    print("\nClass mapping:")
    print(train_gen.class_indices)

    print("\nTraining images:", train_gen.samples)
    print("Validation images:", val_gen.samples)
    print("Testing images:", test_gen.samples)

    return train_gen, val_gen, test_gen


# ============================================================
# MAIN TRAINING FUNCTION
# ============================================================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--epochs",
        type=int,
        default=15
    )

    parser.add_argument(
        "--fine-tune-epochs",
        type=int,
        default=8
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=32
    )

    parser.add_argument(
        "--lr",
        type=float,
        default=1e-3
    )

    args = parser.parse_args()

    # --------------------------------------------------------
    # CREATE MODEL DIRECTORY
    # --------------------------------------------------------

    os.makedirs(
        SAVE_DIR,
        exist_ok=True
    )

    print("=" * 60)
    print("BRAIN TUMOR DETECTION MODEL TRAINING")
    print("=" * 60)

    print("\nDataset directory:")
    print(DATASET_DIR)

    print("\nTraining directory:")
    print(TRAIN_DIR)

    print("\nTesting directory:")
    print(TEST_DIR)

    print("\nModel save directory:")
    print(SAVE_DIR)

    # --------------------------------------------------------
    # LOAD DATA
    # --------------------------------------------------------

    train_gen, val_gen, test_gen = get_generators(
        args.batch_size
    )

    # --------------------------------------------------------
    # BUILD MODEL
    # --------------------------------------------------------

    print("\nBuilding EfficientNetB0 model...")

    model, base_model = build_model(
        num_classes=len(CLASS_NAMES),
        fine_tune=False
    )

    # --------------------------------------------------------
    # COMPILE MODEL
    # --------------------------------------------------------

    model.compile(

        optimizer=Adam(
            learning_rate=args.lr
        ),

        loss="categorical_crossentropy",

        metrics=["accuracy"]
    )

    print("\nModel summary:")

    model.summary()

    # --------------------------------------------------------
    # CALLBACKS
    # --------------------------------------------------------

    model_path = os.path.join(
        SAVE_DIR,
        "brain_tumor_model.keras"
    )

    callbacks = [

        EarlyStopping(

            monitor="val_loss",

            patience=5,

            restore_best_weights=True
        ),

        ModelCheckpoint(

            filepath=model_path,

            monitor="val_accuracy",

            save_best_only=True,

            verbose=1
        ),

        ReduceLROnPlateau(

            monitor="val_loss",

            factor=0.5,

            patience=3,

            min_lr=1e-6,

            verbose=1
        )
    ]

    # ========================================================
    # STAGE 1
    # ========================================================

    print("\n")
    print("=" * 60)
    print("STAGE 1")
    print("Training classification head")
    print("=" * 60)

    model.fit(

        train_gen,

        validation_data=val_gen,

        epochs=args.epochs,

        callbacks=callbacks
    )

    # ========================================================
    # STAGE 2
    # ========================================================

    print("\n")
    print("=" * 60)
    print("STAGE 2")
    print("Fine-tuning EfficientNetB0")
    print("=" * 60)

    base_model.trainable = True

    # Freeze most of EfficientNet.
    # Only the last 30 layers will be fine-tuned.

    for layer in base_model.layers[:-30]:

        layer.trainable = False

    # Recompile with smaller learning rate

    model.compile(

        optimizer=Adam(
            learning_rate=args.lr / 10
        ),

        loss="categorical_crossentropy",

        metrics=["accuracy"]
    )

    model.fit(

        train_gen,

        validation_data=val_gen,

        epochs=args.fine_tune_epochs,

        callbacks=callbacks
    )

    # ========================================================
    # EVALUATION
    # ========================================================

    print("\n")
    print("=" * 60)
    print("EVALUATING MODEL")
    print("=" * 60)

    test_loss, test_accuracy = model.evaluate(
        test_gen
    )

    print(
        f"\nTest Accuracy: "
        f"{test_accuracy * 100:.2f}%"
    )

    print(
        f"Test Loss: "
        f"{test_loss:.4f}"
    )

    # ========================================================
    # SAVE FINAL MODEL
    # ========================================================

    final_model_path = os.path.join(
        SAVE_DIR,
        "brain_tumor_model.keras"
    )

    model.save(
        final_model_path
    )

    print("\nModel saved:")
    print(final_model_path)

    # ========================================================
    # SAVE METADATA
    # ========================================================

    metadata = {

        "class_names": CLASS_NAMES,

        "image_size": IMG_SIZE,

        "test_accuracy": float(
            test_accuracy
        ),

        "test_loss": float(
            test_loss
        ),

        "trained_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "framework": "tensorflow/keras",

        "base_model": "EfficientNetB0",

        "training_images": int(
            train_gen.samples
        ),

        "validation_images": int(
            val_gen.samples
        ),

        "testing_images": int(
            test_gen.samples
        )
    }

    metadata_path = os.path.join(
        SAVE_DIR,
        "metadata.json"
    )

    with open(
        metadata_path,
        "w"
    ) as f:

        json.dump(
            metadata,
            f,
            indent=2
        )

    print("\nMetadata saved:")
    print(metadata_path)

    # ========================================================
    # COMPLETE
    # ========================================================

    print("\n")
    print("=" * 60)
    print("TRAINING COMPLETED")
    print("=" * 60)

    print(
        "\nModel:"
    )

    print(
        final_model_path
    )

    print(
        "\nTest Accuracy:"
    )

    print(
        f"{test_accuracy * 100:.2f}%"
    )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()