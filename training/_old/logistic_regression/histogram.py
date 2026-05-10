import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import matplotlib.pyplot as plt
from collections import Counter

with open('patients.json', 'r') as f:
    data = json.load(f)

documents = []
labels = []

for patient in data['patients']:
    for sequence in patient['sequences']:
        documents.append(' '.join(sequence['codes'])) 
        labels.append(sequence['label']) 

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

top_codes_label_1 = [code for code, score in relevant_codes_label_1[:10]]

top_codes_label_0 = [code for code, score in relevant_codes_label_0[:10]]

codes_label_1 = [sequence['codes'] for patient in data['patients'] for sequence in patient['sequences'] if sequence['label'] == 1]
codes_label_0 = [sequence['codes'] for patient in data['patients'] for sequence in patient['sequences'] if sequence['label'] == 0]

all_codes_label_1_freq = Counter([code for seq in codes_label_1 for code in seq])
all_codes_label_0_freq = Counter([code for seq in codes_label_0 for code in seq])

all_top_codes = list(set(top_codes_label_1).union(set(top_codes_label_0)))

print("\nFrequencies for Class 1 and Class 0 (Top 10 Relevant Codes):")
for code in all_top_codes:
    freq_1 = all_codes_label_1_freq.get(code, 0)
    freq_0 = all_codes_label_0_freq.get(code, 0)
    print(f"Code: {code}, Frequency in Class 1: {freq_1}, Frequency in Class 0: {freq_0}")

freq_label_1 = [all_codes_label_1_freq.get(code, 0) for code in all_top_codes]
freq_label_0 = [all_codes_label_0_freq.get(code, 0) for code in all_top_codes]

plt.figure(figsize=(12, 6))

bar_width = 0.4
index = range(len(all_top_codes))

plt.bar([i - bar_width/2 for i in index], freq_label_1, alpha=0.7, color='blue', label='Class 1', width=bar_width)

plt.bar([i + bar_width/2 for i in index], freq_label_0, alpha=0.7, color='red', label='Class 0', width=bar_width)

plt.xlabel('Code')
plt.ylabel('Frequency')
plt.title('Histogram of Top codes according to TF-IDF')
plt.xticks(range(len(all_top_codes)), all_top_codes, rotation=90)

max_y = max(max(freq_label_1), max(freq_label_0))
plt.ylim(0, max_y * 1.1)

plt.legend()

plt.tight_layout()
plt.savefig('histogram.png')

plt.close()
