import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Load dataset
df = pd.read_csv("Crop_recommendation.csv")

print("Dataset loaded. Shape:", df.shape)
print("Columns:", df.columns.tolist())

# Encode categorical labels
label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])

print("Classes:", label_encoder.classes_)

# Define features and target variable
X = df.drop(columns=["label"])
y = df["label"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train RandomForestClassifier
rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
rf_classifier.fit(X_train_scaled, y_train)

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

# Save trained model and preprocessing tools
joblib.dump(rf_classifier, "models/crop_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")
joblib.dump(label_encoder, "models/label_encoder.pkl")

print("Model and preprocessors saved successfully!")
print("Training accuracy:", rf_classifier.score(X_train_scaled, y_train))
print("Testing accuracy:", rf_classifier.score(X_test_scaled, y_test))
