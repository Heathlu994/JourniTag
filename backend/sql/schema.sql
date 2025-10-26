CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    profile_photo_url TEXT,
    created_at INTEGER
);


CREATE TABLE Trips (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    start_date INTEGER,
    end_date INTEGER,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);


CREATE TABLE Locations (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    x REAL,
    y REAL,
    name VARCHAR(255),
    address TEXT,
    rating INTEGER,
    notes TEXT,
    tags TEXT,
    time_needed INTEGER,
    best_time_to_visit VARCHAR(100),
    created_at INTEGER,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);


CREATE TABLE Photos (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    x REAL,
    y REAL,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255),
    taken_at INTEGER,
    is_cover_photo BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (location_id) REFERENCES Locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);


CREATE TABLE SharedTrips (
    id INTEGER PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    shared_by_user_id INTEGER NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    share_token TEXT,
    created_at INTEGER,
    expires_at INTEGER,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES Users(id) ON DELETE CASCADE
);
