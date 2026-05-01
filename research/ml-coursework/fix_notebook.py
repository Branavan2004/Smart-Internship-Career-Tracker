import json
import os

filepath = '/Users/branavan/Smart-Internship-Career-Tracker-main/research/ml-coursework/Notebook1_Data_Understanding_Preprocessing.ipynb'

with open(filepath, 'r') as f:
    content = f.read().strip()

# Handle double-encoded JSON string
try:
    if content.startswith('"') and content.endswith('"'):
        # It's a quoted string
        data_str = json.loads(content)
        data = json.loads(data_str)
    else:
        # It might be a regular JSON object
        data = json.loads(content)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=1)
        
    print("Notebook fixed successfully.")
except Exception as e:
    print(f"Error fixing notebook: {e}")
