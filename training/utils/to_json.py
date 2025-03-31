import json

with open('labeled_data.json', 'r') as f:
    patients_data = json.load(f)

def create_sequences(patient_data):
    sequences = []
    
    ground_truth = patient_data['active_phase']['ground_truth']
    prediction = patient_data['active_phase']['prediction']
    
    codes = patient_data['codes']
    
    current_sequence = []
    
    count = 0
    for i in range(len(codes)):
        code = codes[i]
        
        
        if code.startswith("'"):
            code = code[1:]
            if current_sequence:
                label = ground_truth[count]
                sequences.append({"label": label, "codes": current_sequence})
                current_sequence = []  
                count += 1
        
        current_sequence.append(code)
    
    if current_sequence:
        label = ground_truth[count]
        sequences.append({"label": label, "codes": current_sequence})

    return sequences

result = {'patients': []}

for patient in patients_data:
    patient_id = patient['_id']
    sequences = create_sequences(patient)
    
    result['patients'].append({
        'id': patient_id,
        'sequences': sequences
    })

with open('patients.json', 'w') as f:
    json.dump(result, f, indent=4)