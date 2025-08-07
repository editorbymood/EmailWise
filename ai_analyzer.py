import os
import json
import re
from datetime import datetime
from openai import OpenAI

class EmailAnalyzer:
    """Class to handle email analysis using OpenAI or local fallback"""
    
    def __init__(self):
        self.openai_api_key = os.environ.get("OPENAI_API_KEY")
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None
    
    def analyze_email(self, email_content):
        """
        Analyze email content to extract summary, action items, and deadlines
        Returns a structured response with success status and data
        """
        try:
            if self.openai_client:
                return self._analyze_with_openai(email_content)
            else:
                return self._analyze_locally(email_content)
        except Exception as e:
            return {
                'success': False,
                'error': f'Analysis failed: {str(e)}'
            }
    
    def _analyze_with_openai(self, email_content):
        """Analyze email using OpenAI GPT-4o"""
        try:
            # Check if openai_client is available
            if not self.openai_client:
                raise Exception("OpenAI client not initialized")
                
            prompt = f"""
            Please analyze the following email and extract:
            1. A bullet-point summary (2-4 key points)
            2. Any action items or tasks mentioned
            3. Any dates, deadlines, or time-sensitive information
            
            Email content:
            {email_content}
            
            Please respond in JSON format with the following structure:
            {{
                "summary": ["bullet point 1", "bullet point 2", ...],
                "action_items": ["action 1", "action 2", ...],
                "deadlines": ["deadline 1", "deadline 2", ...]
            }}
            
            If no items are found for a category, return an empty array for that category.
            """
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert email analyzer. Extract key information and respond in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            if not content:
                raise Exception("Empty response from OpenAI")
                
            result = json.loads(content)
            
            return {
                'success': True,
                'data': result,
                'method': 'openai'
            }
            
        except Exception as e:
            # Fallback to local analysis if OpenAI fails
            return self._analyze_locally(email_content)
    
    def _analyze_locally(self, email_content):
        """Local fallback analysis using regex and keyword matching"""
        try:
            # Simple local analysis using patterns and keywords
            summary = self._extract_local_summary(email_content)
            action_items = self._extract_action_items(email_content)
            deadlines = self._extract_deadlines(email_content)
            
            return {
                'success': True,
                'data': {
                    'summary': summary,
                    'action_items': action_items,
                    'deadlines': deadlines
                },
                'method': 'local'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Local analysis failed: {str(e)}'
            }
    
    def _extract_local_summary(self, content):
        """Extract key points for summary using simple heuristics"""
        sentences = re.split(r'[.!?]+', content)
        summary = []
        
        # Look for sentences with key indicators
        key_phrases = [
            'please', 'need', 'require', 'important', 'urgent', 'meeting',
            'deadline', 'due', 'schedule', 'project', 'task', 'action'
        ]
        
        for sentence in sentences[:10]:  # Limit to first 10 sentences
            sentence = sentence.strip()
            if len(sentence) > 20 and any(phrase in sentence.lower() for phrase in key_phrases):
                summary.append(sentence.capitalize())
                if len(summary) >= 4:
                    break
        
        if not summary:
            # Fallback: take first few meaningful sentences
            for sentence in sentences[:3]:
                sentence = sentence.strip()
                if len(sentence) > 20:
                    summary.append(sentence.capitalize())
        
        return summary[:4]  # Limit to 4 points
    
    def _extract_action_items(self, content):
        """Extract action items using keyword patterns"""
        action_items = []
        
        # Patterns that indicate action items
        action_patterns = [
            r'(please|could you|can you|need to|should|must|have to)\s+([^.!?]*)',
            r'(action item|task|todo|to do):\s*([^.!?]*)',
            r'(follow up|complete|finish|submit|send|prepare)\s+([^.!?]*)'
        ]
        
        for pattern in action_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                action = match.group(0).strip()
                if len(action) > 10 and len(action) < 200:
                    action_items.append(action.capitalize())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_actions = []
        for item in action_items:
            if item.lower() not in seen:
                seen.add(item.lower())
                unique_actions.append(item)
        
        return unique_actions[:5]  # Limit to 5 action items
    
    def _extract_deadlines(self, content):
        """Extract dates and deadlines using regex patterns"""
        deadlines = []
        
        # Date patterns
        date_patterns = [
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',  # MM/DD/YYYY or MM-DD-YYYY
            r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',    # YYYY/MM/DD or YYYY-MM-DD
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{2,4}\b',
            r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{2,4}\b',
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            r'\b(tomorrow|today|next week|this week|next month|end of week|eow)\b',
            r'\b(due|deadline|by|before|until)\s+([^.!?]*(?:date|time|day|week|month))',
            r'\bby\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        ]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                deadline = match.group(0).strip()
                if len(deadline) > 3:
                    deadlines.append(deadline.capitalize())
        
        # Remove duplicates
        seen = set()
        unique_deadlines = []
        for item in deadlines:
            if item.lower() not in seen:
                seen.add(item.lower())
                unique_deadlines.append(item)
        
        return unique_deadlines[:5]  # Limit to 5 deadlines
