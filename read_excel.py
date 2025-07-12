import pandas as pd

def read_excel_file(file_path):
    try:
        # Skip initial rows and assume header is in row 10 (index 9)
        df = pd.read_excel(file_path, skiprows=9, header=0)
        print("Columns after skipping 9 rows and setting header:")
        print(df.columns.tolist())
        print("\nFirst 10 rows after skipping 9 rows:")
        print(df.head(10).to_string())
    except Exception as e:
        print(f"Error reading Excel file: {e}")

if __name__ == "__main__":
    file_path = "/home/ubuntu/upload/ListEleve_20240902.xlsx"
    read_excel_file(file_path)


