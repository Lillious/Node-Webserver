import * as log from '../utils/logging.js';
import query from '../utils/database.js';
import {service} from '../utils/ipservice.js';
const w_ips = service.getWhitelistedIPs();
const b_ips = service.getBlacklistedIPs();
import {NullRoutingService} from '../utils/nullrouting.js';
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
        if (!NullRoutingService.isEnabled()) {
            log.error(`[DDOS DETECTED] - Requests per second: ${requests}`);
            // Enable null routing
            NullRoutingService.enable();
        }
    } else {
        if (NullRoutingService.isEnabled()) {
            // Disable null routing
            NullRoutingService.disable();
        }
    }
    requests = 0;
}, 1000);

// Get all blocked IPs from the database and store them in memory for faster access
query('SELECT * FROM blocked_ips')
    .then((result: any) => {
        result.forEach((element: any) => {
            service.blacklistAdd(element.ip);
        });
    });

// Get all allowed IPs from the database and store them in memory for faster access
query('SELECT * FROM allowed_ips')
    .then((result: any) => {
        result.forEach((element: any) => {
            service.whitelistAdd(element.ip);
        });
    })
    .catch((err: any) => {
        log.error(err);
    });

export default function filter(req: any, res: any, next: any, ip: any): void {
        log.info(`[REQUEST] - ${req.url}`);
        requests++;
        // Check if null routing is enabled
        if (NullRoutingService.isEnabled()) {
            // Check if the IP is allowed and return if not
            if (!w_ips.includes(ip)) return;
        } else {
            // Check if the IP is blocked
            if (b_ips.includes(ip)) return;
            const found = paths.some(element => {
                if (req.url.includes(element)) {
                    return true;
                } else {
                    return false;
                }
            });
            if (found) {
                if (b_ips.includes(ip) || w_ips.includes(ip)) return; // IP is already blocked or is whitelisted. Ignore
                query('INSERT INTO blocked_ips (ip) VALUES (?)', [ip])
                    .then(() => {
                        log.error(`[BLOCKED] - ${ip} - ${req.url}`);
                        service.blacklistAdd(ip);
                    })
                    .catch((err: any) => {
                        log.error(err);
                    });
                return;
            } else {
                next();
            }
        }
}
