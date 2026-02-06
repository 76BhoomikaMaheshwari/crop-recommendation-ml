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
    "rice": {"season": "Kharif (monsoon)", "water": "High water requirement; ensure flooded fields", "soil": "Clayey or loamy, high water retention"},
    "maize": {"season": "Kharif/Rabi", "water": "Moderate; avoid waterlogging", "soil": "Well-drained loamy soil"},
    "chickpea": {"season": "Rabi (cool, dry)", "water": "Low to moderate; well-drained soil", "soil": "Sandy loam to loam"},
    "kidneybeans": {"season": "Kharif", "water": "Moderate; consistent moisture", "soil": "Loamy, rich organic matter"},
    "pigeonpeas": {"season": "Kharif", "water": "Low; drought-tolerant", "soil": "Well-drained loam"},
    "mothbeans": {"season": "Kharif", "water": "Very low; thrives in arid zones", "soil": "Sandy to sandy loam"},
    "mungbean": {"season": "Kharif", "water": "Moderate; avoid standing water", "soil": "Loamy, well-drained"},
    "blackgram": {"season": "Kharif", "water": "Moderate; keep soil moist", "soil": "Clay loam to loam"},
    "lentil": {"season": "Rabi", "water": "Low to moderate; avoid heavy rains", "soil": "Sandy loam"},
    "pomegranate": {"season": "Year-round (best Feb-Mar)", "water": "Moderate; good drainage", "soil": "Light loam, well-drained"},
    "banana": {"season": "Year-round", "water": "High; consistent irrigation", "soil": "Deep, rich loamy soil"},
    "mango": {"season": "Kharif planting", "water": "Moderate; avoid waterlogging", "soil": "Loamy, well-drained"},
    "grapes": {"season": "Rabi planting", "water": "Moderate; drip preferred", "soil": "Sandy loam with good drainage"},
    "watermelon": {"season": "Zaid (summer)", "water": "High during fruiting; good drainage", "soil": "Sandy loam"},
    "muskmelon": {"season": "Zaid (summer)", "water": "Moderate; avoid excess", "soil": "Sandy loam"},
    "apple": {"season": "Temperate Rabi", "water": "Moderate; steady moisture", "soil": "Loamy, well-drained"},
    "orange": {"season": "Year-round (best monsoon)", "water": "Moderate; regular irrigation", "soil": "Loamy to clay loam"},
    "papaya": {"season": "Year-round", "water": "High; consistent moisture", "soil": "Well-drained loam"},
    "coconut": {"season": "Kharif/Rabi", "water": "High; ample irrigation", "soil": "Sandy to loamy"},
    "cotton": {"season": "Kharif", "water": "Moderate to high; avoid waterlogging", "soil": "Black soil or loam"},
    "jute": {"season": "Kharif", "water": "High; humid conditions", "soil": "Alluvial, silt loam"},
    "coffee": {"season": "Rabi planting", "water": "High; shaded, regular irrigation", "soil": "Well-drained, rich humus"}
}

@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/app')
def app_page():
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

        confidence = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(data_scaled)[0]
            confidence = float(np.max(probs))

        # Attach friendly info when available
        info = crop_info.get(predicted_crop.lower(), {})

        response = {
            "crop": predicted_crop,
            "info": info
        }
        if confidence is not None:
            response["confidence"] = confidence

        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True)

