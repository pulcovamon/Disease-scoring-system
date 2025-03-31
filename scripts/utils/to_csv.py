import csv
import json

def convert_to_api_csv_format(input_json_path, output_csv_path):
    with open(input_json_path, mode='r', encoding='utf-8') as json_file:
        data = json.load(json_file)

    with open(output_csv_path, mode='w', encoding='utf-8', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=["id", "codes"])
        writer.writeheader()
        
        for entry in data:
            # Vytvoření řádku pro API CSV formát
            row = {
                "id": entry["id"],  # ID pacienta
                "codes": ",".join(entry["codes"])  # Sekvence kódů oddělená čárkou
            }
            writer.writerow(row)

# Použití funkce
input_json_path = "output.json"  # Cesta k vstupnímu JSON souboru
output_csv_path = "output.csv"  # Cesta k výstupnímu CSV souboru
convert_to_api_csv_format(input_json_path, output_csv_path)

print(f"Data byla převedena a uložena do {output_csv_path}.")
