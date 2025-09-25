#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import threading
import time
import os

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    os.chdir(r"C:\Users\nabil\OneDrive\Documents\Classroom Management System")
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🌐 المخطط المرئي التفاعلي متاح على:")
        print(f"   http://localhost:{PORT}/interactive_database_visualization.html")
        print(f"\n📊 إحصائيات النظام:")
        print(f"   • 150 نقطة اتصال مع قاعدة البيانات")
        print(f"   • 5 قواعد بيانات مختلفة")
        print(f"   • 63 اتصال مباشر")
        print(f"   • 3 مخاطر حرجة")
        print(f"\n🎯 التحكم التفاعلي:")
        print(f"   • انقر على العقد لعرض التفاصيل")
        print(f"   • استخدم أزرار التحكم للتصفية")
        print(f"   • اسحب العقد لإعادة ترتيب المخطط")
        print(f"\n⚠️  لإيقاف الخادم: اضغط Ctrl+C")
        
        # فتح المتصفح تلقائياً بعد ثانية
        def open_browser():
            time.sleep(1)
            webbrowser.open(f'http://localhost:{PORT}/interactive_database_visualization.html')
        
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ تم إيقاف الخادم بنجاح")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()