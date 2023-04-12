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
];

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

// Get all blocked IPs from the database and store them in memory for faster access
const ipservice = require('../utils/ipservice');
db.query('SELECT * FROM blocked_ips')
    .then((result: any) => {
        result.forEach((element: any) => {
            ipservice.bservice.add(element.ip);
        });
    });

// Get all allowed IPs from the database and store them in memory for faster access
db.query('SELECT * FROM allowed_ips')
    .then((result: any) => {
        result.forEach((element: any) => {
            ipservice.wservice.add(element.ip);
        });
    });

server.app.use(function(req: any, res: any, next: any) {
    requests++;
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // Check if null routing is enabled
    if (settings.nullRouting) {
        // Check if the IP is allowed and return if not
        const w_ips = ipservice.wservice.getIPs();
        if (!w_ips.includes(ip)) return;
    } else {
        // Check if the IP is blocked
        const b_ips = ipservice.bservice.getIPs();
        if (b_ips.includes(ip)) return;
        const found = paths.some(element => {
            if (req.url.includes(element)) {
                return true;
            } else {
                return false;
            }
        });
        if (found) {
            const w_ips = ipservice.wservice.getIPs();
            const b_ips = ipservice.bservice.getIPs();
            if (!b_ips.includes(ip) && !w_ips.includes(ip)) {
                db.query('INSERT INTO blocked_ips (ip) VALUES (?)', [ip])
                    .then(() => {
                        logging.log.error(`[BLOCKED] - ${ip} - ${req.url}`);
                        ipservice.bservice.add(ip);
                    });
            }
            return;
        } else {
            next();
        }
    }
});