#!/usr/bin/env python3
"""
خادم محلي بسيط لحل مشاكل CORS في تطبيق البحث في القرآن
يمكن تشغيله باستخدام: python local-server.py
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse, parse_qs
import json

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # إضافة headers لحل مشاكل CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        # التعامل مع preflight requests
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # التعامل مع الطلبات العادية
        super().do_GET()

    def log_message(self, format, *args):
        # تحسين رسائل السجل
        print(f"[{self.address_string()}] {format % args}")

def main():
    PORT = 8000
    
    # التأكد من وجود الملفات المطلوبة
    required_files = ['index.html']
    missing_files = [f for f in required_files if not os.path.exists(f)]

    if missing_files:
        print(f"❌ الملفات التالية مفقودة: {', '.join(missing_files)}")
        print("تأكد من تشغيل الخادم في نفس مجلد الملفات")
        return

    try:
        # إنشاء الخادم
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"🚀 تم تشغيل الخادم المحلي على المنفذ {PORT}")
            print(f"📱 رابط التطبيق: http://localhost:{PORT}/index.html")
            print("⏹️  اضغط Ctrl+C لإيقاف الخادم")
            print("-" * 50)
            
            # فتح المتصفح تلقائياً
            try:
                webbrowser.open(f'http://localhost:{PORT}/index.html')
                print("✅ تم فتح المتصفح تلقائياً")
            except:
                print("⚠️  لم يتم فتح المتصفح تلقائياً - افتحه يدوياً")
            
            print("-" * 50)
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 تم إيقاف الخادم")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ المنفذ {PORT} مستخدم بالفعل")
            print("جرب منفذ آخر أو أوقف الخادم الآخر")
        else:
            print(f"❌ خطأ في تشغيل الخادم: {e}")
    except Exception as e:
        print(f"❌ خطأ غير متوقع: {e}")

if __name__ == "__main__":
    main()
