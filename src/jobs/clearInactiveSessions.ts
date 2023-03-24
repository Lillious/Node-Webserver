const db = require('../utils/database');

// Initially, delete all sessions that are older than 8 hours
db.query('DELETE FROM sessions WHERE created + interval 8 hour < now()');

// Create a job to delete all sessions that are older than 8 hours, every hour
setInterval(() => {
    db.query('DELETE FROM sessions WHERE created + interval 8 hour < now()');
}, 3.6e+6);