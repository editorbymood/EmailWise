import os
import json
import logging
import re
from datetime import datetime
from openai import OpenAI
import pdfminer.high_level
import mammoth
import io

class EmailAnalyzer:
    """Class to handle email analysis using OpenAI or local fallback"""
    
    def __init__(self):
        # Initialize OpenAI client only if API key is present
        api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.openai_client = self.client # Alias for compatibility
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def _smart_truncate(self, content, max_length=50000):
        """Truncate content smartly keeping head and tail if too long."""
        if len(content) <= max_length:
            return content
        
        # Keep 20% head, 80% tail as tail usually has recent context
        head_len = int(max_length * 0.2)
        tail_len = int(max_length * 0.8)
        
        return content[:head_len] + "\n...[Content Truncated]...\n" + content[-tail_len:]

    def process_attachments(self, files):
        """Extract text from uploaded files (PDF, DOCX)."""
        attachment_text = ""
        for file in files:
            filename = file.filename.lower()
            try:
                if filename.endswith('.pdf'):
                    # Use pdfminer to extract text
                    text = pdfminer.high_level.extract_text(file.stream)
                    attachment_text += f"\n\n--- Attachment: {file.filename} ---\n{text}"
                elif filename.endswith('.docx'):
                    # Use mammoth to extract raw text
                    result = mammoth.extract_raw_text(file.stream)
                    attachment_text += f"\n\n--- Attachment: {file.filename} ---\n{result.value}"
                elif filename.endswith('.txt'):
                    # Plain text
                    text = file.read().decode('utf-8', errors='ignore')
                    attachment_text += f"\n\n--- Attachment: {file.filename} ---\n{text}"
                else:
                    self.logger.warning(f"Unsupported file type: {filename}")
            except Exception as e:
                self.logger.error(f"Error processing attachment {filename}: {str(e)}")
                attachment_text += f"\n\n--- Attachment: {file.filename} (Error extraction) ---\n"
        
        return attachment_text

    def analyze_email(self, email_content, attachments=None, summary_style="detailed", output_language="english", reply_tone="professional"):
        """
        Analyze email content using OpenAI's GPT-4o model.
        Falls back to local analysis if no API key is found.
        """
        
        # Process attachments if present
        if attachments:
            attachment_text = self.process_attachments(attachments)
            email_content += attachment_text

        if not self.client:
            self.logger.warning("No OpenAI API key found. Using local fallback.")
            return self._local_analysis(email_content, summary_style, reply_tone)

        try:
            # Construct the prompt based on user preferences
            prompt = f"""
            You are an elite executive assistant and strategic data analyst. Analyze the following email thread and any attachments.
            
            **Configuration:**
            - **Summary Style:** {summary_style} (detailed=bullet points, quick=1-2 sentences, brief=executive brief)
            - **Output Language:** {output_language}
            - **Reply Tone:** {reply_tone}
            
            **Output Requirements:**
            Return a strictly valid JSON object. Do not include markdown formatting (like ```json).
            
            **JSON Structure:**
            {{
                "summary": "The executive summary...",
                "action_items": ["Action 1", "Action 2"],
                "deadlines": ["Deadline 1", "Deadline 2"],
                "subject": "The email subject...",
                "priority": "High/Medium/Low",
                "sentiment": "Positive/Neutral/Negative/Urgent/Angry",
                "suggested_replies": {{
                    "option_1": {{ "label": "Direct Reply", "text": "Draft of reply 1..." }},
                    "option_2": {{ "label": "Alternative Strategy", "text": "Draft of reply 2..." }}
                }},
                "intent": "Request/Inquiry/Complaint/Update",
                "urgency_score": 8,
                "confidence_score": 95,
                "spam_analysis": {{
                    "is_spam": false,
                    "reason": "Legitimate business correspondence."
                }},
                "decision_helper": {{
                    "pros": ["Benefit 1", "Benefit 2"],
                    "cons": ["Drawback 1", "Drawback 2"],
                    "risks": ["Risk 1", "Risk 2"]
                }}
            }}
            
            **Analysis Guidelines:**
            1. **Summary**: Adapt length based on 'Summary Style'.
            2. **Replies**: Generate TWO distinct reply options based on 'Reply Tone'.
            3. **Urgency**: rate 1-10 based on deadlines and tone.
            4. **Output Language**: Ensure ALL text values in the JSON are translated to {output_language}, except for specific proper nouns.

            **Email Content:**
            {self._smart_truncate(email_content)}
            """

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that outputs JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=2000,
                temperature=0.3
            )

            result = json.loads(response.choices[0].message.content)
            
            # Ensure all keys exist
            display_sentiment = result.get('sentiment', 'Neutral')
            if result.get('urgency_score', 0) > 7:
                 display_sentiment += " (Urgent)"

            return {
                "summary": result.get('summary', 'No summary available.'),
                "action_items": result.get('action_items', []),
                "deadlines": result.get('deadlines', []),
                "subject": result.get('subject', 'No Subject'),
                "priority": result.get('priority', 'Medium'),
                "sentiment": display_sentiment,
                "suggested_replies": result.get('suggested_replies', {
                    "option_1": {"label": "Draft", "text": "Could not generate reply."},
                    "option_2": {"label": "Alt", "text": "Could not generate reply."}
                }),
                "intent": result.get('intent', 'General'),
                "urgency_score": result.get('urgency_score', 5),
                "confidence_score": result.get('confidence_score', 90),
                "spam_analysis": result.get('spam_analysis', {"is_spam": False, "reason": "No anomalies."}),
                "decision_helper": result.get('decision_helper', {"pros": [], "cons": [], "risks": []})
            }

        except Exception as e:
            self.logger.error(f"Error during AI analysis: {str(e)}")
            return self._local_analysis(email_content, summary_style, reply_tone)

    def chat_with_email(self, email_content, query):
        """
        Interactive chat with the email context.
        """
        if not self.client:
             return "I can only answer questions in online mode with an API key."

        try:
            prompt = f"""
            Context: The user is asking a question about the following email.
            Email Content:
            {self._smart_truncate(email_content)}
            
            User Question: {query}
            
            Answer strictly based on the email provided. Be concise and helpful.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300
            )
            return response.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Chat error: {str(e)}")
            return "I encountered an error trying to answer that."

    def _local_analysis(self, content, style="detailed", tone="professional"):
        """Fallback rule-based analysis."""
        lines = content.split('\n')
        
        # Simple rule-based extraction
        subject = next((line.replace('Subject:', '').strip() for line in lines if 'Subject:' in line), "Unknown Subject")
        
        # Mock varied responses based on input to show UI changes
        is_urgent = "urgent" in content.lower() or "asap" in content.lower()
        
        return {
            "summary": "State-of-the-art offline mode active. Connect OpenAI API key for neural analysis. (This is a local fallback summary)",
            "action_items": [line.strip() for line in lines if line.strip().startswith('-') or line.strip().startswith('*')][:3],
            "deadlines": ["Tomorrow EOD (Detected locally)"],
            "subject": subject,
            "priority": "High" if is_urgent else "Medium",
            "sentiment": "Urgent" if is_urgent else "Neutral",
            "suggested_replies": {
                 "option_1": {
                     "label": "Offline Reply", 
                     "text": self._generate_local_reply(tone, is_urgent)
                 },
                 "option_2": {
                     "label": "Placeholder",
                     "text": "Please configure API key for advanced replies."
                 }
            },
            "intent": "Request" if "?" in content else "Statement",
            "urgency_score": 8 if is_urgent else 3,
            "confidence_score": 100,
            "spam_analysis": {"is_spam": False, "reason": "Local mode check pass."},
            "decision_helper": {
                "pros": ["Offline privacy", "Instant result"],
                "cons": ["Limited insight", "No semantic understanding"],
                "risks": ["May miss nuances"]
            }
        }

    def _generate_local_reply(self, tone, is_urgent):
        if tone == "strict":
            return "Noted. Will process."
        elif tone == "friendly":
            return "Got it! Thanks for sending this over. I'll take a look!"
        else:
            return "Received. I will review and respond shortly."
