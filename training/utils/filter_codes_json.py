import json
from collections import Counter

N = 100

with open('labeled_data.json', 'r') as f:
    patients_data = json.load(f)

def create_sequences(patient_data, allowed_codes):
    sequences = []
    
    ground_truth = patient_data['active_phase']['ground_truth']
    
    codes = patient_data['codes']
    
    current_sequence = []
    
    count = 0
    for i in range(len(codes)):
        code = codes[i]
        
        if code.startswith("'"):
            code = code[1:]
            if current_sequence: 
                label = ground_truth[count] if count < len(ground_truth) else None
                sequences.append({"label": label, "codes": current_sequence})
                current_sequence = [] 
                count += 1
        
        if code in allowed_codes:
            current_sequence.append(code)
    
    if current_sequence:
        label = ground_truth[count] if count < len(ground_truth) else None
        sequences.append({"label": label, "codes": current_sequence})

    sequences = [seq for seq in sequences if seq['codes']]

    return sequences

all_codes = []
for patient in patients_data:
    all_codes.extend(patient['codes'])

code_counts = Counter(all_codes)
most_common_codes = set([code for code, _ in code_counts.most_common(N)])

print("Nejčastější kódy a jejich četnost:")
for code, count in code_counts.most_common(N):
    print(f"Kód: {code}, Četnost: {count}")

result = {'patients': []}
total_sequence_lengths = 0
total_sequences = 0

for patient in patients_data:
    patient_id = patient['_id']
    sequences = create_sequences(patient, most_common_codes)
    
    result['patients'].append({
        'id': patient_id,
        'sequences': sequences
    })
    
    for seq in sequences:
        total_sequence_lengths += len(seq['codes'])
        total_sequences += 1

with open('patients_filtered.json', 'w') as f:
    json.dump(result, f, indent=4)

average_sequence_length = total_sequence_lengths / total_sequences if total_sequences > 0 else 0

print(f"Average sequence length: {average_sequence_length:.2f}")
