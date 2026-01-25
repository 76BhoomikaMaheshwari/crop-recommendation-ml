from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import requests
app = Flask(__name__)

# Load model and preprocessors
model = joblib.load("models/crop_model.pkl")
scaler = joblib.load("models/scaler.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

@app.route('/')
def home():
    return render_template('crop_recommendation.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get data from form
        data = [float(request.form[key]) for key in ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
        
        # Preprocess input
        data_scaled = scaler.transform([data])
        
        # Make prediction
        prediction_index = model.predict(data_scaled)[0]
        predicted_crop = label_encoder.inverse_transform([prediction_index])[0]

        return jsonify({"crop": predicted_crop})
    
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True)

