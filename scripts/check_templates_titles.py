import sqlite3

conn = sqlite3.connect('classroom_dev.db')
c = conn.cursor()

# Check templates
c.execute('SELECT title, COUNT(*) as cnt FROM LessonTemplates GROUP BY title')
result = c.fetchall()

print('📊 توزيع القوالب حسب العنوان:')
for row in result:
    print(f'  "{row[0]}": {row[1]} قالب')

# Check a sample
print('\n' + '='*50)
c.execute('SELECT id, courseName, level, title, weekNumber FROM LessonTemplates LIMIT 5')
print('\n📋 عينة من القوالب:')
for row in c.fetchall():
    print(f'  ID: {row[0]}, المقرر: {row[1]}, المستوى: {row[2]}, العنوان: {row[3]}, الأسبوع: {row[4]}')

conn.close()
