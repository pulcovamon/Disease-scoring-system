import json
import csv
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
from collections import Counter

# Načtení dat
with open('data/patients.json', 'r') as f:
    data = json.load(f)

# Příprava sekvencí podle labelu
docs_label_0 = [' '.join(seq['codes']) for p in data['patients'] for seq in p['sequences'] if seq['label'] == 0]
docs_label_1 = [' '.join(seq['codes']) for p in data['patients'] for seq in p['sequences'] if seq['label'] == 1]

# Příprava frekvence všech kódů
all_codes = [code for p in data['patients'] for seq in p['sequences'] for code in seq['codes']]
code_frequencies = Counter(all_codes)

# TF-IDF pro label 0
vectorizer_0 = TfidfVectorizer()
X0 = vectorizer_0.fit_transform(docs_label_0)
mean_tfidf_0 = X0.mean(axis=0).A1
codes_0 = vectorizer_0.get_feature_names_out()
df_0 = pd.DataFrame({'code': codes_0, 'tfidf_label_0': mean_tfidf_0})

# TF-IDF pro label 1
vectorizer_1 = TfidfVectorizer()
X1 = vectorizer_1.fit_transform(docs_label_1)
mean_tfidf_1 = X1.mean(axis=0).A1
codes_1 = vectorizer_1.get_feature_names_out()
df_1 = pd.DataFrame({'code': codes_1, 'tfidf_label_1': mean_tfidf_1})

# Sloučení TF-IDF hodnot
df = pd.merge(df_0, df_1, on='code', how='outer').fillna(0.0)

# Přidání frekvence
df['frequency'] = df['code'].map(code_frequencies).fillna(0).astype(int)

# Seřazení a uložení
df = df.sort_values('code')
df.to_csv('data/code_tfidf_by_label.csv', index=False)
print("✅ Hotovo! Výstup uložen do data/code_tfidf_by_label.csv")
