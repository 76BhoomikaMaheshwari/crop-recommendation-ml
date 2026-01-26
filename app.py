from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
import requests
app = Flask(__name__)

# Load model and preprocessors
model = joblib.load("models/crop_model.pkl")
scaler = joblib.load("models/scaler.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

# Lightweight rule-based lookup for extra crop info shown after prediction.
crop_info = {
    "rice": {"season": "Kharif (monsoon)", "water": "High water requirement; ensure flooded fields"},
    "maize": {"season": "Kharif/Rabi", "water": "Moderate; avoid waterlogging"},
    "chickpea": {"season": "Rabi (cool, dry)", "water": "Low to moderate; well-drained soil"},
    "kidneybeans": {"season": "Kharif", "water": "Moderate; consistent moisture"},
    "pigeonpeas": {"season": "Kharif", "water": "Low; drought-tolerant"},
    "mothbeans": {"season": "Kharif", "water": "Very low; thrives in arid zones"},
    "mungbean": {"season": "Kharif", "water": "Moderate; avoid standing water"},
    "blackgram": {"season": "Kharif", "water": "Moderate; keep soil moist"},
    "lentil": {"season": "Rabi", "water": "Low to moderate; avoid heavy rains"},
    "pomegranate": {"season": "Year-round (best Feb-Mar)", "water": "Moderate; good drainage"},
    "banana": {"season": "Year-round", "water": "High; consistent irrigation"},
    "mango": {"season": "Kharif planting", "water": "Moderate; avoid waterlogging"},
    "grapes": {"season": "Rabi planting", "water": "Moderate; drip preferred"},
    "watermelon": {"season": "Zaid (summer)", "water": "High during fruiting; good drainage"},
    "muskmelon": {"season": "Zaid (summer)", "water": "Moderate; avoid excess"},
    "apple": {"season": "Temperate Rabi", "water": "Moderate; steady moisture"},
    "orange": {"season": "Year-round (best monsoon)", "water": "Moderate; regular irrigation"},
    "papaya": {"season": "Year-round", "water": "High; consistent moisture"},
    "coconut": {"season": "Kharif/Rabi", "water": "High; ample irrigation"},
    "cotton": {"season": "Kharif", "water": "Moderate to high; avoid waterlogging"},
    "jute": {"season": "Kharif", "water": "High; humid conditions"},
    "coffee": {"season": "Rabi planting", "water": "High; shaded, regular irrigation"}
}

@app.route('/')
def home():
    return render_template('crop_recommendation.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Validate and collect data from form
        required_keys = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        data = []
        for key in required_keys:
            raw_val = request.form.get(key, "").strip()
            if raw_val == "":
                return jsonify({"error": "Please fill all fields before submitting."}), 400
            try:
                value = float(raw_val)
            except ValueError:
                return jsonify({"error": f"Invalid number for {key}."}), 400
            if value < 0:
                return jsonify({"error": f"{key} cannot be negative."}), 400
            data.append(value)
        
        # Preprocess input
        data_scaled = scaler.transform([data])
        
        # Make prediction
        prediction_index = model.predict(data_scaled)[0]
        predicted_crop = label_encoder.inverse_transform([prediction_index])[0]

        # Attach friendly info when available
        info = crop_info.get(predicted_crop.lower(), {})

        return jsonify({
            "crop": predicted_crop,
            "info": info
        })
    
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True)

