import json

# --- CONFIGURATION ---
# Set your desired uniform source information here
TARGET_FILE_PATH = "temporary.json"  # The file to process
NEW_SOURCE_NAME = "Kaplan Bar Review Additional MBE Practice Exam"  # Change to your desired name
NEW_SOURCE_PROVIDER = "Kaplan"        # Change to your desired provider
NEW_SOURCE_YEAR_STR = "2014" # Change to your desired year (as a string), or "" or None for no year

# --- SCRIPT LOGIC ---

def convert_year_str(year_str):
    """Converts a year string to an integer or None."""
    if not year_str: # Handles empty string
        return None
    try:
        return int(year_str)
    except ValueError:
        print(f"Warning: Invalid year string '{year_str}' in configuration. Year will be set to null (None).")
        return None

def apply_uniform_source_info(file_path, new_name, new_provider, new_year_val):
    """
    Loads questions from a JSON file, updates the source name, provider,
    and year for all questions with the provided values, and saves the
    changes back to the same file.

    Args:
        file_path (str): The path to the JSON file.
        new_name (str): The new uniform source name.
        new_provider (str): The new uniform source provider.
        new_year_val (int or None): The new uniform source year.
    """
    try:
        # Specify UTF-8 encoding when opening the file for reading
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'. Please make sure it exists.")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from '{file_path}'. Error: {e}")
        print("Please ensure it's a valid JSON file and saved with UTF-8 encoding if it contains special characters.")
        return
    except UnicodeDecodeError as e: # Catching this specifically too, though encoding='utf-8' should prevent it
        print(f"UnicodeDecodeError: Could not read file '{file_path}' due to encoding issues. Error: {e}")
        print("Please ensure the file is saved with UTF-8 encoding.")
        return


    if "questions" not in data or not isinstance(data["questions"], list):
        print("Error: JSON file must contain a 'questions' key with a list of questions.")
        return

    if not data["questions"]:
        print("No questions found in the file to update.")
        return

    updated_count = 0
    for question_data in data["questions"]:
        if "source" not in question_data or not isinstance(question_data["source"], dict):
            question_data["source"] = {} # Ensure source dictionary exists

        question_data["source"]["name"] = new_name
        question_data["source"]["provider"] = new_provider
        question_data["source"]["year"] = new_year_val # This is already an int or None

        updated_count += 1

    if updated_count > 0:
        try:
            # Specify UTF-8 encoding when opening the file for writing
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False) # ensure_ascii=False is good for UTF-8 output
            print(f"\nSuccessfully updated 'name', 'provider', and 'year' for {updated_count} questions in '{file_path}'.")
            print(f"  Applied Name: '{new_name}'")
            print(f"  Applied Provider: '{new_provider}'")
            print(f"  Applied Year: {new_year_val if new_year_val is not None else 'Not set'}")
        except IOError:
            print(f"Error: Could not write to file '{file_path}'.")
    else:
        print("No questions were updated (though this state should ideally not be reached if questions exist).")

if __name__ == "__main__":
    # Convert the configured year string to an integer or None
    actual_new_year = convert_year_str(NEW_SOURCE_YEAR_STR)

    # Dummy data creation logic (ensure it's also written with UTF-8 if it has special chars)
    dummy_data_for_temp = {
        "questions": [
            {
                "question_id": "f8c1b3a0-5e8d-4f7a-8c1e-2a9b3d04f1e1",
                "source": {
                    "name": "Old Name 1 with possibly special char like é or ™",
                    "provider": "Old Provider 1",
                    "year": 2020,
                    "question": 1
                },
                "question_text": "Question 1 text..."
            },
            {
                "question_id": "a1b2c3d4-5e8d-4f7a-8c1e-2a9b3d04f1e2",
                "source": {
                    "name": "Old Name 2",
                    "provider": "Old Provider 2",
                    "year": 2021,
                    "question": 15
                },
                "question_text": "Question 2 text..."
            }
        ]
    }
    try:
        with open(TARGET_FILE_PATH, 'r', encoding='utf-8') as f: # Check with UTF-8
            pass # File exists
    except FileNotFoundError:
        try:
            with open(TARGET_FILE_PATH, 'w', encoding='utf-8') as f: # Write with UTF-8
                json.dump(dummy_data_for_temp, f, indent=4, ensure_ascii=False)
                print(f"Created a dummy '{TARGET_FILE_PATH}' for you to use for testing (UTF-8 encoded).")
        except IOError:
            print(f"Could not create a dummy '{TARGET_FILE_PATH}'.")

    print(f"Processing file: '{TARGET_FILE_PATH}'")
    print(f"Will apply the following source info:")
    print(f"  Name: '{NEW_SOURCE_NAME}'")
    print(f"  Provider: '{NEW_SOURCE_PROVIDER}'")
    print(f"  Year: {actual_new_year if actual_new_year is not None else ('Not set (empty string)' if not NEW_SOURCE_YEAR_STR else 'Invalid string, will be null')}")
    print("---")

    apply_uniform_source_info(TARGET_FILE_PATH, NEW_SOURCE_NAME, NEW_SOURCE_PROVIDER, actual_new_year)