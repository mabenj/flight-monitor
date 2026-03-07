CREATE TABLE settings(
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT
);

INSERT INTO settings (key, value) VALUES ('brightness', '100');