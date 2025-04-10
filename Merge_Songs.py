import os
import json
import glob

def merge_artist_data():
    # Path to JSON files for artists
    json_path = 'data/songs-global-weekly/*.json'
    
    # Get all JSON files
    json_files = sorted(glob.glob(json_path))
    
    # List to hold all data
    all_data = []
    
    # Process each file
    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                data = json.load(file)
                all_data.extend(data)
            except json.JSONDecodeError:
                print(f"Error decoding JSON from {file_path}")
    
    # Sort by week and rank
    all_data.sort(key=lambda x: (x['week'], x['rank']))
    
    # Write combined data to a single file
    output_path = 'data/Merge Data/all_songs.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)
    
    print(f"Combined data written to {output_path}")
    return output_path

if __name__ == "__main__":
    merge_artist_data()
