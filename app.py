import os
import logging
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime
from ai_analyzer import EmailAnalyzer
from dotenv import load_dotenv

load_dotenv()

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
    """API endpoint to analyze email content with optional attachments"""
    try:
        # Handle multipart/form-data for file uploads
        if request.content_type.startswith('multipart/form-data'):
            email_content = request.form.get('email_content', '').strip()
            
            # Parse analysis options from JSON string
            import json
            options_str = request.form.get('analysis_options', '{}')
            try:
                analysis_options = json.loads(options_str)
            except:
                analysis_options = {}
                
            # Get files
            attachments = request.files.getlist('attachments')
            
        else:
            # Fallback for JSON-only requests (legacy support)
            data = request.get_json()
            email_content = data.get('email_content', '').strip()
            analysis_options = data.get('analysis_options', {})
            attachments = None
        
        if not email_content:
            return jsonify({
                'success': False,
                'error': 'Email content is required'
            }), 400
        
        # Extract options
        summary_style = analysis_options.get('summaryStyle', 'detailed')
        output_language = analysis_options.get('outputLanguage', 'english')
        reply_tone = analysis_options.get('replyTone', 'professional')

        # Analyze email using AI
        analysis_data = email_analyzer.analyze_email(
            email_content, 
            attachments=attachments,
            summary_style=summary_style,
            output_language=output_language,
            reply_tone=reply_tone
        )
        
        # Save to database
        from models import EmailSummary
        summary = EmailSummary()
        summary.email_content = email_content
        
        # Handle list fields (summary, actions, deadlines)
        summary.summary = '\n'.join(analysis_data.get('summary', [])) if isinstance(analysis_data.get('summary'), list) else analysis_data.get('summary', '')
        summary.action_items = '\n'.join(analysis_data.get('action_items', []))
        summary.deadlines = '\n'.join(analysis_data.get('deadlines', []))
        
        summary.sentiment = analysis_data.get('sentiment', 'Neutral')
        summary.priority = analysis_data.get('priority', 'Medium')
        
        # New Intelligence Fields
        summary.intent = analysis_data.get('intent', 'General')
        summary.urgency_score = analysis_data.get('urgency_score', 0)
        
        import json
        summary.risk_assessment = json.dumps(analysis_data.get('decision_helper', {})) # Mapped decision_helper to risk_assessment field
        summary.spam_analysis = json.dumps(analysis_data.get('spam_analysis', {}))
        summary.confidence_score = analysis_data.get('confidence_score', 0.0)
        
        # Handle replies
        suggested_replies = analysis_data.get('suggested_replies', {})
        # Save primary reply text to legacy field for safety
        summary.suggested_reply = suggested_replies.get('option_1', {}).get('text', '')
        summary.suggested_replies = json.dumps(suggested_replies)
        
        summary.created_at = datetime.utcnow()
        
        db.session.add(summary)
        db.session.commit()
        
        app.logger.info(f"Successfully analyzed email and saved summary with ID: {summary.id}")
        
        # Normalize response data to match history format
        analysis_data['risk_assessment'] = analysis_data.get('decision_helper', {})
        
        return jsonify({
            'success': True,
            'data': analysis_data,
            'id': summary.id
        })
        
    except Exception as e:
        app.logger.error(f"Error analyzing email: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_email():
    """API endpoint for follow-up chat with email context"""
    try:
        data = request.get_json()
        email_content = data.get('email_content', '').strip()
        user_query = data.get('query', '').strip()
        
        if not email_content or not user_query:
            return jsonify({
                'success': False,
                'error': 'Email content and query are required'
            }), 400
            
        # Use the chat method in analyzer
        response = email_analyzer.chat_with_email(email_content, user_query)
        
        return jsonify({
            'success': True,
            'answer': response.get('answer', 'I could not generate an answer.')
        })
        
    except Exception as e:
        app.logger.error(f"Chat error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Chat service unavailable'
        }), 500

@app.route('/api/action', methods=['POST'])
def perform_action():
    """API endpoint to perform simulated actions (Archive, Snooze, etc.)"""
    try:
        data = request.get_json()
        summary_id = data.get('id')
        action = data.get('action')
        
        if not summary_id or not action:
            return jsonify({'success': False, 'error': 'Missing ID or action'}), 400
            
        from models import EmailSummary
        summary = db.session.get(EmailSummary, summary_id)
        
        if not summary:
            return jsonify({'success': False, 'error': 'Summary not found'}), 404
            
        # Update status based on action
        if action == 'archive':
            summary.status = 'archived'
            message = "Email archived."
        elif action == 'snooze':
            summary.status = 'snoozed'
            message = "Email snoozed for later."
        elif action == 'delegate':
            summary.status = 'delegated'
            message = "Marked for delegation."
        elif action == 'mark_read':
            summary.status = 'read'
            message = "Marked as read."
        else:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'new_status': summary.status
        })
        
    except Exception as e:
        app.logger.error(f"Error performing action: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Action failed'
        }), 500

@app.route('/api/history')
def get_history():
    """API endpoint to get analysis history"""
    try:
        from models import EmailSummary
        summaries = EmailSummary.query.order_by(EmailSummary.created_at.desc()).limit(10).all()
        
        history = []
        import json
        for summary in summaries:
            try:
                risk_data = json.loads(summary.risk_assessment) if summary.risk_assessment else {}
                spam_data = json.loads(summary.spam_analysis) if summary.spam_analysis else {}
                replies_data = json.loads(summary.suggested_replies) if summary.suggested_replies else {}
            except:
                risk_data = {}
                spam_data = {}
                replies_data = {}

            history.append({
                'id': summary.id,
                'email_content': summary.email_content[:100] + '...' if len(summary.email_content) > 100 else summary.email_content,
                'summary': summary.summary.split('\n') if summary.summary else [],
                'action_items': summary.action_items.split('\n') if summary.action_items else [],
                'deadlines': summary.deadlines.split('\n') if summary.deadlines else [],
                'sentiment': summary.sentiment,
                'priority': summary.priority, # Legacy
                'intent': summary.intent,
                'urgency_score': summary.urgency_score,
                'risk_assessment': risk_data,
                'spam_analysis': spam_data,
                'confidence_score': summary.confidence_score,
                'suggested_reply': summary.suggested_reply,
                'suggested_replies': replies_data,
                'status': getattr(summary, 'status', 'active'), # Safely get status
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

@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """API endpoint to clear all analysis history"""
    try:
        from models import EmailSummary
        # Delete all records
        db.session.query(EmailSummary).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'History cleared successfully'
        })
        
    except Exception as e:
        app.logger.error(f"Error clearing history: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'An error occurred while clearing history.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
