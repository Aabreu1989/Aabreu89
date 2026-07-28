import json
import os

backup_path = r'c:\Users\AmandaAbreu\mira\backups\backup_2026-03-29.json'

with open(backup_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'tables' in data and 'saber_ia' in data['tables']:
    saber_ia_data = data['tables']['saber_ia']
    print(f"Found {len(saber_ia_data)} Saber IA entries.")
    
    # Save it to a smaller file for inspection
    with open('saber_ia_extracted.json', 'w', encoding='utf-8') as out:
        json.dump(saber_ia_data, out, indent=2, ensure_ascii=False)
    
    # Check for categories
    missing_categories = [d for d in saber_ia_data if not d.get('category')]
    print(f"Entries missing category: {len(missing_categories)}")
else:
    print("Saber IA table not found in backup.")
