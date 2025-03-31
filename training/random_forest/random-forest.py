import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

data = {
    'code': ['25117', '25121', '25118', '57243', '25122', '0235087', '87437', '0209484', '87435', '0241272',
             '0029631', '89715', '0130141', '0012667', '0126913', '89512', '25213', '89513', '89619', '0028761'],
    'tfidf_score': [9.803821, 7.715321, 4.743081, 3.785607, 3.202028, 2.798700, 2.677819, 2.542802, 2.509637, 2.485574,
                    2.545809, 2.290418, 2.189544, 2.117559, 2.005446, 2.004877, 1.985515, 1.958864, 1.820956, 1.777965],
    'label': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # 1 = motif, 0 = background
}

df = pd.DataFrame(data)

X = df[['tfidf_score']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
rf_classifier.fit(X_train, y_train)

model_filename = "random_forest_model.pkl"
joblib.dump(rf_classifier, model_filename)
print(f"Model uložen do {model_filename}")

loaded_model = joblib.load(model_filename)
y_pred = loaded_model.predict(X_test)

print("result:")
print(classification_report(y_test, y_pred))

feature_importances = loaded_model.feature_importances_
print("feature importance:", feature_importances)
