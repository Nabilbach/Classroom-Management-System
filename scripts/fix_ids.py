#!/usr/bin/env python3
import sqlite3
import uuid

conn = sqlite3.connect('classroom_dev.db')
c = conn.cursor()

print("🔧 Fixing LessonTemplates with missing IDs...")

# Get all templates without IDs
c.execute('SELECT rowid, title FROM LessonTemplates WHERE id IS NULL')
rows = c.fetchall()
print(f"Found {len(rows)} templates with NULL id")

# Generate IDs for each
count = 0
for rowid, title in rows:
    new_id = str(uuid.uuid4())
    c.execute('UPDATE LessonTemplates SET id = ? WHERE rowid = ?', (new_id, rowid))
    count += 1
    if count % 10 == 0:
        print(f"  ✓ Updated {count} records...")

conn.commit()
print(f"\n✅ Updated {count} templates with new IDs")

# Verify
c.execute('SELECT COUNT(*) FROM LessonTemplates WHERE id IS NULL')
remaining = c.fetchone()[0]
print(f"   Remaining NULL ids: {remaining}")

c.execute('SELECT COUNT(*) FROM LessonTemplates WHERE id IS NOT NULL')
valid = c.fetchone()[0]
print(f"   Valid IDs: {valid}")

conn.close()
