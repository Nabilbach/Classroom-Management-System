#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('classroom_dev.db')
c = conn.cursor()

print('🗂️  Columns in LessonTemplates:')
c.execute("PRAGMA table_info(LessonTemplates)")
cols = c.fetchall()
for col in cols:
    print(f'  {col[1]}: {col[2]}')

c.execute('SELECT COUNT(*) FROM LessonTemplates')
count = c.fetchone()[0]
print(f'\n✅ Total records: {count}')

c.execute('SELECT * FROM LessonTemplates LIMIT 1')
row = c.fetchone()
if row:
    print('\n📋 First record:')
    for i, col in enumerate(cols):
        print(f'  {col[1]}: {row[i]}')

conn.close()
