import pandas as pd
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

app = Flask(__name__)
CORS(app)

# 🔥 --- Text Cleaning Function ---
def clean_text(text):
    text = text.lower()
    text = re.sub(r'\W', ' ', text)      # remove special chars
    text = re.sub(r'\s+', ' ', text)     # remove extra spaces
    return text.strip()

# --- Train model on startup ---
print("Loading dataset and training model...")

data = pd.read_csv("spam_sms.csv", usecols=["v1", "v2"])
data.dropna(inplace=True)

# rename columns (clean)
data.columns = ["label", "message"]

# map labels
data["label"] = data["label"].map({"ham": 0, "spam": 1})

# 🔥 apply cleaning
data["message"] = data["message"].apply(clean_text)

X = data["message"]
y = data["label"]

# 🔥 Improved Pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        max_df=0.9,
        min_df=2,
        sublinear_tf=True
    )),
    ("clf", LogisticRegression(
        C=5,
        class_weight="balanced",
        max_iter=2000
    )),
])

model.fit(X, y)

print("Model trained successfully!")
print("Dataset size:", len(data))

# --- Routes ---

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
        return jsonify({"error": "Missing 'message' field"}), 400

    text = body["message"]

    if not text.strip():
        return jsonify({"error": "Message cannot be empty"}), 400

    # 🔥 apply same cleaning to input
    text = clean_text(text)

    prediction = int(model.predict([text])[0])
    proba = model.predict_proba([text])[0]
    confidence = round(float(proba[prediction]) * 100, 2)

    return jsonify({
        "prediction": prediction,
        "label": "spam" if prediction == 1 else "ham",
        "confidence": confidence
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)