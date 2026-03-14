from flask import Flask, render_template
from app.routes.predict_route import predict_blueprint
import os

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

# Quick Test Route
@app.route('/test')
def test():
    """
    Simple route to verify the server is running.
    """
    return "Server is working!"

@app.route('/dashboard')
@app.route('/weather.html')
def dashboard():
    """
    Serve the agricultural intelligence dashboard.
    """
    return render_template('dashboard.html')

@app.route('/fertilizer.html')
def fertilizer():
    return "<h1>Fertilizer Suggestions (Coming Soon)</h1><a href='/'>Back to Home</a>"

@app.route('/cropcare.html')
def cropcare():
    return "<h1>Crop Care Plans (Coming Soon)</h1><a href='/'>Back to Home</a>"

if __name__ == '__main__':
    # Start server
    print("Starting AI Crop Doctor Prototype API...")

    # Use platform port if available (for deployment), otherwise use 5000 locally
    port = int(os.environ.get("PORT", 5000))

    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
