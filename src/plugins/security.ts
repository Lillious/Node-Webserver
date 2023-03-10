const server = require('../app');
const logging = require('../utils/logging');
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
    'wp-login.php',
    'admin-ajax.php',
    '.env',
    'view-source',
    'wlwmanifest.xml',
    'credentials',
    'phpinfo',
    'test.php',
    '.aws',
    'wp-config.php',
    'wp-admin',
    'shell',
    'wget',
    'curl',
    'showLogin.cc',
    'phpunit.xml',
    'phpunit.xml.dist',
    'phpstorm',
    'mlrpc.php',
]
server.app.use(function(req: any, res: any, next: any) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
    const found = paths.some(element => {
        if (req.url.includes(element)) {
            // Get the IP address of the request
            logging.log.error(`[${ip}] Attack blocked: ${req.url}`);
            return true;
        } else {
            return false;
        }
    });
    if (found) {
        return res.status(418).send(`Attack blocked and recorded using IP: ${ip}`);
    } else {
        next();
    }
});