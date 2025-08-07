# EmailWise - AI Email Analysis

## Overview

EmailWise is an AI-powered web application that analyzes email content to extract key insights including summaries, action items, and deadlines. The application uses OpenAI's GPT-4 for intelligent email analysis with a local fallback parser for scenarios where the API is unavailable. Built with Flask and SQLAlchemy, it provides a clean web interface for users to paste email content and receive structured analysis results with persistent storage of analysis history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture**
- Single-page application using vanilla JavaScript with Bootstrap dark theme
- Responsive design with real-time form validation and loading states
- AJAX-based communication with backend API endpoints
- Client-side history management with copy-to-clipboard functionality

**Backend Architecture**
- Flask web framework with modular structure separating concerns
- RESTful API design with `/api/analyze` endpoint for email processing
- SQLAlchemy ORM with declarative base for database operations
- Dual-mode AI analysis system supporting both OpenAI API and local parsing fallback

**Data Storage**
- SQLite database for development with PostgreSQL compatibility
- EmailSummary model storing analysis history with timestamps
- Automatic database initialization and table creation on startup
- Text fields for storing email content, summaries, action items, and deadlines

**AI Analysis System**
- Primary mode using OpenAI GPT-4 API for intelligent content extraction
- Fallback mode with regex-based local parsing for offline operation
- Structured JSON response format for consistent data handling
- Error handling and graceful degradation between analysis modes

**Application Structure**
- Main application logic in `app.py` with Flask configuration
- Separate `ai_analyzer.py` module for analysis functionality
- Database models isolated in `models.py` for clean separation
- Static assets organized with CSS and JavaScript in dedicated directories

## External Dependencies

**AI Services**
- OpenAI API (GPT-4) for primary email analysis functionality
- Requires OPENAI_API_KEY environment variable for API access

**Web Framework**
- Flask web framework with SQLAlchemy extension
- Werkzeug ProxyFix middleware for deployment compatibility

**Frontend Libraries**
- Bootstrap CSS framework with dark theme support
- Font Awesome icon library for enhanced UI elements

**Database**
- SQLite for local development
- PostgreSQL compatibility for production deployments
- Environment-configurable DATABASE_URL

**Development Tools**
- Python logging for debugging and monitoring
- Environment variable configuration for API keys and database connections