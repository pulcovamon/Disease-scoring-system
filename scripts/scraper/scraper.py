import os
import re

import pandas as pd
import requests
from bs4 import BeautifulSoup

def clean_text(text):
    if not isinstance(text, str):
        return text
    text = text.strip()
    text = re.sub(r'^[".]+', '', text)
    text = re.sub(r'[".]+$', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

VYKONY_XLSX_PATH = os.path.join("data", "vykony.xlsx")

url = "https://szv.mzcr.cz/Ciselnik/Odbornost/"
response = requests.get(url)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")
table = soup.find("table")

headers = [th.text.strip() for th in table.find_all("th")]
rows = []
for tr in table.find_all("tr")[1:]:
    cols = [td.text.strip() for td in tr.find_all("td")]
    if cols:
        rows.append(cols)

odbornosti_df = pd.DataFrame(rows, columns=headers)
odbornosti_df = odbornosti_df.rename(columns={"Kód": "Odbornost_kod", "Název": "Odbornost_nazev"})
print(odbornosti_df.head())

vykony_df = pd.read_excel(VYKONY_XLSX_PATH)

vykony_df["Odbornost"] = vykony_df["Odbornost"].astype(str)
odbornosti_df["Odbornost_kod"] = odbornosti_df["Odbornost_kod"].astype(str)

vykony_df = vykony_df.merge(odbornosti_df, how="left", left_on="Odbornost", right_on="Odbornost_kod")

vykony_df["Odbornost"] = vykony_df["Odbornost"].astype(str).str.zfill(3)
odbornosti_df["Odbornost_kod"] = odbornosti_df["Odbornost_kod"].astype(str).str.zfill(3)

kod_to_nazev = dict(zip(odbornosti_df["Odbornost_kod"], odbornosti_df["Odbornost_nazev"]))

vykony_df["Odbornost"] = vykony_df["Odbornost"].map(kod_to_nazev)

vykony_df = vykony_df[["Číslo", "Název", "Odbornost"]]
vykony_df = vykony_df.rename(columns={
    "Číslo": "Kod",
    "Název": "Nazev_vykonu",
    "Odbornost": "Odbornost_nazev"
})
vykony_df["Nazev_vykonu"] = vykony_df["Nazev_vykonu"].apply(clean_text)
vykony_df["Nazev_vykonu"] = vykony_df["Nazev_vykonu"].str.capitalize()
vykony_df = vykony_df[["Kod", "Nazev_vykonu", "Odbornost_nazev"]]
print(vykony_df.head())

vykony_df.to_csv(os.path.join("data", "vykony_final.csv"), index=False, encoding="utf-8-sig")

print("✅ Done")

