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

# Quick Test Route
@app.route('/test')
def test():
    """
    Simple route to verify the server is running.
    """
    return "Server is working!"

if __name__ == '__main__':
    # Start server locally
    print("Starting AI Crop Doctor Prototype API...")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
