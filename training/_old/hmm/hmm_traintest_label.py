import json
import numpy as np
from hmmlearn import hmm


def load_data(json_file):
    """Load JSON data and extract sequences and their labels."""
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    sequences = []
    labels = []
    for patient in data["patients"]:
        sequences.extend([entry['codes'] for entry in patient["sequences"]])
        labels.extend([entry['label'] for entry in patient["sequences"]])  # Assuming each entry has a 'label' (0 or 1)
        
    unique_codes = list({code for seq in sequences for code in seq})
    # Create mapping from code to numerical value
    code_to_num = {code: i for i, code in enumerate(unique_codes)}

    return sequences, labels, code_to_num


def prepare_sequences(sequences, labels, code_to_num):
    """Convert sequences of codes to numerical format using the mapping, along with their labels."""
    num_sequences = []
    lengths = []
    y_labels = []  # Labels for each sequence

    for seq, label in zip(sequences, labels):
        lengths.append(len(seq))
        num_sequences.extend([code_to_num[code] for code in seq])
        y_labels.extend([label] * len(seq))  # Assign the same label to all codes in the sequence

    return np.array(num_sequences).reshape(-1, 1), np.array(y_labels), lengths


def train_hmm(sequences, labels, code_to_num):
    """Train an HMM model using the provided sequences, labels, and mapping."""
    seq_arr, y_labels, lengths = prepare_sequences(sequences, labels, code_to_num)

    model = hmm.CategoricalHMM(
        n_components=2,  # Two states: background (0) and motif (1)
        n_iter=100,
        init_params='',
        random_state=1
    )

    # Initial probabilities (based on labels, assuming a rough estimate)
    start_prob_0 = np.sum(y_labels == 0) / len(y_labels)
    start_prob_1 = np.sum(y_labels == 1) / len(y_labels)
    model.startprob_ = np.array([start_prob_0, start_prob_1])

    # Transition probabilities (initial estimate, you can refine this later)
    model.transmat_ = np.array([
        [0.9, 0.1],  # From background to [background, motif]
        [0.2, 0.8]   # From motif to [background, motif]
    ])

    # Emission probabilities (uniform for simplicity)
    num_codes = len(code_to_num)
    model.emissionprob_ = np.full((2, num_codes), 1 / num_codes)

    # Train the model
    model.fit(seq_arr, lengths)
    return model


def test_hmm(model, sequences, labels, code_to_num):
    """Test the HMM model on given sequences with their labels."""
    seq_arr, y_labels, lengths = prepare_sequences(sequences, labels, code_to_num)

    # Decode sequences to find the most likely state sequence
    _, states_sequence = model.decode(seq_arr, lengths, algorithm='viterbi')

    # Predict motif presence (state 1) in each sequence
    eval_results = []
    state_idx = 0

    for length, true_label in zip(lengths, y_labels):
        current_states = states_sequence[state_idx:state_idx + length]
        predicted_label = 1 if 1 in current_states else 0
        eval_results.append(predicted_label == true_label)  # Compare with the true label
        state_idx += length

    # Return fraction of sequences predicted correctly (accuracy)
    return sum(eval_results) / len(eval_results)


# Main script
if __name__ == "__main__":
    json_file = "patients_filtered.json"

    # Load data and create mapping
    sequences, labels, code_to_num = load_data(json_file)
    
    with open('sequencies.json', 'w') as f:
        json.dump(sequences, f, indent=4)

    # Split data into training and testing (80-20 split)
    split_idx = int(0.8 * len(sequences))
    train_sequences = sequences[:split_idx]
    train_labels = labels[:split_idx]
    test_sequences = sequences[split_idx:]
    test_labels = labels[split_idx:]

    # Train HMM
    model = train_hmm(train_sequences, train_labels, code_to_num)

    # Test HMM
    accuracy = test_hmm(model, test_sequences, test_labels, code_to_num)
    print(f"Model accuracy on test data: {accuracy * 100:.2f}%")
