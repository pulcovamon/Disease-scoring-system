import pandas as pd
import json

with open("data.json", "r") as file:
    data = json.load(file)

all_codes = [code for item in data for code in item["codes"]]
codes_df = pd.DataFrame(all_codes, columns=["Code"])

def process_data(data, top_n):
    top_codes = codes_df["Code"].value_counts().head(top_n).index
    target_codes = set(top_codes)

    filtered_data = []
    for item in data:
        filtered_codes = [code for code in item["codes"] if code in target_codes]
        if filtered_codes:  # Přidat jen, pokud není prázdné
            filtered_data.append({"id": item["id"], "codes": filtered_codes})

    avg_length = sum(len(item["codes"]) for item in filtered_data) / len(filtered_data) if filtered_data else 0

    return target_codes, filtered_data, avg_length

top_n = 100

selected_codes, filtered_data, average_length = process_data(data, top_n)

print(f"Top {top_n} codes: {selected_codes}")
print(f"Average length of sequences: {average_length}")

with open("filtered_top_codes.json", "w") as outfile:
    json.dump(filtered_data, outfile, indent=4)

print("Filtered data saved to 'filtered_top_codes.json'.")
