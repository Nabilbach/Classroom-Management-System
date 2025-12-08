#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import shutil
from datetime import datetime

print("="*70)
print("🔄 SYNC PRODUCTION DATABASE WITH DEVELOPMENT DATA")
print("="*70)

# Backup production database first
backup_file = f"classroom_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
print(f"\n📦 Backing up production database to {backup_file}...")
shutil.copy("classroom.db", backup_file)
print(f"   ✅ Backup created")

# Connect to both databases
print("\n📊 Comparing databases...")
dev_conn = sqlite3.connect('classroom_dev.db')
dev_conn.row_factory = sqlite3.Row
dev_cur = dev_conn.cursor()

prod_conn = sqlite3.connect('classroom.db')
prod_conn.row_factory = sqlite3.Row
prod_cur = prod_conn.cursor()

# Count templates in each
dev_cur.execute('SELECT COUNT(*) FROM LessonTemplates')
dev_count = dev_cur.fetchone()[0]
prod_cur.execute('SELECT COUNT(*) FROM LessonTemplates')
prod_count = prod_cur.fetchone()[0]

print(f"   Development DB: {dev_count} templates")
print(f"   Production DB: {prod_count} templates")

if dev_count == prod_count:
    print("\n✅ Databases are already in sync!")
    dev_conn.close()
    prod_conn.close()
    exit(0)

# Sync: delete old templates in production and copy new ones
print(f"\n🔄 Syncing {dev_count} templates from development to production...")

try:
    # Delete old templates from production
    prod_cur.execute('DELETE FROM LessonTemplates')
    deleted = prod_cur.rowcount
    print(f"   ✓ Deleted {deleted} old templates from production")
    
    # Get all templates from development
    dev_cur.execute('SELECT * FROM LessonTemplates ORDER BY id')
    templates = dev_cur.fetchall()
    
    # Insert into production
    for t in templates:
        prod_cur.execute('''
            INSERT INTO LessonTemplates 
            (id, title, description, estimatedSessions, stages, courseName, level, weekNumber, scheduledSections, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            t['id'], t['title'], t['description'], t['estimatedSessions'],
            t['stages'], t['courseName'], t['level'], t['weekNumber'],
            t['scheduledSections'], t['createdAt'], t['updatedAt']
        ))
    
    prod_conn.commit()
    print(f"   ✓ Inserted {len(templates)} new templates into production")
    
    # Verify
    prod_cur.execute('SELECT COUNT(*) FROM LessonTemplates')
    new_count = prod_cur.fetchone()[0]
    print(f"\n✅ Sync complete!")
    print(f"   Production DB now has: {new_count} templates")
    
    # Show distribution
    prod_cur.execute('''
        SELECT courseName, level, COUNT(*) cnt 
        FROM LessonTemplates 
        GROUP BY courseName, level 
        ORDER BY courseName, level
    ''')
    print(f"\n📊 Distribution in production DB:")
    for row in prod_cur.fetchall():
        print(f"   {row['courseName']} / {row['level']}: {row['cnt']} templates")
    
except Exception as e:
    prod_conn.rollback()
    print(f"\n❌ Error during sync: {e}")
    dev_conn.close()
    prod_conn.close()
    exit(1)

dev_conn.close()
prod_conn.close()

print("\n" + "="*70)
print("✨ SUCCESS! Production database is now synced with development data!")
print("="*70)
