import json
import numpy as np
from hmmlearn import hmm


def load_data(json_file):
    """Load JSON data and extract unique codes."""
    with open(json_file, 'r') as f:
        data = json.load(f)

    sequencies
    sequences = [entry['codes'] for entry in data]
    unique_codes = list({code for seq in sequences for code in seq})

    # Create mapping from code to numerical value
    code_to_num = {code: i for i, code in enumerate(unique_codes)}

    return sequences, code_to_num


def prepare_sequences(sequences, code_to_num):
    """Convert sequences of codes to numerical format using the mapping."""
    num_sequences = []
    lengths = []

    for seq in sequences:
        lengths.append(len(seq))
        num_sequences.extend([code_to_num[code] for code in seq])

    return np.array(num_sequences).reshape(-1, 1), lengths


def train_hmm(sequences, code_to_num):
    """Train an HMM model using the provided sequences and mapping."""
    seq_arr, lengths = prepare_sequences(sequences, code_to_num)

    model = hmm.CategoricalHMM(
        n_components=2,  # Two states: background and motif
        n_iter=100,
        init_params='',
        random_state=1
    )

    # Initial probabilities
    model.startprob_ = np.array([0.9, 0.1])

    # Transition probabilities
    model.transmat_ = np.array([
        [0.9, 0.1],  # Background to [Background, Motif]
        [0.2, 0.8]   # Motif to [Background, Motif]
    ])

    # Emission probabilities (uniform for simplicity)
    num_codes = len(code_to_num)
    model.emissionprob_ = np.full((2, num_codes), 1 / num_codes)

    # Train the model
    model.fit(seq_arr, lengths)
    return model


def test_hmm(model, sequences, code_to_num):
    """Test the HMM model on given sequences."""
    seq_arr, lengths = prepare_sequences(sequences, code_to_num)

    # Decode sequences to find the most likely state sequence
    _, states_sequence = model.decode(seq_arr, lengths, algorithm='viterbi')

    # Predict motif presence (state 1) in each sequence
    eval_results = []
    state_idx = 0

    for length in lengths:
        current_states = states_sequence[state_idx:state_idx + length]
        eval_results.append(1 if 1 in current_states else 0)
        state_idx += length

    # Return fraction of sequences predicted to contain the motif
    return sum(eval_results) / len(eval_results)


# Main script
if __name__ == "__main__":
    json_file = "filtered_top_codes.json"

    # Load data and create mapping
    sequences, code_to_num = load_data(json_file)

    # Split data into training and testing (80-20 split)
    split_idx = int(0.8 * len(sequences))
    train_sequences = sequences[:split_idx]
    test_sequences = sequences[split_idx:]

    # Train HMM
    model = train_hmm(train_sequences, code_to_num)

    # Test HMM
    accuracy = test_hmm(model, test_sequences, code_to_num)
    print(f"Model accuracy on test data: {accuracy * 100:.2f}%")
