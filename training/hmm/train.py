import json
import numpy as np
from hmmlearn import hmm

# Načtení JSON dat
def load_json_data(json_file):
    with open(json_file, "r") as file:
        data = json.load(file)
    return data

# Rozdělení dat na trénovací a testovací
def split_data(data, train_ratio=0.8):
    train_data = []
    test_data = []
    for obj in data:
        codes = obj.get("codes", [])
        split_idx = int(len(codes) * train_ratio)
        train_data.extend(codes[:split_idx])  # Trénovací data
        test_data.extend(codes[split_idx:])  # Testovací data
    return train_data, test_data

# Příprava dat pro HMM (transformace na formát číselných hodnot)
def prepare_sequences(data):
    unique_codes = sorted(set(data))
    code_to_int = {code: i for i, code in enumerate(unique_codes)}
    int_sequences = [code_to_int[code] for code in data]
    return int_sequences, code_to_int

# Trénování HMM
def train_hmm(train_data, n_components=4):
    model = hmm.MultinomialHMM(n_components=n_components, n_iter=100, random_state=42)
    lengths = [len(train_data)]  # Délka sekvencí
    train_array = np.array(train_data).reshape(-1, 1)  # Reshape pro HMM
    model.fit(train_array, lengths)
    return model

# Testování HMM
def test_hmm(model, test_data):
    test_array = np.array(test_data).reshape(-1, 1)
    log_likelihood = model.score(test_array)
    return log_likelihood

# Hlavní část
if __name__ == "__main__":
    json_file = "data.json"  # Zadejte cestu k vašemu JSON souboru
    data = load_json_data(json_file)
    
    # Rozdělení na trénovací a testovací data
    train_data, test_data = split_data(data)
    
    # Příprava sekvencí
    train_sequences, code_to_int = prepare_sequences(train_data)
    test_sequences, _ = prepare_sequences(test_data)
    
    # Trénování HMM
    print("Trénování HMM modelu...")
    model = train_hmm(train_sequences)

    # Testování HMM
    print("Testování HMM modelu...")
    score = test_hmm(model, test_sequences)
    print(f"Log-Likelihood skóre testovacích dat: {score}")
