import json
import numpy as np
from hmmlearn import hmm
import matplotlib.pyplot as plt
import pickle
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix

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

def split_data(sequences, labels, test_size=0.2, random_state=42):
    """Split the data into training and testing sets."""
    train_sequences, test_sequences, train_labels, test_labels = train_test_split(
        sequences, labels, test_size=test_size, random_state=random_state)
    return train_sequences, test_sequences, train_labels, test_labels

def train_hmm(sequences, labels, code_to_num):
    """
    Train an HMM using sequences with label 1.
    """
    # Filter sequences and map codes to numerical values
    filtered_sequences = [
        [code_to_num[code] for code in seq]
        for seq, label in zip(sequences, labels) if label == 1
    ]
    print(filtered_sequences[:5])
    lengths = [len(seq) for seq in filtered_sequences]
    seq_arr = np.concatenate([np.array(seq) for seq in filtered_sequences]).reshape(-1, 1)
    
    # Initialize and train the HMM
    model = hmm.CategoricalHMM(
        n_components=2, n_iter=100, random_state=1, init_params=""
    )
    model.startprob_ = np.array([0.9, 0.1])  # Start probabilities
    model.transmat_ = np.array([[0.9, 0.1], [0.2, 0.8]])  # Transition matrix

    # Train the model
    model.fit(X=seq_arr, lengths=lengths)
    return model

def predict(model, sequence, code_to_num):
    """
    Predict whether a sequence contains a motif (state 1).
    """
    seq_arr = np.array([code_to_num[code] for code in sequence]).reshape(-1, 1)
    _, states = model.decode(seq_arr, algorithm='viterbi')
    return 1 in states  # Returns True if any state is '1'

def test_hmm(model, sequences, labels, code_to_num):
    """
    Test the HMM on a set of sequences and evaluate accuracy.
    """
    correct = 0
    total = len(sequences)
    for seq, label in zip(sequences, labels):
        pred = predict(model, seq, code_to_num)
        correct += int(pred == (label == 1))  # True positive/negative
    accuracy = correct / total
    return accuracy

def plot_accuracy(model, sequences, labels, code_to_num):
    predictions = [predict(model, seq, code_to_num) for seq in sequences]
    plt.figure(figsize=(8, 4))
    indices = range(len(labels))  # Indexy sekvencí
    plt.scatter(indices, labels, label='True Labels', color='blue', alpha=0.6)
    plt.scatter(indices, predictions, label='Predicted Labels', color='orange', alpha=0.6)
    plt.xlabel('Sequence Index')
    plt.ylabel('Label')
    plt.legend()
    plt.title('True vs Predicted Labels')
    plt.grid(True, alpha=0.3)
    plt.savefig('graf.png')
    print("Graf byl uložen jako 'graf.png'")


def plot_accuracy_sampled(model, sequences, labels, code_to_num, sample_size=100):
    predictions = [predict(model, seq, code_to_num) for seq in sequences]
    indices = np.arange(len(labels))
    
    # Náhodně vybereme vzorek dat
    sampled_indices = np.random.choice(indices, size=min(sample_size, len(indices)), replace=False)
    sampled_indices.sort()  # Pro zajištění správného pořadí

    sampled_labels = [labels[i] for i in sampled_indices]
    sampled_predictions = [predictions[i] for i in sampled_indices]
    
    plt.figure(figsize=(10, 6))
    plt.scatter(sampled_indices, sampled_labels, label='True Labels', color='blue', alpha=0.7)
    plt.scatter(sampled_indices, sampled_predictions, label='Predicted Labels', color='orange', alpha=0.7)
    plt.xlabel('Sequence Index (Sampled)')
    plt.ylabel('Label (0 or 1)')
    plt.legend()
    plt.title(f'True vs Predicted Labels (Sampled {sample_size} Points)')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('sampled_graf.png')
    print(f"Graf byl uložen jako 'sampled_graf.png'")
    
    
def plot_accuracy_aggregated(model, sequences, labels, code_to_num, block_size=100):
    predictions = [predict(model, seq, code_to_num) for seq in sequences]
    indices = np.arange(len(labels))
    
    # Rozdělení na bloky
    num_blocks = len(labels) // block_size
    block_accuracies = []
    for i in range(num_blocks):
        block_labels = labels[i * block_size: (i + 1) * block_size]
        block_predictions = predictions[i * block_size: (i + 1) * block_size]
        block_accuracy = np.mean([pred == (label == 1) for pred, label in zip(block_predictions, block_labels)])
        block_accuracies.append(block_accuracy)

    plt.figure(figsize=(10, 6))
    plt.plot(range(len(block_accuracies)), block_accuracies, label='Block Accuracy', color='green', marker='o')
    plt.xlabel(f'Block Index (Size {block_size})')
    plt.ylabel('Accuracy')
    plt.ylim(0, 1)
    plt.legend()
    plt.title(f'Aggregated Accuracy (Block Size {block_size})')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('aggregated_graf.png')
    print(f"Graf byl uložen jako 'aggregated_graf.png'")


def plot_accuracy_heatmap(model, sequences, labels, code_to_num):
    predictions = [predict(model, seq, code_to_num) for seq in sequences][:100]
    confusion_matrix = np.array([labels[:100], predictions])
    
    plt.figure(figsize=(10, 6))
    sns.heatmap(confusion_matrix, cmap='coolwarm', annot=True, fmt='d', xticklabels=['False', 'True'], yticklabels=['Labels', 'Predictions'])
    plt.title('Heatmap of True vs Predicted Labels')
    plt.tight_layout()
    plt.savefig('heatmap_graf.png')
    print("Graf byl uložen jako 'heatmap_graf.png'")
    

def plot_confusion_matrix(model, sequences, labels, code_to_num):
    predictions = [predict(model, seq, code_to_num) for seq in sequences]

    cm = confusion_matrix(labels, predictions)

    total = cm.sum()
    tp_percentage = cm[1, 1] / total * 100
    tn_percentage = cm[0, 0] / total * 100
    fp_percentage = cm[0, 1] / total * 100
    fn_percentage = cm[1, 0] / total * 100

    fig, axs = plt.subplots(2, 2, figsize=(10, 8))

    # True Positive
    axs[0, 0].imshow(np.ones((1, 1)), cmap='Blues', aspect='auto')
    axs[0, 0].set_title(f'True Positive: {cm[1, 1]} ({tp_percentage:.2f}%)')
    axs[0, 0].axis('off')

    # True Negative
    axs[0, 1].imshow(np.ones((1, 1)), cmap='Greens', aspect='auto')
    axs[0, 1].set_title(f'True Negative: {cm[0, 0]} ({tn_percentage:.2f}%)')
    axs[0, 1].axis('off')

    # False Positive
    axs[1, 0].imshow(np.ones((1, 1)), cmap='Reds', aspect='auto')
    axs[1, 0].set_title(f'False Positive: {cm[0, 1]} ({fp_percentage:.2f}%)')
    axs[1, 0].axis('off')

    # False Negative
    axs[1, 1].imshow(np.ones((1, 1)), cmap='Oranges', aspect='auto')
    axs[1, 1].set_title(f'False Negative: {cm[1, 0]} ({fn_percentage:.2f}%)')
    axs[1, 1].axis('off')

    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    plt.show()
    print("Graf záměny byl uložen jako 'confusion_matrix.png'")


def save_model(model, filename):
    with open(filename, 'wb') as f:
        pickle.dump(model, f)
    print(f"Model byl úspěšně uložen do souboru: {filename}")

# Main execution
if __name__ == "__main__":
    json_file = "patients.json"
    sequences, labels, code_to_num = load_data(json_file)
    
    train_sequences, test_sequences, train_labels, test_labels = split_data(sequences,labels)
    
    # Train the model
    model = train_hmm(train_sequences, train_labels, code_to_num)
    
    # Test the model
    accuracy = test_hmm(model, test_sequences, test_labels, code_to_num)
    print(f"Accuracy: {100*accuracy:.2f}%")
    plot_accuracy_sampled(model, test_sequences, test_labels, code_to_num, sample_size=500)
    plot_accuracy_aggregated(model, test_sequences, test_labels, code_to_num, block_size=50)
    plot_accuracy_heatmap(model, test_sequences, test_labels, code_to_num)
    plot_confusion_matrix(model, sequences, labels, code_to_num)
    
    save_model(model, 'hmm_model2.pkl')
