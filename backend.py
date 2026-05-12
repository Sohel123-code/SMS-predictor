import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# feature engineering 
data=pd.read_csv("backend/spam_sms.csv")
data = data[['v1', 'v2']]
data.columns = ['label', 'message']
data['label'] = data['label'].map({'ham': 0, 'spam': 1})



# converting into vectors
vectorizer = TfidfVectorizer(stop_words="english", max_df=0.9, min_df=2, ngram_range=(1, 2))

X = vectorizer.fit_transform(data['message'])  # input
y = data['label']                              # output




X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)




model = LogisticRegression(C=10, class_weight="balanced", max_iter=1000)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)