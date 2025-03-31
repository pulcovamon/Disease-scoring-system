import random
import json


def generate_sequences(
    num_sequences=100,
    sequence_length=10,
    specific_codes=None,
    random_codes=None,
):
    """
    Generate random sequences with labels 0 and 1 in approximately equal proportions.
    Sequences with label 1 will contain specific codes (potentially repeated), others will be random.
    """
    sequences = []

    if specific_codes is None:
        specific_codes = ["96167", "09543", "89131"]
    if random_codes is None:
        random_codes = [
            "96863",
            "96621",
            "09125",
            "09119",
            "09511",
            "97111",
            "25022",
            "25213",
            "42520",
            "42022",
            "25023",
            "42023",
            "96163",
            "96623",
            "89611",
            "09220",
            "96711",
            "87613",
            "96315",
            "87231",
            "09223",
            "09219",
            "89615",
            "09513",
            "96325",
            "87523",
            "09215",
            "87217",
            "99991",
            "96713",
            "87215",
            "25113",
            "25217",
            "51881",
            "89127",
            "87129",
            "96515",
            "96617",
            "09541",
            "25110",
            "25215",
            "89513",
            "89514",
            "09532",
            "89617",
            "25227",
            "87127",
            "87517",
            "25117",
            "87525",
            "87447",
            "89619",
            "89119",
            "42510",
            "87519",
            "87433",
            "25123",
            "87223",
            "89123",
            "96857",
            "89143",
            "09133",
            "87431",
            "25021",
            "87225",
            "25121",
            "25225",
            "09523",
            "25135",
            "00042",
            "87435",
            "87439",
            "96813",
            "89713",
            "96157",
            "89517",
            "89725",
            "89813",
            "42021",
            "09115",
            "87131",
            "0189992",
            "27101",
            "87449",
            "87511",
            "57243",
            "89125",
            "96165",
            "0150121",
            "09237",
            "09127",
            "89313",
            "89117",
            "0210773",
            "0500570",
            "89111",
            "87513",
        ]

    num_label_1 = num_sequences // 2
    num_label_0 = num_sequences - num_label_1

    for _ in range(num_label_1):
        num_specific = random.randint(
            int(sequence_length / 2 + 1), sequence_length
        )
        sequence = random.choices(
            specific_codes, k=num_specific
        )
        sequence += random.choices(
            random_codes, k=sequence_length - len(sequence)
        )
        random.shuffle(sequence)
        sequences.append({"label": 1, "codes": sequence})

    for _ in range(num_label_0):
        sequence = random.choices(random_codes, k=sequence_length)
        random.shuffle(sequence)
        sequences.append({"label": 0, "codes": sequence})

    random.shuffle(sequences)
    return sequences


def save_sequences_to_file(sequences, filename="generated_sequences.json"):
    """Save generated sequences to a JSON file."""
    with open(filename, "w") as f:
        json.dump(sequences, f, indent=4)
    print(f"Generated sequencies were saved into {filename}")


if __name__ == "__main__":
    num_sequences = 5000
    sequence_length = 20

    sequences = generate_sequences(
        num_sequences=num_sequences, sequence_length=sequence_length
    )
    save_sequences_to_file(sequences)