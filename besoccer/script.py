import subprocess
from unidecode import unidecode
import os

subprocess.run(["node", "script.js"])

csv_files = [f for f in os.listdir(".") if f.endswith(".csv")]
for csv_file in csv_files:
    with open(csv_file, "r", encoding="utf-8") as f:
        rows = f.readlines()

    fixed_rows = [unidecode(row) for row in rows]

    with open(csv_file, "w", encoding="utf-8") as f:
        for row in fixed_rows:
            f.write(row)
