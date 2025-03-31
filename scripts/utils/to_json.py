import csv
import json

def convert_to_api_format(input_csv_path, output_json_path):
    data = []
    
    with open(input_csv_path, mode='r', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            # Rozdělit sekvenci na jednotlivé kódy a ponechat je jako řetězce
            sequence = row['sequence'].split()
            
            # Převést na požadovaný formát
            formatted_entry = {
                "id": row['Patient ID'],
                "codes": sequence
            }
            data.append(formatted_entry)
    
    # Zapsat výstup do JSON souboru
    with open(output_json_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

# Použití funkce
input_csv_path = "data.csv"  # Cesta k vstupnímu CSV souboru
output_json_path = "output.json"  # Cesta k výstupnímu JSON souboru
convert_to_api_format(input_csv_path, output_json_path)

print(f"Data byla převedena a uložena do {output_json_path}.")
