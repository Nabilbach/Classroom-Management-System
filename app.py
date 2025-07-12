import sqlite3
from flask import Flask, request, send_file, send_from_directory, jsonify
from flask_cors import CORS
# from generate_certificate import generate_certificate
import os
import pandas as pd
from fpdf import FPDF
import click

app = Flask(__name__, static_folder='./dist', static_url_path='/')
CORS(app)
DATABASE = 'classroom.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

@app.cli.command('init-db')
def init_db_command():
    """Creates the database tables."""
    db = get_db()
    with app.open_resource('init.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()
    click.echo('Initialized the database.')

# API for Students
@app.route('/api/students', methods=['GET'])
def get_students():
    db = get_db()
    students_cur = db.execute('SELECT * FROM students')
    students = [dict(row) for row in students_cur.fetchall()]
    db.close()
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
def add_student():
    student_data = request.json
    if not student_data or 'name' not in student_data or 'section' not in student_data:
        return jsonify({'error': 'Missing student name or section'}), 400

    db = None
    try:
        db = get_db()
        cursor = db.cursor()
        badges_str = ','.join(student_data.get('badges', [])) if isinstance(student_data.get('badges'), list) else student_data.get('badges', '')
        cursor.execute(
            'INSERT INTO students (name, section, grade, badges, behavior) VALUES (?, ?, ?, ?, ?)',
            (student_data['name'], student_data['section'], student_data.get('grade'), 
             badges_str, student_data.get('behavior'))
        )
        new_student_id = cursor.lastrowid
        db.commit()
        student_data['id'] = new_student_id
        return jsonify(student_data), 201
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    student_data = request.json
    if not student_data or 'name' not in student_data or 'section' not in student_data:
        return jsonify({'error': 'Missing student name or section'}), 400

    db = None
    try:
        db = get_db()
        badges_str = ','.join(student_data.get('badges', [])) if isinstance(student_data.get('badges'), list) else student_data.get('badges', '')
        cursor = db.execute(
            'UPDATE students SET name = ?, section = ?, grade = ?, badges = ?, behavior = ? WHERE id = ?',
            (student_data['name'], student_data['section'], student_data.get('grade'),
             badges_str, student_data.get('behavior'), student_id)
        )
        if cursor.rowcount == 0:
            return jsonify({'error': 'Student not found'}), 404
        db.commit()
        return jsonify(student_data)
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    db = None
    try:
        db = get_db()
        cursor = db.execute('DELETE FROM students WHERE id = ?', (student_id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Student not found'}), 404
        db.commit()
        return jsonify({'message': 'Student deleted'}), 204
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

@app.route('/api/students/<int:student_id>/order', methods=['PUT'])
def update_order_number(student_id):
    order_data = request.json
    if not order_data or 'orderNumber' not in order_data:
        return jsonify({'error': 'Missing orderNumber in request data'}), 400

    new_order_number = order_data.get('orderNumber')
    if not isinstance(new_order_number, (int, type(None))):
        return jsonify({'error': 'orderNumber must be an integer or null'}), 400

    db = None
    try:
        db = get_db()
        cursor = db.execute(
            'UPDATE students SET orderNumber = ? WHERE id = ?',
            (new_order_number, student_id)
        )
        if cursor.rowcount == 0:
            return jsonify({'message': 'Student not found'}), 404
        db.commit()
        return jsonify({'message': 'Order number updated', 'orderNumber': new_order_number})
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

# API for Excel Upload
@app.route('/api/upload-excel', methods=['POST'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400
    
    if file and (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        try:
            # Read the Excel file using openpyxl
            df = pd.read_excel(file, engine='openpyxl')
            
            # --- Database Insertion Logic ---
            # (Assuming the rest of your database logic is correct)
            section_name = os.path.splitext(file.filename)[0]
            db = get_db()
            cursor = db.cursor()
            
            for index, row in df.iterrows():
                name = row.get('الإسم')
                family_name = row.get('النسب')
                code = row.get('الرمز')
                gender = row.get('النوع')
                dob = row.get('تاريخ الإزدياد')
                order_number = int(row.get('ر.ت')) if pd.notna(row.get('ر.ت')) else None
                grade = row.get('الدرجة')
                badges = ','.join(str(row.get('الأوسمة', '')).split(' و')) if pd.notna(row.get('الأوسمة')) else ''
                behavior = row.get('السلوك')
                behavior_score = int(row.get('تقييم السلوك')) if pd.notna(row.get('تقييم السلوك')) else None
                participation_score = int(row.get('المشاركة في القسم')) if pd.notna(row.get('المشاركة في القسم')) else None
                homework_score = int(row.get('أداء الواجبات')) if pd.notna(row.get('أداء الواجبات')) else None
                attendance = int(row.get('نسبة الحضور')) if pd.notna(row.get('نسبة الحضور')) else None
                color = None

                cursor.execute(
                    'INSERT INTO students (name, section, grade, badges, behavior, orderNumber, behaviorScore, participationScore, homeworkScore, attendance, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (name, section_name, grade, badges, behavior, order_number, behavior_score, participation_score, homework_score, attendance, color)
                )
            
            db.commit()
            db.close()
            
            return jsonify({'message': f'Successfully uploaded and processed {file.filename}', 'students_added': len(df)}), 200
            
        except Exception as e:
            return jsonify({'error': f'An error occurred while processing the file: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'}), 400

# API for Sections
@app.route('/api/sections', methods=['GET'])
def get_sections():
    db = get_db()
    sections_cur = db.execute('SELECT * FROM sections')
    sections = [dict(row) for row in sections_cur.fetchall()]
    db.close()
    return jsonify(sections)

@app.route('/api/sections', methods=['POST'])
def add_section():
    section_data = request.json
    if not section_data or 'name' not in section_data:
        return jsonify({'error': 'Missing section name'}), 400

    db = None
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO sections (name, grade, students, excellent, issues) VALUES (?, ?, ?, ?, ?)',
            (section_data['name'], section_data.get('grade'), section_data.get('students'),
             section_data.get('excellent'), section_data.get('issues'))
        )
        new_section_id = cursor.lastrowid
        db.commit()
        section_data['id'] = new_section_id
        return jsonify(section_data), 201
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

# API for Schedules
@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    db = get_db()
    schedules_cur = db.execute('SELECT * FROM schedules')
    schedules = [dict(row) for row in schedules_cur.fetchall()]
    db.close()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
def add_schedule():
    schedule_data = request.json
    if not schedule_data or 'name' not in schedule_data or 'time' not in schedule_data or 'section' not in schedule_data or 'teacher' not in schedule_data:
        return jsonify({'error': 'Missing schedule data (name, time, section, or teacher)'}), 400

    db = None
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO schedules (name, time, section, teacher) VALUES (?, ?, ?, ?)',
            (schedule_data['name'], schedule_data['time'], schedule_data['section'], schedule_data['teacher'])
        )
        new_schedule_id = cursor.lastrowid
        db.commit()
        schedule_data['id'] = new_schedule_id
        return jsonify(schedule_data), 201
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

@app.route('/api/students/<int:student_id>/evaluate', methods=['POST'])
def evaluate_student(student_id):
    evaluation_data = request.json
    required_fields = ['behaviorScore', 'participationScore', 'homeworkScore', 'attendance']
    for field in required_fields:
        if field not in evaluation_data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    behavior_score = evaluation_data.get('behaviorScore')
    participation_score = evaluation_data.get('participationScore')
    homework_score = evaluation_data.get('homeworkScore')
    attendance = evaluation_data.get('attendance')

    # Validate scores are integers and within a reasonable range (e.g., 0-10)
    if not all(isinstance(score, int) and 0 <= score <= 10 for score in [behavior_score, participation_score, homework_score]):
        return jsonify({'error': 'Scores must be integers between 0 and 10'}), 400
    if not isinstance(attendance, int) or not (0 <= attendance <= 100):
        return jsonify({'error': 'Attendance must be an integer between 0 and 100'}), 400

    # Determine color based on scores
    color = 'gray' # Default color
    if behavior_score >= 8 and participation_score >= 8 and homework_score >= 8:
        color = 'green'
    elif behavior_score < 6 and participation_score >= 6:
        color = 'yellow'
    elif participation_score < 6 and behavior_score >= 6:
        color = 'blue'
    elif behavior_score < 6 and participation_score < 6:
        color = 'red'

    db = None
    try:
        db = get_db()
        cursor = db.execute(
            'UPDATE students SET behaviorScore = ?, participationScore = ?, homeworkScore = ?, attendance = ?, color = ? WHERE id = ?',
            (behavior_score, participation_score, homework_score, attendance, color, student_id)
        )
        if cursor.rowcount == 0:
            return jsonify({'message': 'Student not found'}), 404
        db.commit()
        return jsonify({'message': 'Evaluation submitted', 'color': color})
    except sqlite3.Error as e:
        return jsonify({'error': f'Database error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500
    finally:
        if db:
            db.close()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    db = get_db()
    # Fetch students with 'red' or 'yellow' color as potential notifications
    notifications_cur = db.execute("SELECT id, name, section, color, behavior FROM students WHERE color IN ('red', 'yellow')")
    notifications_data = notifications_cur.fetchall()
    db.close()

    notifications = []
    for student in notifications_data:
        if student['color'] == 'red':
            message = f"{student['name']} من قسم {student['section']} يحتاج إلى متابعة سلوكية خاصة: {student['behavior']}"
            priority = "عاجل"
            color_class = "bg-red-100 text-red-800"
            notification_type = "تنبيه سلوكي"
        else: # yellow
            message = f"{student['name']} من قسم {student['section']} قد يحتاج إلى انتباه: {student['behavior']}"
            priority = "قريباً"
            color_class = "bg-orange-100 text-orange-800"
            notification_type = "تنبيه"
        
        notifications.append({
            "type": notification_type,
            "message": message,
            "time": "الآن", # Placeholder for now, can be improved with timestamps
            "priority": priority,
            "color": color_class
        })
    
    # Add a static notification for class reminder (example)
    notifications.append({
        "type": "تذكير حصة",
        "message": "حصة الصف الثالث تبدأ خلال 15 دقيقة",
        "time": "منذ 10 دقائق", 
        "priority": "قريباً",
        "color": "bg-orange-100 text-orange-800"
    })

    return jsonify(notifications)

# API for PDF Reports
@app.route('/api/recent-activities', methods=['GET'])
def get_recent_activities():
    db = get_db()
    recent_students_cur = db.execute('SELECT id, name FROM students ORDER BY id DESC LIMIT 5')
    recent_students = [dict(row) for row in recent_students_cur.fetchall()]

    recent_sections_cur = db.execute('SELECT id, name FROM sections ORDER BY id DESC LIMIT 5')
    recent_sections = [dict(row) for row in recent_sections_cur.fetchall()]
    db.close()

    activities = []
    for student in recent_students:
        activities.append({'action': f"تم إضافة تلميذ جديد: {student['name']}", 'time': "الآن"})
    for section in recent_sections:
        activities.append({'action': f"تم إضافة قسم جديد: {section['name']}", 'time': "الآن"})
    
    # Sort by a dummy 'time' for now, ideally would be actual timestamps
    # For simplicity, we'll just return the combined list as is.
    return jsonify(activities)

# API for PDF Reports
@app.route('/api/generate-report', methods=['POST'])
def generate_report_route():
    report_data = request.json
    report_type = report_data.get('reportType')
    data = report_data.get('data')

    pdf = FPDF()
    pdf.add_page()

    # NOTE: For proper Arabic rendering, you need to add a Unicode font that supports Arabic.
    # Example: pdf.add_font('ArabicFont', '', 'path/to/your/arabic_font.ttf', uni=True)
    # Then use: pdf.set_font('ArabicFont', '', 10)
    pdf.set_font('Arial', 'B', 16)
    pdf.set_right_margin(10)
    pdf.set_left_margin(10)
    pdf.set_auto_page_break(auto=True, margin=15)

    if report_type == 'leaderboard':
        pdf.cell(0, 10, 'Leaderboard Report', 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 10)
        headers = ["الترتيب", "الاسم", "القسم", "إجمالي النقاط", "المشاركة", "السلوك", "الواجبات", "البادجات", "التقييم"]
        col_widths = [15, 40, 25, 25, 20, 20, 20, 30, 20]
        
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()
        
        pdf.set_font('Arial', '', 8)
        for student in data:
            pdf.cell(col_widths[0], 10, str(student.get('rank', '')), 1, 0, 'C')
            pdf.cell(col_widths[1], 10, student.get('name', ''), 1, 0, 'R') # Right-align Arabic text
            pdf.cell(col_widths[2], 10, student.get('section', ''), 1, 0, 'R')
            pdf.cell(col_widths[3], 10, str(student.get('totalPoints', '')), 1, 0, 'C')
            pdf.cell(col_widths[4], 10, str(student.get('participationPoints', '')), 1, 0, 'C')
            pdf.cell(col_widths[5], 10, str(student.get('behaviorPoints', '')), 1, 0, 'C')
            pdf.cell(col_widths[6], 10, str(student.get('homeworkPoints', '')), 1, 0, 'C')
            pdf.cell(col_widths[7], 10, ', '.join(student.get('badges', [])), 1, 0, 'R')
            pdf.cell(col_widths[8], 10, str(student.get('starRating', '')) + ' نجوم', 1, 0, 'R')
            pdf.ln()

    elif report_type == 'overview':
        pdf.cell(0, 10, 'Overview Report', 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 10)
        headers = ["المقياس", "القيمة"]
        col_widths = [80, 80]

        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()

        pdf.set_font('Arial', '', 8)
        metrics = [
            ("إجمالي التلاميذ", data.get('totalStudents')),
            ("المتفوقون", data.get('excellentStudents')),
            ("المتوسطون", data.get('averageStudents')),
            ("يحتاجون تحسين", data.get('poorStudents')),
            ("المعدل العام", str(data.get('averageGrade', '')) + '%'),
            ("معدل الحضور", str(data.get('attendanceRate', '')) + '%'),
            ("معدل إكمال الواجبات", str(data.get('homeworkCompletionRate', '')) + '%'),
            ("نقاط السلوك", data.get('behaviorScore'))
        ]
        for metric, value in metrics:
            pdf.cell(col_widths[0], 10, metric, 1, 0, 'R')
            pdf.cell(col_widths[1], 10, str(value), 1, 0, 'C')
            pdf.ln()

    elif report_type == 'sectionPerformance':
        pdf.cell(0, 10, 'Section Performance Report', 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 10)
        headers = ["القسم", "المعدل", "التلاميذ", "المتفوقون", "يحتاجون تحسين"]
        col_widths = [40, 25, 25, 25, 35]

        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()

        pdf.set_font('Arial', '', 8)
        for section in data:
            pdf.cell(col_widths[0], 10, section.get('section', ''), 1, 0, 'R')
            pdf.cell(col_widths[1], 10, str(section.get('average', '')) + '%', 1, 0, 'C')
            pdf.cell(col_widths[2], 10, str(section.get('students', '')), 1, 0, 'C')
            pdf.cell(col_widths[3], 10, str(section.get('excellent', '')), 1, 0, 'C')
            pdf.cell(col_widths[4], 10, str(section.get('poor', '')), 1, 0, 'C')
            pdf.ln()

    elif report_type == 'behaviorTrends':
        pdf.cell(0, 10, 'Behavior Trends Report', 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 10)
        headers = ["الشهر", "ممتاز", "جيد", "يحتاج تحسين"]
        col_widths = [40, 40, 40, 40]

        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, 1, 0, 'C')
        pdf.ln()

        pdf.set_font('Arial', '', 8)
        for trend in data:
            pdf.cell(col_widths[0], 10, trend.get('month', ''), 1, 0, 'R')
            pdf.cell(col_widths[1], 10, str(trend.get('excellent', '')), 1, 0, 'C')
            pdf.cell(col_widths[2], 10, str(trend.get('good', '')), 1, 0, 'C')
            pdf.cell(col_widths[3], 10, str(trend.get('poor', '')), 1, 0, 'C')
            pdf.ln()

    output_path = f'temp_report_{report_type}.pdf'
    try:
        pdf.output(output_path)
        return send_file(output_path, as_attachment=True, download_name=f'{report_type}_report.pdf')
    finally:
        if os.path.exists(output_path):
            os.remove(output_path)



@app.route('/generate-certificate', methods=['POST'])
def generate_certificate_route():
    data = request.json
    student_name = data.get('student_name')
    badge_name = data.get('badge_name')
    date_awarded = data.get('date_awarded')

    if not all([student_name, badge_name, date_awarded]):
        return {'error': 'Missing data'}, 400

    output_path = f'./certificates/{student_name}_{badge_name}.pdf'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    generate_certificate(student_name, badge_name, date_awarded, output_path)

    return send_file(output_path, as_attachment=True, download_name=f'{student_name}_{badge_name}.pdf')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)