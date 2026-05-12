import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

app = Flask(__name__)
CORS(app)

# --- Train model on startup ---
print("Loading dataset and training model...")
data = pd.read_csv("spam_sms.csv", usecols=["v1", "v2"])
data.dropna(inplace=True)
data["label"] = data["v1"].map({"ham": 0, "spam": 1})

X = data["v2"]
y = data["label"]

model = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english")),
    ("clf", LogisticRegression()),
])
model.fit(X, y)
print("Model trained successfully!")


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "SMS Spam Predictor API is running. Send POST requests to /predict."
    })


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True)
    if not body or "message" not in body:
        return jsonify({"error": "Missing 'message' field in request body"}), 400

    text = body["message"].strip()
    if not text:
        return jsonify({"error": "Message cannot be empty"}), 400

    prediction = int(model.predict([text])[0])
    proba = model.predict_proba([text])[0]
    confidence = round(float(proba[prediction]) * 100, 2)

    return jsonify({
        "prediction": prediction,           # 1 = spam, 0 = not spam
        "label": "spam" if prediction == 1 else "ham",
        "confidence": confidence
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
