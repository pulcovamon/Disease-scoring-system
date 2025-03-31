import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

with open('sequences.json', 'r') as f:
    data = json.load(f)

documents = [' '.join(item['codes']) for item in data]
labels = [item['label'] for item in data]

codes_label_1 = [item['codes'] for item in data if item['label'] == 1]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(documents)
y = labels

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.33, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

feature_names = vectorizer.get_feature_names_out()
tfidf_scores = model.coef_.flatten()

relevant_codes = sorted(zip(feature_names, tfidf_scores), key=lambda x: x[1], reverse=True)

print("\nRelevant codes for class 1 according to TF-IDF:")
for code, score in relevant_codes[:10]:
    print(f"code: {code}, TF-IDF score: {score}")
