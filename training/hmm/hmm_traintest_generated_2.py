import numpy as np
import random
import json
from hmmlearn import hmm
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split


class_1_codes = ["96167", "09543", "89131"]
class_0_codes = ["0500570", "89111", "87513"]
random_codes = [
    "96863", "96621", "09125", "09119", "09511", "97111", "25022", "25213", "42520",
    "42022", "25023", "42023", "96163", "96623", "89611", "09220", "96711", "87613",
    "96315", "87231", "09223", "09219", "89615", "09513", "96325", "87523", "09215",
    "87217", "99991", "96713", "87215", "25113", "25217", "51881", "89127", "87129",
    "96515","96617", "09541", "25110", "25215", "89513", "89514", "09532", "89617",
    "25227", "87127", "87517", "25117", "87525", "87447", "89619", "89119", "42510",
    "87519", "87433", "25123", "87223", "89123", "96857", "89143", "09133", "87431",
    "25021", "87225", "25121", "25225", "09523", "25135", "00042", "87435", "87439",
    "96813", "89713", "96157", "89517", "89725", "89813", "42021", "09115", "87131",
    "0189992", "27101", "87449", "87511", "57243", "89125", "96165", "0150121", "09237",
    "09127", "89313", "89117", "0210773"
]

def generate_sequence(sequence_length, class_codes, num_random_codes=5, repeat_count=5):
    """Generátor, který generuje sekvenci s kódy pro danou třídu a náhodné kódy."""
    if sequence_length < 8:
        raise ValueError("Sekvence musí být alespoň délky 5.")
    
    specific_codes = class_codes * repeat_count
    random_codes_unique = random.sample(random_codes, num_random_codes)
    valid_codes = specific_codes + random_codes_unique

    sequence = []
    while len(sequence) < sequence_length:
        sequence.append(random.choice(valid_codes))
    
    return sequence


def generate_sequences(
    num_sequences=100,
    sequence_length=10,
    num_random_codes=5,
    repeat_count=5
):
    """
    Generuje náhodné sekvence pro třídu 0 a 1.
    Sekvence třídy 1 bude obsahovat kódy pro třídu 1 a náhodně vybrané kódy.
    Sekvence třídy 0 bude obsahovat kódy pro třídu 0 a náhodně vybrané kódy.
    """
    sequences = []
    
    num_label_1 = num_sequences // 2
    num_label_0 = num_sequences - num_label_1

    for _ in range(num_label_1):
        sequence = generate_sequence(sequence_length, class_1_codes, num_random_codes, repeat_count)
        sequences.append({"label": 1, "codes": sequence})

    for _ in range(num_label_0):
        sequence = generate_sequence(sequence_length, class_0_codes, num_random_codes, repeat_count)
        sequences.append({"label": 0, "codes": sequence})

    random.shuffle(sequences)
    return sequences


def split_data(sequences, labels, test_size=0.2, random_state=42):
    """Split the data into training and testing sets."""
    train_sequences, test_sequences, train_labels, test_labels = train_test_split(
        sequences, labels, test_size=test_size, random_state=random_state)
    return train_sequences, test_sequences, train_labels, test_labels


def train_hmm(sequences):
    model = hmm.CategoricalHMM(
        n_components=2, n_iter=100, random_state=42, init_params=""
    )
    lengths = [len(seq) for seq in sequences]
    X = np.concatenate(sequences).reshape(-1, 1)
    model.startprob_ = np.array([0.9, 0.1]) 
    model.transmat_ = np.array([[0.9, 0.1], [0.3, 0.7]]) 
    model.fit(X, lengths)
    return model


def predict(model, sequence):
    """
    Predikce, zda sekvence obsahuje sekvenci pro danou třídu (stav 1).
    """
    seq_arr = np.array(sequence).reshape(-1, 1)
    _, states = model.decode(seq_arr, algorithm='viterbi')

    return 1 if any(state == 1 for state in states) else 0


def evaluate_model(model, sequences, labels):
    y_true = labels
    y_pred = []

    for seq, label in zip(sequences, labels):
        pred = predict(model, seq)
        y_pred.append(pred)

    cm = confusion_matrix(y_true, y_pred, labels=[1, 0])
    report = classification_report(y_true, y_pred, labels=[1, 0])
    return cm, report


def save_sequences_to_json(sequences, filename="sequences.json"):
    """Uloží sekvence do JSON souboru."""
    with open(filename, 'w') as f:
        json.dump(sequences, f, indent=4)


if __name__ == "__main__":
    num_sequences = 5000
    sequence_length = 50

    raw_sequences = generate_sequences(num_sequences=num_sequences, sequence_length=sequence_length)
    save_sequences_to_json(raw_sequences, "sequences.json")
    
    label_encoder = LabelEncoder()

    all_codes = [item['codes'] for item in raw_sequences]

    unique_codes = class_1_codes + class_0_codes + random_codes
    label_encoder.fit(unique_codes)

    encoded_all_sequences = [
        label_encoder.transform(seq) for seq in all_codes
    ]

    train_sequences, test_sequences, train_labels, test_labels = split_data(
        encoded_all_sequences, [item['label'] for item in raw_sequences]
    )
    
    filtered_sequences = [
        seq for seq, label in zip(train_sequences, train_labels)
    ]
    model = train_hmm(filtered_sequences)

    cm, report = evaluate_model(model, test_sequences, test_labels)

    print("Confusion Matrix:")
    print(cm)

    print("\nClassification Report:")
    print(report)
