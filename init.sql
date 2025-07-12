CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    section TEXT,
    grade TEXT,
    badges TEXT,
    behavior TEXT,
    orderNumber INTEGER DEFAULT NULL,
    behaviorScore INTEGER DEFAULT NULL,
    participationScore INTEGER DEFAULT NULL,
    homeworkScore INTEGER DEFAULT NULL,
    attendance INTEGER DEFAULT NULL,
    color TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT,
    students INTEGER,
    excellent INTEGER,
    issues INTEGER
);

CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    time TEXT,
    section TEXT,
    teacher TEXT
);


