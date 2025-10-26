"""REST API for localization."""
import re
import flask
import uuid
import hashlib
from app import app
from app.db import get_db


@app.route('/')
def get_index():
    return {"message": "JourniTag API is running", "status": "ok"}

@app.route('/api/health')
def health_check():
    return {"status": "healthy", "message": "API is running"}