from app import db
from datetime import datetime

class EmailSummary(db.Model):
    """Model to store email analysis history"""
    id = db.Column(db.Integer, primary_key=True)
    email_content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)
    action_items = db.Column(db.Text)
    deadlines = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<EmailSummary {self.id}>'
