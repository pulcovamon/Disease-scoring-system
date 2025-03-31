import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

with open('patients.json', 'r') as f:
    data = json.load(f)

documents = []
labels = []

for patient in data['patients']:
    for sequence in patient['sequences']:
        documents.append(' '.join(sequence['codes']))
        labels.append(sequence['label'])

codes_label_1 = [sequence['codes'] for patient in data['patients'] for sequence in patient['sequences'] if sequence['label'] == 1]
codes_label_0 = [sequence['codes'] for patient in data['patients'] for sequence in patient['sequences'] if sequence['label'] == 0]

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

relevant_codes_label_1 = sorted(zip(feature_names, tfidf_scores), key=lambda x: x[1], reverse=True)
relevant_codes_label_0 = sorted(zip(feature_names, -tfidf_scores), key=lambda x: x[1], reverse=True)

print("TF-IDF real data")
print("\nclass 1:")
for code, score in relevant_codes_label_1[:10]:
    print(f"code: {code}, TF-IDF score: {score}")

print("\nclass 0:")
for code, score in relevant_codes_label_0[:10]:
    print(f"code: {code}, TF-IDF score: {score}")
