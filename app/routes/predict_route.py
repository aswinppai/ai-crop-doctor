from flask import Blueprint, request, jsonify
from app.utils.preprocess import preprocess_image
from app.model.plant_model import predict_disease
import os

predict_blueprint = Blueprint('predict', __name__)

@predict_blueprint.route('/predict', methods=['POST'])
def predict():
    """
    Handle incoming image requests, run the AI pipeline, and return the mock prediction.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        # Save temp file for processing
        temp_path = "temp_" + file.filename
        file.save(temp_path)
        
        # 1. Preprocess
        processed_image = preprocess_image(temp_path)
        
        # 2. Predict
        prediction_result = predict_disease(processed_image)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify(prediction_result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
