from flask import Flask, render_template
from app.routes.predict_route import predict_blueprint

# Initialize Flask app
app = Flask(__name__)

# Register prediction routes
app.register_blueprint(predict_blueprint)

# Basic frontend route
@app.route('/')
def home():
    """
    Serve the frontend HTML template.
    """
    return render_template('index.html')

if __name__ == '__main__':
    # Start server locally
    print("Starting AI Crop Doctor Prototype API...")
    app.run(debug=True, port=5000)
