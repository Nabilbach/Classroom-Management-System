import sqlite3

conn = sqlite3.connect('classroom.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()

print("=" * 60)
print("جميع الجداول في قاعدة البيانات classroom.db")
print("=" * 60)

total_records = 0
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
    count = cursor.fetchone()[0]
    total_records += count
    print(f"{table_name}: {count} سجل")

print("=" * 60)
print(f"إجمالي السجلات: {total_records}")
print("=" * 60)

conn.close()
