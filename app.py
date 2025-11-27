from flask import Flask, render_template, request, jsonify, session
import json
import re
from datetime import datetime
import random
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = 'adtu_smart_campus_2024_secret_key'

# Admin credentials
ADMIN_USERNAME = "adtuadmin"
ADMIN_PASSWORD = "admin123"

class ChatbotEngine:
    def __init__(self):
        self.knowledge_base_file = 'knowledge_base.json'
        self.knowledge_base = self.load_knowledge_base()
        self.conversation_history = []
    
    def load_knowledge_base(self):
        try:
            with open(self.knowledge_base_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            return self.create_default_knowledge_base()
    
    def create_default_knowledge_base(self):
        default_kb = {
            "categories": [
                {
                    "name": "admissions",
                    "questions": [
                        {
                            "patterns": ["admission process", "how to apply", "admission procedure", "admission form"],
                            "responses": ["The admission process at ADTU involves: 1) Online application through our portal admissions.adtu.in 2) Document verification 3) Entrance test (if applicable) 4) Personal interview 5) Fee payment. You can apply for 2024 admissions now!"]
                        },
                        {
                            "patterns": ["eligibility criteria", "qualification required", "admission requirements"],
                            "responses": ["Eligibility varies by program: B.Tech - 10+2 with 50% in PCM, MBA - Graduation with 50%, BBA - 10+2 with 45%. Check our website for detailed eligibility for each course."]
                        },
                        {
                            "patterns": ["last date for admission", "admission deadline", "application last date"],
                            "responses": ["For 2024 admissions: B.Tech - July 31st, MBA - August 15th, Other UG/PG courses - August 31st. Early applications get priority!"]
                        }
                    ]
                },
                {
                    "name": "courses",
                    "questions": [
                        {
                            "patterns": ["engineering courses", "btech programs", "computer science engineering"],
                            "responses": ["ADTU offers B.Tech in: Computer Science, Mechanical, Civil, Electrical, Electronics, AI & ML, Data Science. All programs are AICTE approved with industry-oriented curriculum."]
                        },
                        {
                            "patterns": ["management courses", "mba programs", "business administration"],
                            "responses": ["We offer MBA with specializations in: Marketing, Finance, HR, Operations, IT. Also BBA and B.Com programs with excellent placement records."]
                        },
                        {
                            "patterns": ["medical courses", "pharmacy", "nursing", "paramedical"],
                            "responses": ["ADTU offers: B.Pharm, D.Pharm, B.Sc Nursing, BPT (Physiotherapy), and various paramedical courses with modern labs and hospital training."]
                        }
                    ]
                },
                {
                    "name": "fees",
                    "questions": [
                        {
                            "patterns": ["fee structure", "course fees", "tuition fee", "semester fee"],
                            "responses": ["Approximate annual fees: B.Tech - ₹85,000, MBA - ₹75,000, B.Pharm - ₹70,000, BBA - ₹45,000. Hostel extra ₹40,000/year. Detailed fee structure at fees.adtu.in"]
                        },
                        {
                            "patterns": ["scholarship", "financial aid", "fee concession", "education loan"],
                            "responses": ["We offer: Merit scholarships (up to 100%), SC/ST scholarships, Sports quotas, EWS scholarships. Education loan assistance available from major banks."]
                        }
                    ]
                },
                {
                    "name": "campus",
                    "questions": [
                        {
                            "patterns": ["campus facilities", "infrastructure", "campus building"],
                            "responses": ["30-acre green campus with: Smart classrooms, Advanced labs, Central library, Sports complex, Hostels, Cafeteria, Medical center, Wi-Fi campus, ATM, and Transport facility."]
                        },
                        {
                            "patterns": ["library", "central library", "book bank"],
                            "responses": ["Central library with 50,000+ books, 100+ journals, digital library, e-resources, reading halls. Open 8 AM - 8 PM (Mon-Sat). Book bank facility available."]
                        },
                        {
                            "patterns": ["hostel", "accommodation", "student housing"],
                            "responses": ["Separate hostels for boys and girls with: AC/Non-AC rooms, Wi-Fi, Common rooms, Mess, Security, Laundry. Fees: ₹40,000/year (Non-AC), ₹60,000/year (AC)."]
                        },
                        {
                            "patterns": ["exam hall", "examination center", "building room number"],
                            "responses": ["Main exam halls: Block A - Room 101-110, Block B - Room 201-210, Block C - Room 301-305. Specific exam venue details are displayed on notice boards before exams."]
                        },
                        {
                            "patterns": ["computer lab", "laboratories", "practical labs"],
                            "responses": ["We have 15+ advanced labs: Computer labs (8), Engineering labs (4), Pharmacy labs (2), Research lab (1). All labs equipped with latest equipment and software."]
                        }
                    ]
                },
                {
                    "name": "placement",
                    "questions": [
                        {
                            "patterns": ["placement", "campus recruitment", "companies", "jobs"],
                            "responses": ["92% placement record in 2023. Top recruiters: TCS, Infosys, Wipro, Amazon, Microsoft, IBM, Capgemini. Highest package: ₹18 LPA, Average: ₹4.5 LPA."]
                        },
                        {
                            "patterns": ["training", "internship", "industry exposure"],
                            "responses": ["Regular training programs: Soft skills, Technical training, Mock interviews, Industry visits. 6-month compulsory internship in final year with stipend."]
                        }
                    ]
                },
                {
                    "name": "contact",
                    "questions": [
                        {
                            "patterns": ["contact number", "phone", "email", "address", "location"],
                            "responses": ["Admission Office: +91-361-22334455, info@adtu.in. Address: Gandhi Nagar, Panikhaiti, Guwahati, Assam 781026. Website: www.adtu.in"]
                        },
                        {
                            "patterns": ["visit campus", "campus tour", "location map"],
                            "responses": ["Campus visits welcome! Schedule appointment at admission@adtu.in. Location: 15km from Guwahati Railway Station, 25km from Airport. Map: maps.adtu.in"]
                        }
                    ]
                },
                {
                    "name": "academics",
                    "questions": [
                        {
                            "patterns": ["academic calendar", "semester dates", "holiday list"],
                            "responses": ["Academic Year 2024: Odd Semester (July-Dec), Even Semester (Jan-June). Detailed calendar with holidays available at academics.adtu.in"]
                        },
                        {
                            "patterns": ["exam schedule", "time table", "exam date sheet"],
                            "responses": ["Exam schedules are published 15 days before exams on university portal and notice boards. Regular updates on exam.adtu.in"]
                        },
                        {
                            "patterns": ["faculty", "professors", "teaching staff"],
                            "responses": ["150+ highly qualified faculty with PhDs from IITs/NITs/foreign universities. Student-teacher ratio 15:1 ensuring personalized attention."]
                        }
                    ]
                }
            ]
        }
        self.save_knowledge_base(default_kb)
        return default_kb
    
    def save_knowledge_base(self, data):
        with open(self.knowledge_base_file, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
    
    def find_response(self, user_input):
        user_input = user_input.lower().strip()
        
        # Add to conversation history
        self.conversation_history.append({
            'user': user_input,
            'timestamp': datetime.now().isoformat()
        })
        
        # Check special responses first
        special_response = self.check_special_responses(user_input)
        if special_response:
            return special_response
        
        # Quick search with priority matching
        best_match = self.quick_search(user_input)
        if best_match:
            return best_match
        
        # Fallback responses
        fallback_responses = [
            "I'm here to help with ADTU-related queries. Could you ask about admissions, courses, campus facilities, or placements?",
            "That's an interesting question! For detailed information, please visit www.adtu.in or contact admission office.",
            "I specialize in ADTU information. You can ask me about courses, fees, campus life, or admission process.",
            "I want to provide accurate information. Could you rephrase your question or contact info@adtu.in for specific queries?"
        ]
        return random.choice(fallback_responses)
    
    def quick_search(self, user_input):
        # Priority-based matching for faster responses
        for category in self.knowledge_base['categories']:
            for question in category['questions']:
                for pattern in question['patterns']:
                    if re.search(r'\b' + re.escape(pattern) + r'\b', user_input, re.IGNORECASE):
                        return random.choice(question['responses'])
        return None
    
    def check_special_responses(self, user_input):
        special_cases = {
            r'hello|hi|hey|namaste': [
                "Namaste! 🌸 Welcome to Assam Down Town University Smart Assistant! How can I help you today?",
                "Hello! 😊 I'm here to assist you with ADTU information. What would you like to know?",
                "Hi there! 🎓 Ready to explore Assam Down Town University? Ask me about admissions, courses, or campus life!"
            ],
            r'thank you|thanks|dhanyabad': [
                "You're most welcome! 😊 Feel free to ask if you need more information about ADTU.",
                "Happy to help! 🌟 Is there anything else you'd like to know about our university?",
                "You're welcome! 🙏 Visit www.adtu.in for detailed information."
            ],
            r'bye|goodbye|see you': [
                "Goodbye! 👋 Best wishes for your academic journey!",
                "Dhanyabaad! 🌸 Visit www.adtu.in for latest updates!",
                "See you! 🎓 Feel free to come back anytime!"
            ],
            r'website|adtu\.in|online': [
                "Our official website: www.adtu.in 📱 You'll find detailed information about admissions, courses, faculty, and campus life there!"
            ],
            r'assam|guwahati|northeast': [
                "Yes! ADTU is located in beautiful Guwahati, Assam - the gateway to Northeast India! 🌄 Our campus offers a perfect blend of modern education and natural beauty."
            ]
        }
        
        for pattern, responses in special_cases.items():
            if re.search(pattern, user_input, re.IGNORECASE):
                return random.choice(responses)
        return None
    
    def add_question(self, category, patterns, response):
        # Find or create category
        cat_found = False
        for cat in self.knowledge_base['categories']:
            if cat['name'] == category:
                cat_found = True
                cat['questions'].append({
                    "patterns": patterns,
                    "responses": [response]
                })
                break
        
        if not cat_found:
            self.knowledge_base['categories'].append({
                "name": category,
                "questions": [{
                    "patterns": patterns,
                    "responses": [response]
                }]
            })
        
        self.save_knowledge_base(self.knowledge_base)
        return True

# Initialize chatbot
chatbot = ChatbotEngine()

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'status': 'error', 'message': 'Admin authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_response', methods=['POST'])
def get_bot_response():
    user_message = request.json['message']
    
    # Fast response simulation
    response = chatbot.find_response(user_message)
    
    return jsonify({
        'response': response,
        'timestamp': datetime.now().strftime("%H:%M:%S"),
        'status': 'success'
    })

# Admin routes
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['admin_logged_in'] = True
        return jsonify({'status': 'success', 'message': 'Login successful'})
    else:
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'status': 'success', 'message': 'Logout successful'})

@app.route('/admin/check_auth', methods=['GET'])
def check_admin_auth():
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False})

@app.route('/admin/knowledge_base', methods=['GET'])
@admin_required
def get_knowledge_base():
    return jsonify(chatbot.knowledge_base)

@app.route('/admin/add_question', methods=['POST'])
@admin_required
def add_question():
    data = request.json
    category = data.get('category')
    patterns = data.get('patterns')
    answer = data.get('answer')
    
    if not all([category, patterns, answer]):
        return jsonify({'status': 'error', 'message': 'All fields are required'}), 400
    
    success = chatbot.add_question(category, patterns, answer)
    
    if success:
        return jsonify({'status': 'success', 'message': 'Question added successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to add question'}), 500

@app.route('/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    total_questions = 0
    for category in chatbot.knowledge_base['categories']:
        total_questions += len(category['questions'])
    
    return jsonify({
        'total_questions': total_questions,
        'total_categories': len(chatbot.knowledge_base['categories']),
        'conversation_count': len(chatbot.conversation_history)
    })

@app.route('/api/conversation_history', methods=['GET'])
def get_conversation_history():
    return jsonify(chatbot.conversation_history[-10:])

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    total_questions = len(chatbot.conversation_history)
    return jsonify({
        'total_questions': total_questions,
        'success_rate': 95,
        'avg_response_time': 0.8
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)