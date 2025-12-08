import sqlite3

conn = sqlite3.connect('classroom_dev.db')
c = conn.cursor()

# Get statistics
c.execute('SELECT COUNT(*) FROM LessonTemplates')
total = c.fetchone()[0]

c.execute("SELECT COUNT(*) FROM LessonTemplates WHERE title IS NOT NULL AND title != ''")
with_title = c.fetchone()[0]

print(f'📊 إحصائيات القوالب:')
print(f'  الإجمالي: {total}')
print(f'  بها عنوان: {with_title}')
print(f'  بدون عنوان: {total - with_title}')
print()

# Show templates with titles
c.execute("SELECT id, title, courseName FROM LessonTemplates WHERE title IS NOT NULL AND title != '' LIMIT 10")
print('✅ القوالب بالعناوين:')
for row in c.fetchall():
    print(f'  - {row[1]} ({row[2]})')

# Show templates without titles
c.execute("SELECT id, courseName FROM LessonTemplates WHERE title IS NULL OR title = '' LIMIT 5")
print('\n❌ القوالب بدون عناوين:')
for row in c.fetchall():
    print(f'  - ID: {row[0][:20]}... - Course: {row[1]}')

conn.close()
