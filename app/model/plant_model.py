import random
import time

def predict_disease(image_array):
    """
    Mock prediction function representing the AI Pipeline using the preprocessed image array.
    This simulates inference latency and returns a mock prediction.
    """
    if image_array is None:
        return {"error": "Invalid input image or preprocessing failed."}
        
    print(f"[Model] Received image of shape: {image_array.shape}")
    print("[Model] Running inference...")
    
    # Simulate processing time
    time.sleep(1.5)
    
    # Mock classes
    mock_classes = [
        "Healthy",
        "Early Blight",
        "Late Blight",
        "Powdery Mildew",
        "Rust"
    ]
    
    # Return a random prediction with confidence
    prediction = random.choice(mock_classes)
    confidence = round(random.uniform(0.70, 0.99), 2)
    
    return {
        "disease": prediction,
        "confidence": confidence,
        "status": "prediction pipeline working"
    }
