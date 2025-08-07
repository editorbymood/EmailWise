import os
import logging
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime
from ai_analyzer import EmailAnalyzer

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "emailwise-secret-key-fallback")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///emailwise.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# initialize the app with the extension
db.init_app(app)

# Initialize AI analyzer
email_analyzer = EmailAnalyzer()

with app.app_context():
    # Import models to ensure tables are created
    import models
    db.create_all()

@app.route('/')
def index():
    """Main page with email input form"""
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_email():
    """API endpoint to analyze email content"""
    try:
        data = request.get_json()
        email_content = data.get('email_content', '').strip()
        
        if not email_content:
            return jsonify({
                'success': False,
                'error': 'Email content is required'
            }), 400
        
        # Analyze email using AI
        analysis_result = email_analyzer.analyze_email(email_content)
        
        if not analysis_result['success']:
            return jsonify(analysis_result), 500
        
        # Save to database
        from models import EmailSummary
        summary = EmailSummary()
        summary.email_content = email_content
        summary.summary = '\n'.join(analysis_result['data']['summary'])
        summary.action_items = '\n'.join(analysis_result['data']['action_items'])
        summary.deadlines = '\n'.join(analysis_result['data']['deadlines'])
        summary.created_at = datetime.utcnow()
        
        db.session.add(summary)
        db.session.commit()
        
        app.logger.info(f"Successfully analyzed email and saved summary with ID: {summary.id}")
        
        return jsonify(analysis_result)
        
    except Exception as e:
        app.logger.error(f"Error analyzing email: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while analyzing the email. Please try again.'
        }), 500

@app.route('/api/history')
def get_history():
    """API endpoint to get analysis history"""
    try:
        from models import EmailSummary
        summaries = EmailSummary.query.order_by(EmailSummary.created_at.desc()).limit(10).all()
        
        history = []
        for summary in summaries:
            history.append({
                'id': summary.id,
                'email_content': summary.email_content[:100] + '...' if len(summary.email_content) > 100 else summary.email_content,
                'summary': summary.summary.split('\n') if summary.summary else [],
                'action_items': summary.action_items.split('\n') if summary.action_items else [],
                'deadlines': summary.deadlines.split('\n') if summary.deadlines else [],
                'created_at': summary.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify({
            'success': True,
            'data': history
        })
        
    except Exception as e:
        app.logger.error(f"Error retrieving history: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while retrieving history.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
