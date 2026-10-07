import json
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
DATABASE = ROOT / 'wesc.db'


def initialize_database():
    with sqlite3.connect(DATABASE) as connection:
        connection.execute('''
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
                email TEXT NOT NULL CHECK (length(trim(email)) <= 254),
                phone TEXT NOT NULL CHECK (length(trim(phone)) BETWEEN 7 AND 40),
                course TEXT NOT NULL CHECK (length(trim(course)) BETWEEN 2 AND 160),
                status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'rejected')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        connection.commit()


class WescHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.send_json({'status': 'ok', 'database': DATABASE.name})
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != '/api/applications':
            self.send_error(404, 'API route not found')
            return

        try:
            length = int(self.headers.get('Content-Length', 0))
            payload = json.loads(self.rfile.read(length))
            applicant = {
                'name': str(payload.get('name', '')).strip(),
                'email': str(payload.get('email', '')).strip().lower(),
                'phone': str(payload.get('phone', '')).strip(),
                'course': str(payload.get('course', '')).strip(),
            }

            if len(applicant['name']) < 2 or len(applicant['name']) > 120:
                raise ValueError('Please enter a valid name.')
            if '@' not in applicant['email'] or len(applicant['email']) > 254:
                raise ValueError('Please enter a valid email address.')
            if len(applicant['phone']) < 7 or len(applicant['phone']) > 40:
                raise ValueError('Please enter a valid phone number.')
            if len(applicant['course']) < 2 or len(applicant['course']) > 160:
                raise ValueError('The selected course is invalid.')

            with sqlite3.connect(DATABASE) as connection:
                cursor = connection.execute(
                    '''INSERT INTO applications (name, email, phone, course)
                       VALUES (:name, :email, :phone, :course)''',
                    applicant,
                )
                connection.commit()

            self.send_json({'message': 'Application received.', 'id': cursor.lastrowid}, 201)
        except ValueError as error:
            self.send_json({'error': str(error)}, 400)
        except (json.JSONDecodeError, TypeError):
            self.send_json({'error': 'Request body must be valid JSON.'}, 400)
        except sqlite3.Error:
            self.send_json({'error': 'The local database could not save this application.'}, 500)

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    initialize_database()
    server = ThreadingHTTPServer(('127.0.0.1', 8000), WescHandler)
    print('WESC is running at http://127.0.0.1:8000')
    print(f'Applications are stored in {DATABASE}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopping WESC server.')
        server.server_close()
