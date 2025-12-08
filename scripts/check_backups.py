import sqlite3
import os

# Check the largest backup
backup_dir = 'database/old_backups'
backups = [(f, os.path.getsize(os.path.join(backup_dir, f))) 
           for f in os.listdir(backup_dir) 
           if f.endswith('.db')]
backups.sort(key=lambda x: x[1], reverse=True)

print("📦 Top 3 Backups by Size:")
for i, (name, size) in enumerate(backups[:3]):
    print(f"  {i+1}. {name}: {size} bytes")

# Check latest large backup
if backups:
    latest_backup = os.path.join(backup_dir, backups[0][0])
    print(f"\n🔍 Checking template data in {backups[0][0]}...")
    
    try:
        conn = sqlite3.connect(latest_backup)
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) FROM LessonTemplates')
        count = c.fetchone()[0]
        
        c.execute('SELECT title, courseName, level FROM LessonTemplates LIMIT 3')
        samples = c.fetchall()
        
        print(f"  Templates count: {count}")
        print(f"  Sample data:")
        for title, course, level in samples:
            print(f"    - {title} | {course} | {level}")
        
        conn.close()
    except Exception as e:
        print(f"  Error: {e}")
