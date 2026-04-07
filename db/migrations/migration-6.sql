-- Drop the foreign key constraint on the activeFlight table. 
-- No need to migrate the data since the data is transient

DROP TABLE activeFlight;

CREATE TABLE activeFlight(
    flightId TEXT PRIMARY KEY
);