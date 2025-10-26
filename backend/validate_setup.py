#!/usr/bin/env python3
"""
Validation script to check if the photo upload feature is properly set up.
Run this from the backend/ directory: python validate_setup.py
"""

import sys
import os
from pathlib import Path

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ {msg}{RESET}")

def check_directory_structure():
    """Check if all required directories exist."""
    print("\n" + "="*60)
    print("Checking Directory Structure...")
    print("="*60)
    
    required_dirs = [
        'app',
        'sql',
        'bin',
        'uploads/photos'
    ]
    
    all_good = True
    for dir_path in required_dirs:
        if os.path.isdir(dir_path):
            print_success(f"Directory exists: {dir_path}")
        else:
            print_error(f"Missing directory: {dir_path}")
            if dir_path == 'uploads/photos':
                print_info(f"  Run: mkdir -p {dir_path}")
            all_good = False
    
    return all_good

def check_files():
    """Check if all required files exist."""
    print("\n" + "="*60)
    print("Checking Required Files...")
    print("="*60)
    
    required_files = {
        'app/__init__.py': 'Flask app initializer',
        'app/config.py': 'Configuration file',
        'app/db.py': 'Database utilities',
        'app/routes.py': 'API routes',
        'app/photo_service.py': 'Photo service (NEW - you need to add this)',
        'bin/JourniTagDB': 'Database script',
        'bin/JourniTagRun': 'Run script',
        'sql/schema.sql': 'Database schema',
    }
    
    all_good = True
    for file_path, description in required_files.items():
        if os.path.isfile(file_path):
            print_success(f"{file_path} - {description}")
        else:
            print_error(f"Missing: {file_path} - {description}")
            all_good = False
    
    return all_good

def check_imports():
    """Check if required Python packages are installed."""
    print("\n" + "="*60)
    print("Checking Python Dependencies...")
    print("="*60)
    
    packages = {
        'flask': 'Flask framework',
        'PIL': 'Pillow (for EXIF extraction)',
    }
    
    all_good = True
    for package, description in packages.items():
        try:
            __import__(package)
            print_success(f"{package} - {description}")
        except ImportError:
            print_error(f"Missing: {package} - {description}")
            if package == 'PIL':
                print_info("  Run: pip install Pillow")
            else:
                print_info(f"  Run: pip install {package}")
            all_good = False
    
    return all_good

def check_config():
    """Check if config.py has all required settings."""
    print("\n" + "="*60)
    print("Checking Configuration...")
    print("="*60)
    
    try:
        # Add current directory to path
        sys.path.insert(0, os.getcwd())
        from app import config
        
        required_settings = [
            'APPLICATION_ROOT',
            'DATABASE_FILENAME',
            'UPLOAD_FOLDER',
            'MAX_CONTENT_LENGTH',
            'ALLOWED_EXTENSIONS'
        ]
        
        all_good = True
        for setting in required_settings:
            if hasattr(config, setting):
                value = getattr(config, setting)
                print_success(f"{setting} = {value}")
            else:
                print_error(f"Missing config: {setting}")
                all_good = False
        
        return all_good
        
    except Exception as e:
        print_error(f"Error loading config: {e}")
        return False

def check_photo_service():
    """Check if photo_service.py exists and can be imported."""
    print("\n" + "="*60)
    print("Checking Photo Service...")
    print("="*60)
    
    if not os.path.isfile('app/photo_service.py'):
        print_error("app/photo_service.py does not exist!")
        print_info("  Download flask_photo_service.py and save it as app/photo_service.py")
        return False
    
    try:
        sys.path.insert(0, os.getcwd())
        from app.photo_service import photo_service, PhotoService
        
        print_success("photo_service.py found and importable")
        print_success(f"PhotoService class found")
        
        # Check if upload directory is configured
        if os.path.isdir(photo_service.upload_dir):
            print_success(f"Upload directory exists: {photo_service.upload_dir}")
        else:
            print_warning(f"Upload directory will be created: {photo_service.upload_dir}")
        
        return True
        
    except Exception as e:
        print_error(f"Error importing photo_service: {e}")
        return False

def check_routes():
    """Check if routes.py has photo upload endpoints."""
    print("\n" + "="*60)
    print("Checking Routes...")
    print("="*60)
    
    if not os.path.isfile('app/routes.py'):
        print_error("app/routes.py does not exist!")
        return False
    
    try:
        with open('app/routes.py', 'r') as f:
            content = f.read()
        
        required_routes = {
            '/api/photos/batch-upload': 'batch_upload_photos',
            '/api/photos/location/': 'get_photos_by_location',
            '/api/photos/<int:photo_id>/set-cover': 'set_cover_photo',
            '/api/photos/<int:photo_id>': 'delete_photo (DELETE)',
        }
        
        all_good = True
        for route, function_name in required_routes.items():
            if route.replace('<int:photo_id>', '') in content:
                print_success(f"Route found: {route} ({function_name})")
            else:
                print_error(f"Missing route: {route} ({function_name})")
                all_good = False
        
        # Check for photo_service import
        if 'from app.photo_service import photo_service' in content or 'from app.photo_service import' in content:
            print_success("photo_service import found in routes.py")
        else:
            print_error("Missing import in routes.py")
            print_info("  Add: from app.photo_service import photo_service")
            all_good = False
        
        return all_good
        
    except Exception as e:
        print_error(f"Error checking routes: {e}")
        return False

def check_database():
    """Check if database exists and has required tables."""
    print("\n" + "="*60)
    print("Checking Database...")
    print("="*60)
    
    db_path = 'sql/greetings.db'
    
    if not os.path.isfile(db_path):
        print_warning(f"Database not found: {db_path}")
        print_info("  Run: ./bin/JourniTagDB create")
        return False
    
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        required_tables = ['Users', 'Trips', 'Locations', 'Photos', 'SharedTrips']
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        all_good = True
        for table in required_tables:
            if table in existing_tables:
                print_success(f"Table exists: {table}")
            else:
                print_error(f"Missing table: {table}")
                all_good = False
        
        conn.close()
        return all_good
        
    except Exception as e:
        print_error(f"Error checking database: {e}")
        return False

def check_init_file():
    """Check if __init__.py has static file serving configured."""
    print("\n" + "="*60)
    print("Checking __init__.py Configuration...")
    print("="*60)
    
    if not os.path.isfile('app/__init__.py'):
        print_error("app/__init__.py does not exist!")
        return False
    
    try:
        with open('app/__init__.py', 'r') as f:
            content = f.read()
        
        checks = {
            'SharedDataMiddleware': 'Static file serving for uploads',
            '/uploads': 'Upload URL mapping',
        }
        
        all_good = True
        for check, description in checks.items():
            if check in content:
                print_success(f"{description} configured")
            else:
                print_warning(f"Missing: {description}")
                print_info("  See FLASK_INTEGRATION_GUIDE.md for __init__.py updates")
                all_good = False
        
        return all_good
        
    except Exception as e:
        print_error(f"Error checking __init__.py: {e}")
        return False

def main():
    """Run all validation checks."""
    print(f"\n{BLUE}{'='*60}")
    print("JourniTag Photo Upload - Setup Validator")
    print(f"{'='*60}{RESET}\n")
    
    print_info(f"Running from: {os.getcwd()}")
    
    results = []
    
    # Run all checks
    results.append(("Directory Structure", check_directory_structure()))
    results.append(("Required Files", check_files()))
    results.append(("Python Dependencies", check_imports()))
    results.append(("Configuration", check_config()))
    results.append(("Photo Service", check_photo_service()))
    results.append(("Routes", check_routes()))
    results.append(("Database", check_database()))
    results.append(("Init File", check_init_file()))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        if result:
            print_success(f"{check_name}: PASSED")
        else:
            print_error(f"{check_name}: FAILED")
    
    print("\n" + "="*60)
    if passed == total:
        print_success(f"All checks passed! ({passed}/{total})")
        print_info("\nYou're ready to start the server:")
        print_info("  ./bin/JourniTagRun")
    else:
        print_error(f"Some checks failed ({passed}/{total} passed)")
        print_info("\nReview the errors above and fix them.")
        print_info("Check FLASK_INTEGRATION_GUIDE.md for detailed setup instructions.")
    print("="*60 + "\n")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)