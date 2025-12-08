import sqlite3

conn = sqlite3.connect('classroom_dev.db')
c = conn.cursor()

# Look at the actual JSON data stored
c.execute('SELECT id, title, description, courseName, level, stages FROM LessonTemplates LIMIT 3')
print('📋 تفاصيل أول 3 قوالب:')
for row in c.fetchall():
    print(f'ID: {row[0]}')
    print(f'  Title: {row[1]}')
    print(f'  Description: {row[2]}')
    print(f'  Course: {row[3]}')
    print(f'  Level: {row[4]}')
    print(f'  Stages: {row[5][:100] if row[5] else None}')
    print()

conn.close()
