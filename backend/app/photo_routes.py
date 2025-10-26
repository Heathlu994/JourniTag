"""Photo upload routes to add to your existing routes.py."""
import flask
from app import app
from app.db import get_db
from app.photo_service import photo_service


@app.route('/api/photos/batch-upload', methods=['POST'])
def batch_upload_photos():
    """
    Batch upload photos with automatic EXIF extraction and location creation.
    
    Form data:
    - trip_id: int
    - user_id: int
    - files: multiple files
    """
    # Get form data
    trip_id = flask.request.form.get('trip_id', type=int)
    user_id = flask.request.form.get('user_id', type=int)
    
    if not trip_id or not user_id:
        return flask.jsonify({
            'success': False,
            'error': 'trip_id and user_id are required'
        }), 400
    
    # Get uploaded files
    files = flask.request.files.getlist('files')
    
    if not files:
        return flask.jsonify({
            'success': False,
            'error': 'No files uploaded'
        }), 400
    
    # Get database connection
    connection = get_db()
    
    # Verify trip exists and belongs to user
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE id = ?", 
        (trip_id,)
    )
    trip = cursor.fetchone()
    
    if not trip:
        return flask.jsonify({
            'success': False,
            'error': 'Trip not found'
        }), 404
    
    if trip['user_id'] != user_id:
        return flask.jsonify({
            'success': False,
            'error': 'Not authorized to upload to this trip'
        }), 403
    
    # Process batch upload
    try:
        created_photos = photo_service.batch_upload_photos(
            connection=connection,
            files=files,
            trip_id=trip_id,
            user_id=user_id
        )
        
        return flask.jsonify({
            'success': True,
            'photos_uploaded': len(created_photos),
            'photos': created_photos,
            'message': f'Successfully uploaded {len(created_photos)} photos'
        })
    
    except Exception as e:
        return flask.jsonify({
            'success': False,
            'error': f'Error uploading photos: {str(e)}'
        }), 500


@app.route('/api/photos/location/<int:location_id>', methods=['GET'])
def get_photos_by_location(location_id):
    """Get all photos for a specific location."""
    connection = get_db()
    
    cursor = connection.execute(
        "SELECT * FROM Photos WHERE location_id = ?",
        (location_id,)
    )
    photos = cursor.fetchall()
    
    return flask.jsonify({
        'success': True,
        'photos': photos
    })


@app.route('/api/photos/<int:photo_id>/set-cover', methods=['PATCH', 'POST'])
def set_cover_photo(photo_id):
    """Set a photo as the cover photo for its location."""
    user_id = flask.request.form.get('user_id', type=int)
    
    if not user_id:
        return flask.jsonify({
            'success': False,
            'error': 'user_id is required'
        }), 400
    
    connection = get_db()
    
    # Get photo
    cursor = connection.execute(
        "SELECT * FROM Photos WHERE id = ?",
        (photo_id,)
    )
    photo = cursor.fetchone()
    
    if not photo:
        return flask.jsonify({
            'success': False,
            'error': 'Photo not found'
        }), 404
    
    # Verify user owns this photo
    if photo['user_id'] != user_id:
        return flask.jsonify({
            'success': False,
            'error': 'Not authorized'
        }), 403
    
    # Remove cover status from other photos at this location
    connection.execute(
        "UPDATE Photos SET is_cover_photo = 0 WHERE location_id = ? AND is_cover_photo = 1",
        (photo['location_id'],)
    )
    
    # Set this photo as cover
    connection.execute(
        "UPDATE Photos SET is_cover_photo = 1 WHERE id = ?",
        (photo_id,)
    )
    
    connection.commit()
    
    return flask.jsonify({
        'success': True,
        'message': 'Cover photo updated'
    })


@app.route('/api/photos/<int:photo_id>', methods=['DELETE'])
def delete_photo(photo_id):
    """Delete a photo."""
    user_id = flask.request.form.get('user_id', type=int)
    
    if not user_id:
        return flask.jsonify({
            'success': False,
            'error': 'user_id is required'
        }), 400
    
    connection = get_db()
    
    # Get photo
    cursor = connection.execute(
        "SELECT * FROM Photos WHERE id = ?",
        (photo_id,)
    )
    photo = cursor.fetchone()
    
    if not photo:
        return flask.jsonify({
            'success': False,
            'error': 'Photo not found'
        }), 404
    
    # Verify user owns this photo
    if photo['user_id'] != user_id:
        return flask.jsonify({
            'success': False,
            'error': 'Not authorized'
        }), 403
    
    # Delete file from storage
    import os
    file_path = f".{photo['file_url']}"  # Convert URL to file path
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    connection.execute(
        "DELETE FROM Photos WHERE id = ?",
        (photo_id,)
    )
    
    connection.commit()
    
    return flask.jsonify({
        'success': True,
        'message': 'Photo deleted'
    })