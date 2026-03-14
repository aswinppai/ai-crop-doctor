import numpy as np
from PIL import Image

def preprocess_image(img_path):
    """
    Load an image from the filesystem and apply transformations suitable for a Deep Learning model.
    """
    try:
        # Load image
        img = Image.open(img_path)
        
        # Ensure image is in RGB format
        if img.mode != 'RGB':
             img = img.convert('RGB')
             
        # Resize image to match model input shape (28x28)
        img = img.resize((28, 28))
        
        # Convert to numpy array and normalize pixel values
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return None
