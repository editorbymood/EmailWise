from app import db
from datetime import datetime

class EmailSummary(db.Model):
    """Model to store email analysis history"""
    id = db.Column(db.Integer, primary_key=True)
    email_content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)
    action_items = db.Column(db.Text)
    deadlines = db.Column(db.Text)
    sentiment = db.Column(db.String(50))
    priority = db.Column(db.String(50))
    suggested_reply = db.Column(db.Text)  # Legacy single reply
    suggested_replies = db.Column(db.Text)  # New JSON field for multiple options
    
    # New Intelligence Fields
    intent = db.Column(db.String(50))  # Action, Info, Decision, etc.
    urgency_score = db.Column(db.Integer)  # 1-10
    risk_assessment = db.Column(db.Text)  # JSON string for risks/pros/cons
    spam_analysis = db.Column(db.Text)  # JSON string for spam probability
    confidence_score = db.Column(db.Float)
    status = db.Column(db.String(50), default='active')  # active, archived, snoozed, delegated
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<EmailSummary {self.id}>'
