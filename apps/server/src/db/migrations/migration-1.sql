CREATE TABLE bounds(
    id INTEGER PRIMARY KEY,
    longitudeMax REAL,
    longitudeMin REAL,
    latitudeMax REAL,
    latitudeMin REAL
    label TEXT
);

CREATE TABLE aircraft(
    id INTEGER PRIMARY KEY,
    modelCode TEXT,
    modelText TEXT,
    registration TEXT UNIQUE
);


CREATE TABLE airline(
    id INTEGER PRIMARY KEY,
    icao TEXT UNIQUE,
    iata TEXT UNIQUE,
    name TEXT
);

CREATE TABLE airport(
    id INTEGER PRIMARY KEY,
    icao TEXT UNIQUE,
    iata TEXT UNIQUE,
    name TEXT
);

CREATE TABLE flight(
    id TEXT PRIMARY KEY,
    callsign TEXT,
    flightNumber TEXT,
    altitude INTEGER,
    groundSpeed INTEGER,
    heading INTEGER,
    scheduledDeparture INTEGER,
    estimatedDeparture INTEGER,
    actualDeparture INTEGER,
    scheduledArrival INTEGER,
    estimatedArrival INTEGER,
    actualArrival INTEGER,
    timestamp INTEGER,
    boundsId INTEGER,
    aircraftId INTEGER,
    airlineId INTEGER,
    originAirportId INTEGER,
    destinationAirportId INTEGER,
    FOREIGN KEY(boundsId) REFERENCES bounds(id),
    FOREIGN KEY(aircraftId) REFERENCES aircraft(id),
    FOREIGN KEY(airlineId) REFERENCES airline(id),
    FOREIGN KEY(originAirportId) REFERENCES airport(id),
    FOREIGN KEY(destinationAirportId) REFERENCES airport(id)
);

CREATE TABLE activeFlight(
    flightId TEXT PRIMARY KEY,
    FOREIGN KEY(flightId) REFERENCES flight(id)
);