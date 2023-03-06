const express = require('express');
const compression = require('compression');
const app = express();
const path = require('node:path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require("cookie-session")
const http = require('node:http');
const cluster = require('node:cluster');
const numCPUs = require('node:os').availableParallelism();
const rateLimit = require('express-rate-limit');
const vhost = require('vhost');
const hpp = require('hpp');

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(compression());
app.disable('x-powered-by');
app.use(hpp());

// Timestamps for Logging
const timestamp = () => { return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); }

// Logging Setup
const log = {
    info: (message: string) => console.log(`${timestamp()} \x1b[32m${message}\x1b[0m`),
    error: (message: string) => console.error(`${timestamp()} \x1b[31m${message}\x1b[0m`),
    warn: (message: string) => console.warn(`${timestamp()} \x1b[33m${message}\x1b[0m`)
};

// Authentication Setup
const authentication = require('./utils/authentication');

// Session Setup
app.use(session({
    name: 'session',
    keys: ['key1', 'key2'], // !! Change this !!
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set('trust proxy', 1);

// Sub Domain Setup and Static Files Setup
app.set('subdomain offset', 1);

app.use(vhost('cpanel.*.*', function(req: any, res: any, next: any) {
        if (req.cookies.session) {
        authentication.checkSession(req.cookies.session).then((email: string) => {
            express.static(path.join(__dirname, '/cpanel'), { maxAge: 31557600 })(req, res, next);
            next();
        }).catch((err: any) => {
            log.error(err);
            const domain = req.headers.host.split('.').slice(-2).join('.');
            res.redirect(`${res.protocol}://login.${domain}`);
        });
    } else {
        log.info(`User ${req.cookies.session} is not logged in`);
        const domain = req.headers.host.split('.').slice(-2).join('.');
        res.redirect(`${res.protocol}://login.${domain}`);
    }
}));
app.use(vhost('login.*.*', express.static(path.join(__dirname, '/login'), { maxAge: 31557600 })));

// Check if the url has repeating slashes at the end of the domain
app.use(function(req: any, res: any, next: any) {
    let url = req.url;
    if (url.match(/\/{2,}$/)) {
        // Remove repeating slashes at the end of the domain
        url = url.replace(/\/{2,}$/g, '/');
        // Redirect to the new url
        res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}${url}`);
    } else {
        next();
    }
});

// Root Domain Setup and Static Files Setup
app.use(vhost('*.*', express.static(path.join(__dirname, '/root'), { maxAge: 31557600 })));

// Localhost Setup and Static Files Setup
app.use(vhost('localhost', express.static(path.join(__dirname, '/root'), { maxAge: 31557600 })));

// Rate Limiting Setup
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Server Setup
const port = '80';
app.set('port', port);
const server = http.createServer(app);

// Cluster Setup
if (cluster.isPrimary) {
    // Test Database Connection
    const db = require('./utils/database');
    db.query('SELECT 1 + 1 AS solution', (err: any, rows: any) => {
        if (err) {
            log.error(err);
        }
    }).then(() => {
        log.info(`Database Connection Successful`);
    }).catch((err: any) => {
        log.error(`Database Connection Failed\n${err}`);
    });
    // Fork workers
    log.info(`Primary ${process.pid} is running on port ${port}`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    // If a worker dies, create a new one to replace it
    cluster.on('exit', (worker: any, code: any, signal: any) => {
        log.error(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    server.listen(port, () => {
        log.info(`Worker ${process.pid} started`);
    }).on('error', (error: any) => {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind = typeof port === 'string' ?
            'Pipe ' + port :
            'Port ' + port;

        switch (error.code) {
            case 'EACCES':
                log.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                log.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
}

/* Start Routing */

// API Path
app.get('/api', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    console.log(req.cookies.session);
    res.status(200).send('OK');
});

// Login Path
app.post('/login', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const body = req.body;
    if (body.email && body.password) {
        // Check if the email and password are correct
        const db = require('./utils/database');
        db.query('SELECT * FROM accounts WHERE email = ? AND password = ?', [body.email.toLowerCase(), hash(body.password)]).then((results: any) => {
            if (results.length > 0) {
                // Update the last login time
                db.query('UPDATE accounts SET lastlogin = ? WHERE email = ?', [new Date(), body.email.toLowerCase()]).catch((err: any) => {
                    log.error(err);
                });
                // Delete any existing sessions
                db.query('DELETE FROM sessions WHERE email = ?', [body.email.toLowerCase()]).then(() => {
                    // Create a session
                    const session = cryptojs.randomBytes(64).toString('hex');
                    db.query('INSERT INTO sessions (session, email) VALUES (?, ?)', [session, body.email.toLowerCase()]).then(() => {
                        // Store session as a cookie
                        req.cookies.path = '/';
                        req.cookies.session = session;
                        const domain = req.headers.host.split('.').slice(-2).join('.');
                        res.redirect(`${req.protocol}://cpanel.${domain}`);
                    }).catch((err: any) => {
                        log.error(err); 
                    });
                }).catch((err: any) => {
                    log.error(err);
                });
            } else {
                res.status(401).send('Unauthorized');
            }
        }).catch((err: any) => {
            log.error(err);
            res.status(500).send('Internal Server Error');
        });
    } else {
        res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`);
    }
});

/* End Routing */

// Redirect to root domain if route is not found
app.use(function(req: any, res: any, next: any) {
    // Check if it is a subdomain
    if (req.subdomains.length > 0) return next();
    res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`);
});

// Crypto Setup
const cryptojs = require('node:crypto');
function hash(password: string) {
    const [hashedPassword, numberValue, sum] = getHash(password);
    const hash = cryptojs.createHash('sha512')
        .update(sum + hashedPassword)
        .digest('hex');
    const middle = Math.ceil(hash.length / 2);
    const prefix = hash.slice(0, middle);
    const suffix = hash.slice(middle);
    const salt = cryptojs.createHash('sha512')
        .update(prefix + numberValue)
        .digest('hex')
    const result = `L${salt}A${prefix}P${hashedPassword}Y${suffix}X`;
    return result;
}

function getHash(password: string) {
    const hash = cryptojs.createHash('sha512')
        .update(password)
        .digest('hex');
    let numberValue = hash.replace(/[a-z]/g, '');
    Array.from(numberValue);
    numberValue = Object.assign([], numberValue);
    const sum = numberValue.reduce((acc: string, curr: string, i: number)  => acc + i, 0  )
    return [hash, numberValue, sum];
}