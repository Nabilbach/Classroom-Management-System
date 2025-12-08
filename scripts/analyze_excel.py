import pandas as pd
import sys

file_path = r"c:\Users\nabil\Projects\Classroom-Management-System\data\excel\مقرر مادة التربية الإسلامية للجذع مشترك.xlsx"

try:
    # Read the Excel file
    df = pd.read_excel(file_path)
    
    print("Columns found:")
    for col in df.columns:
        print(f"- {col}")
    
    print("\nFirst 5 rows:")
    print(df.head().to_string())
    
    print("\nTotal rows:", len(df))

except Exception as e:
    print(f"Error reading Excel file: {e}")
