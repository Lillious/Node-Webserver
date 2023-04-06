const server = require('../app');
const logging = require('../utils/logging');
const db = require('../utils/database');
const fs = require('fs'), path = require('path');
const settings = require('../settings.json');

const paths = [
    '.env',
    'ajax.js',
    'drupal.js',
    'jquery.js',
    'jquery.once.js',
    'drupal.js',
    'drupalSettingsLoader.js',
    'l10n.js',
    'drupal.js',
    '.env',
    'view-source',
    'wlwmanifest.xml',
    'credentials',
    '.aws',
    'wp-admin',
    'shell',
    'wget',
    'curl',
    'showLogin.cc',
    'get_targets',
    'bablosoft',
    'console',
    'Autodiscover.xml',
    'execute-solution',
    'mt-xmlrpc.cgi',
    'php'
]

let requests = 0;

// Calculate requests per second to the website to determine if the website is under attack
setInterval(() => {
    if (requests > 100) {
        if (!settings.nullRouting) {
            logging.log.error(`[DDOS DETECTED] - Requests per second: ${requests}`);
            // Enable null routing
            settings.nullRouting = true;
            fs.writeFileSync(path.join(__dirname, '..', 'settings.json'), JSON.stringify(settings, null, 4));
        }
    } else {
        if (settings.nullRouting) {
            // Disable null routing
            settings.nullRouting = false;
            fs.writeFileSync(path.join(__dirname, '..', 'settings.json'), JSON.stringify(settings, null, 4));
        }
    }
    requests = 0;
}, 1000);

server.app.use(function(req: any, res: any, next: any) {
    requests++;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // Check if null routing is enabled
    if (settings.nullRouting) {
        // Check if the IP is allowed and return if not
        db.query('SELECT * FROM allowed_ips WHERE ip = ?', [ip])
        .then((result: any) => {
            if (result.length === 0) return;
        });
    } else {
        // Check if the IP is blocked
        db.query('SELECT * FROM blocked_ips WHERE ip = ?', [ip])
        .then((result: any) => {
            if (result.length > 0) return;
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
            res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
            const found = paths.some(element => {
                if (req.url.includes(element)) {
                    return true;
                } else {
                    return false;
                }
            });
            if (found) {
                BlockIp(ip);
                return;
            } else {
                next();
            }
        });
    }
});

function BlockIp (ip: string) {
    // Check if the IP is allowed
    db.query('SELECT * FROM allowed_ips WHERE ip = ?', [ip])
    .then((result: any) => {
        if (result.length > 0) return;
        db.query('INSERT INTO blocked_ips (ip) VALUES (?)', [ip])
        .then(() => {
            logging.log.warn('Blocked IP: ' + ip);
        });
    });
}