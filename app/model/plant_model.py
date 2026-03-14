import numpy as np

# Global variable for model
MODEL = None

def load_plant_model():
    """
    Lazy load the TensorFlow model to prevent startup hangs.
    """
    import tensorflow as tf
    global MODEL
    if MODEL is None:
        print("[Model] Loading PlantVillage H5 model...")
        MODEL = tf.keras.models.load_model("app/model/plant_village.h5")
        print("[Model] Model loaded successfully.")
    return MODEL

CLASS_NAMES = [
    "Healthy",
    "Early Blight",
    "Late Blight",
    "Powdery Mildew",
    "Rust"
]

def predict_disease(image_array):

    if image_array is None:
        return {"error": "Invalid input image"}

    print(f"[Model] Received image of shape: {image_array.shape}")
    print("[Model] Running AI inference...")

    model = load_plant_model()
    predictions = model.predict(image_array)

    index = np.argmax(predictions[0])
    confidence = float(predictions[0][index])

    return {
        "disease": CLASS_NAMES[index],
        "confidence": round(confidence, 2),
        "status": "AI model prediction successful"
    }
