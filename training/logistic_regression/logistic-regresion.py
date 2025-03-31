import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

data = {
    'code': ['25117', '25121', '25118', '57243', '25122', '0235087', '87437', '0209484', '87435', '0241272',
             '0029631', '89715', '0130141', '0012667', '0126913', '89512', '25213', '89513', '89619', '0028761'],
    'tfidf_score': [9.803821, 7.715321, 4.743081, 3.785607, 3.202028, 2.798700, 2.677819, 2.542802, 2.509637, 2.485574,
                    2.545809, 2.290418, 2.189544, 2.117559, 2.005446, 2.004877, 1.985515, 1.958864, 1.820956, 1.777965],
    'label': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # 1 = motiv, 0 = pozadí
}

df = pd.DataFrame(data)

X = df[['tfidf_score']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

model = LogisticRegression()

model.fit(X_train, y_train)


y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))
