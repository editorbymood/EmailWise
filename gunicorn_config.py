
"""
Gunicorn configuration for EmailWise production deployment
"""
import multiprocessing

# Bind to 0.0.0.0 to allow external access (mimics production)
bind = "0.0.0.0:8000"

# Workers
# For CPU bound tasks, 2*CPU + 1. For IO bound (like calling OpenAI), threads are better.
# We use gthread (threaded worker) to handle multiple OpenAI requests concurrently without blocking.
workers = 2
threads = 4
worker_class = 'gthread'

# Timeouts
# OpenAI calls can be slow, especially for "Long Long Emails"
timeout = 120  # 2 minutes
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
