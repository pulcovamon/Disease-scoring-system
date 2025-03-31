import json
from collections import Counter
import pandas as pd

def find_top_codes(json_file, top_n=100):
    with open(json_file, "r") as file:
        data = json.load(file)

    all_codes = []
    for obj in data:
        all_codes.extend(obj.get("codes", []))

    code_counts = Counter(all_codes)
    most_common = code_counts.most_common(top_n)

    df = pd.DataFrame(most_common, columns=["Code", "Frequency"])
    
    return df

if __name__ == "__main__":
    json_file_path = "data.json"  # Zadej cestu k tvému JSON souboru
    top_codes = find_top_codes(json_file_path)
    print(top_codes[:10])
