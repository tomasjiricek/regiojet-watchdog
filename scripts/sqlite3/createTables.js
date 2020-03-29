const sqlite = require('sqlite3').verbose();

const { PATHS } = require('../../src/common/constants');

const SQL_CREATE_TABLE = {
    AUTHORIZED_DEVICES:
        `CREATE TABLE authorized_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id VARCHAR(35) NOT NULL
        )`,
    USERS:
        `CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token VARCHAR(64) NOT NULL,
            device_id VARCHAR(35) NOT NULL
        )`,
    WATCHED_ROUTES:
        `CREATE TABLE watched_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            route_id INTEGER NOT NULL,
            arrival_station_id INTEGER NOT NULL,
            arrival_station_name VARCHAR(100) NOT NULL,
            arrival_time VARCHAR(35) NOT NULL,
            departure_station_id INTEGER NOT NULL,
            departure_station_name VARCHAR(100) NOT NULL,
            departure_time VARCHAR(35) NOT NULL,
            free_seats_count INTEGER NOT NULL,
            transfers_count INTEGER NOT NULL,
            travel_time VARCHAR(15) NOT NULL,
            vehicle_types VARCHAR(100) NOT NULL
        )`,
    PUSH_SUBSCRIPTIONS:
        `CREATE TABLE push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            endpoint VARCHAR(300) NOT NULL,
            p256dh VARCHAR(150) NOT NULL,
            auth VARCHAR(50) NOT NULL
        )`

}

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);

db.on('open', () => {
    Object.values(SQL_CREATE_TABLE).forEach((sqlQuery) => {
        db.run(sqlQuery, (error) => {
            if (error) {
                console.error('Failed to create table:', error.message);
            }
        });
    });
});

process.on('exit', () => {
    db.close();
});
