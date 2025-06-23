from flask import Flask, render_template, jsonify, request,send_file
from flask_bootstrap import Bootstrap5
import os,dotenv,time
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.sql import func # For default timestamps

app = Flask(__name__)

dotenv.load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
Bootstrap5(app)

# --- Database Configuration ---
# Use an absolute path for SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'year_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable tracking modifications for performance

db = SQLAlchemy(app)

# --- SQLAlchemy Models ---
# (Move your models from the previous response here, modifying slightly for Flask-SQLAlchemy)

class Year(db.Model):
    __tablename__ = 'years'
    id = db.Column(db.Integer, primary_key=True)
    year_number = db.Column(db.Integer, unique=True, nullable=False)
    tracks = db.relationship('Track', backref='year', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Year(id={self.id}, year_number={self.year_number})>"

class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    year_id = db.Column(db.Integer, db.ForeignKey('years.id'), nullable=False)
    colors = db.relationship('Color', backref='track', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Track(id={self.id}, name='{self.name}', year_id={self.year_id})>"

class Color(db.Model):
    __tablename__ = 'colors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    hex_code = db.Column(db.String(7), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)

    def __repr__(self):
        return f"<Color(id={self.id}, name='{self.name}', hex_code='{self.hex_code}', track_id={self.track_id})>"

# New Model for Storing Day Data (which color was applied on which day)
class DayData(db.Model):
    __tablename__ = 'day_data'
    id = db.Column(db.Integer, primary_key=True)
    year_id = db.Column(db.Integer, db.ForeignKey('years.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False) # 1-12
    day = db.Column(db.Integer, nullable=False)   # 1-31
    color_id = db.Column(db.Integer, db.ForeignKey('colors.id'), nullable=True) # Null if no color assigned
    # Optional: timestamp for when it was last updated
    last_updated = db.Column(db.DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships to access related objects easily
    year = db.relationship('Year', backref=db.backref('day_data', lazy=True))
    track = db.relationship('Track', backref=db.backref('day_data', lazy=True))
    color = db.relationship('Color', backref=db.backref('day_data', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('year_id', 'track_id', 'month', 'day', name='_year_track_day_uc'),
    )

    def __repr__(self):
        return f"<DayData(id={self.id}, year_id={self.year_id}, track_id={self.track_id}, month={self.month}, day={self.day}, color_id={self.color_id})>"


# --- Initial Database Setup (Run this once to create tables and add initial data) ---
# @app.before_request
def create_tables_and_initial_data():
    db.create_all() # Creates all tables if they don't exist
    
    # Add initial data if it doesn't exist
    session = db.session
    try:
        current_year = 2025 # Or use datetime.datetime.now().year for current year

        # Add the Year
        year_obj = Year.query.filter_by(year_number=current_year).first()
        if not year_obj:
            year_obj = Year(year_number=current_year)
            session.add(year_obj)
            session.commit()
            print(f"Added Year: {year_obj.year_number}")
        else:
            print(f"Year {year_obj.year_number} already exists.")

        # Add default Tracks
        default_tracks = ['Mood', 'Exercise', 'Early Bed', 'Early Rise']
        for track_name in default_tracks:
            track_obj = Track.query.filter_by(name=track_name, year_id=year_obj.id).first()
            if not track_obj:
                track_obj = Track(name=track_name, year=year_obj)
                session.add(track_obj)
                session.commit()
                print(f"Added Track: {track_obj.name} for {year_obj.year_number}")
            else:
                print(f"Track '{track_obj.name}' for {year_obj.year_number} already exists.")

            # Add some default colors for Mood track specifically
            if track_name == 'Mood':
                mood_colors = [
                    {'name': 'Happy', 'hex_code': '#FFD700'},  # Gold
                    {'name': 'Neutral', 'hex_code': '#ADD8E6'}, # Light Blue
                    {'name': 'Sad', 'hex_code': '#DC143C'},    # Crimson
                    {'name': 'Excited', 'hex_code': '#FFA07A'},# Light Salmon
                    {'name': 'Relaxed', 'hex_code': '#90EE90'} # Light Green
                ]
                for color_data in mood_colors:
                    if not Color.query.filter_by(name=color_data['name'], track=track_obj).first():
                        session.add(Color(name=color_data['name'], hex_code=color_data['hex_code'], track=track_obj))
                        session.commit()
                        print(f"Added Color: {color_data['name']} for Mood")

            # Add some default colors for Exercise track
            if track_name == 'Exercise':
                exercise_colors = [
                    {'name': 'High Intensity', 'hex_code': '#FF4500'},  # OrangeRed
                    {'name': 'Moderate', 'hex_code': '#32CD32'},       # LimeGreen
                    {'name': 'Light', 'hex_code': '#87CEEB'},          # SkyBlue
                    {'name': 'Rest Day', 'hex_code': '#D3D3D3'}        # LightGray
                ]
                for color_data in exercise_colors:
                    if not Color.query.filter_by(name=color_data['name'], track=track_obj).first():
                        session.add(Color(name=color_data['name'], hex_code=color_data['hex_code'], track=track_obj))
                        session.commit()
                        print(f"Added Color: {color_data['name']} for Exercise")

    except Exception as e:
        session.rollback()
        print(f"Error during initial data setup: {e}")
    finally:
        session.close() # Close the session


# --- Routes ---

@app.route('/')
def index():
    # Fetch all tracks for the current (or default) year to populate tab links
    current_year_number = 2025 # Or make this dynamic based on user selection/current date
    year_obj = Year.query.filter_by(year_number=current_year_number).first()
    
    tracks = []
    if year_obj:
        tracks = year_obj.tracks
    
    # You might want to default to the first track's ID and name for the initial load
    initial_track_id = tracks[0].id if tracks else None
    initial_track_name = tracks[0].name if tracks else None

    return render_template('index.html', tracks=tracks, initial_track_id=initial_track_id, initial_track_name=initial_track_name, current_year=current_year_number)

@app.route('/get_track_data/<int:year_id>/<int:track_id>')
def get_track_data(year_id, track_id):
    track = Track.query.get(track_id)
    if not track or track.year_id != year_id:
        return jsonify({"error": "Track not found for the specified year"}), 404

    # Fetch colors for the track
    colors = [
        {"id": color.id, "name": color.name, "hex_code": color.hex_code}
        for color in track.colors
    ]

    # Fetch existing day data for the track and year
    day_data = DayData.query.filter_by(year_id=year_id, track_id=track_id).all()
    day_data_map = {}
    for data in day_data:
        day_data_map[f"{data.month}-{data.day}"] = data.color_id

    return jsonify({
        "track_name": track.name,
        "colors": colors,
        "day_data": day_data_map # { "month-day": color_id }
    })

@app.route('/update_day_color', methods=['POST'])
def update_day_color():
    data = request.get_json()
    year_id = data.get('yearId')
    track_id = data.get('trackId')
    month = data.get('month')
    day = data.get('day')
    color_id = data.get('colorId') # Can be null to clear the color

    if not all([year_id, track_id, month, day is not None]):
        return jsonify({"error": "Missing required data"}), 400

    try:
        # Find existing DayData entry or create a new one
        day_entry = DayData.query.filter_by(
            year_id=year_id,
            track_id=track_id,
            month=month,
            day=day
        ).first()

        if day_entry:
            day_entry.color_id = color_id
        else:
            day_entry = DayData(
                year_id=year_id,
                track_id=track_id,
                month=month,
                day=day,
                color_id=color_id
            )
            db.session.add(day_entry)

        db.session.commit()
        return jsonify({"success": True, "message": "Day color updated"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/add_color', methods=['POST'])
def add_color():
    data = request.get_json()
    track_id = data.get('trackId')
    color_name = data.get('colorName')
    hex_code = data.get('hexCode') # You'll need to generate or choose this on the frontend

    if not all([track_id, color_name, hex_code]):
        return jsonify({"error": "Missing required data"}), 400

    track = Track.query.get(track_id)
    if not track:
        return jsonify({"error": "Track not found"}), 404

    # Check for duplicate color name within the same track
    existing_color = Color.query.filter_by(track_id=track_id, name=color_name).first()
    if existing_color:
        return jsonify({"error": "Color name already exists for this track"}), 409 # Conflict

    try:
        new_color = Color(name=color_name, hex_code=hex_code, track=track)
        db.session.add(new_color)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Color added successfully",
            "color": {"id": new_color.id, "name": new_color.name, "hex_code": new_color.hex_code}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/delete_color/<int:color_id>', methods=['DELETE'])
def delete_color(color_id):
    color_to_delete = Color.query.get(color_id)
    if not color_to_delete:
        return jsonify({"error": "Color not found"}), 404

    try:
        # Before deleting the color, set any DayData entries that use this color to NULL
        # This prevents foreign key constraint errors
        DayData.query.filter_by(color_id=color_id).update({"color_id": None})
        
        db.session.delete(color_to_delete)
        db.session.commit()
        return jsonify({"success": True, "message": "Color deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/edit_color/<int:color_id>', methods=['PUT'])
def edit_color(color_id):
    color_to_edit = Color.query.get(color_id)
    if not color_to_edit:
        return jsonify({"error": "Color not found"}), 404
    
    data = request.get_json()
    new_name = data.get('name')
    new_hex_code = data.get('hexCode')

    if not new_name and not new_hex_code:
        return jsonify({"error": "No data provided for update"}), 400

    try:
        if new_name:
            # Check for duplicate name if changing name
            if new_name != color_to_edit.name:
                existing_color = Color.query.filter_by(track_id=color_to_edit.track_id, name=new_name).first()
                if existing_color and existing_color.id != color_to_edit.id:
                    return jsonify({"error": "Color name already exists for this track"}), 409
            color_to_edit.name = new_name
        if new_hex_code:
            color_to_edit.hex_code = new_hex_code
        
        db.session.commit()
        return jsonify({"success": True, "message": "Color updated successfully", "color": {"id": color_to_edit.id, "name": color_to_edit.name, "hex_code": color_to_edit.hex_code}}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/add_track', methods=['POST'])
def add_track():
    data = request.get_json()
    track_name = data.get('trackName')
    year_id = data.get('yearId') # You'll need to decide how to get the year. For now, assume it's passed.
    # print(f"Received data: {data}")  # Debugging line to see what data is received
    year_id = str(year_id)  # Ensure year_id is a string if it's coming from a form input
    if not track_name or not year_id:
        return jsonify({'success': False, 'error': 'Track name and year are required.'}), 400
    year_id = int(year_id)  # Convert year_id to integer if it's a string
    # Validate year_id
    year = Year.query.get(year_id)
    if not year:
        return jsonify({'success': False, 'error': 'Invalid year ID.'}), 404
    
    # Check if name already exists for this year
    existing_track = Track.query.filter_by(name=track_name, year_id=year_id).first()
    if existing_track:
        return jsonify({'success': False, 'error': 'Track name already exists for this year.'}), 409

    try:
        new_track = Track(name=track_name, year_id=year_id)
        db.session.add(new_track)
        db.session.commit()
        return jsonify({'success': True, 'id': new_track.id, 'name': new_track.name}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/delete_track/<int:track_id>', methods=['DELETE'])
def delete_track(track_id):
    track_to_delete = Track.query.get(track_id)
    if not track_to_delete:
        return jsonify({"error": "Track not found"}), 404

    try:
        # Before deleting the track, delete all associated day data
        DayData.query.filter_by(track_id=track_id).delete()
        
        db.session.delete(track_to_delete)
        db.session.commit()
        return jsonify({"success": True, "message": "Track deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/edit_track/<int:track_id>', methods=['PUT'])
def edit_track(track_id):
    track_to_edit = Track.query.get(track_id)
    if not track_to_edit:
        return jsonify({"error": "Track not found"}), 404
    
    data = request.get_json()
    new_name = data.get('name')

    if not new_name:
        return jsonify({"error": "No name provided for update"}), 400

    try:
        # Check for duplicate name if changing name
        if new_name != track_to_edit.name:
            existing_track = Track.query.filter_by(name=new_name, year_id=track_to_edit.year_id).first()
            if existing_track and existing_track.id != track_to_edit.id:
                return jsonify({"error": "Track name already exists for this year"}), 409
        
        track_to_edit.name = new_name
        db.session.commit()
        return jsonify({"success": True, "message": "Track updated successfully", "track": {"id": track_to_edit.id, "name": track_to_edit.name}}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True,port=5001)
