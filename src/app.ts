const express = require('express');
const compression = require('compression');
export const app = express();
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
const logging = require('./utils/logging');
const email = require('./utils/mailer');

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(compression());
app.disable('x-powered-by');
app.use(hpp());

// Plugin System
const plugins = require('./plugins.json');
// Read Plugins
Object.keys(plugins).forEach((plugin: any) => {
    // Check if the plugin is enabled
    if (plugins[plugin].enabled) {
        // Load the plugin
        if (cluster.isPrimary) {
            logging.log.info(`Loading Plugin: ${plugin}`);
        }
        try {
            require(`./plugins/${plugin}`);
        } catch (err: any) {
            logging.log.error(`Failed to load plugin: ${plugin}\n${err}`);
        }
    }
});

// Session Setup
app.use(session({
    secret: 'secret', // !! Change this !!
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: '/',
        domain: '.lillious.com'
    },
    resave: true,
    saveUninitialized: true
}));

app.set('trust proxy', 1);

// Sub Domain Setup and Static Files Setup
app.set('subdomain offset', 1);

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
    db.query('SELECT 1 + 1 AS solution')
        .then(() => {
            logging.log.info(`Database Connection Successful`);
        })
        .catch((err: any) => {
            logging.log.error(`Database Connection Failed\n${err}`);
        });
    // Fork workers
    logging.log.info(`Primary ${process.pid} is running on port ${port}`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    // If a worker dies, create a new one to replace it
    cluster.on('exit', (worker: any) => {
        logging.log.error(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    server.listen(port, () => {
        logging.log.info(`Worker ${process.pid} started`);
    }).on('error', (error: any) => {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind = typeof port === 'string' ?
            'Pipe ' + port :
            'Port ' + port;

        switch (error.code) {
            case 'EACCES':
                logging.log.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                logging.log.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
}

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

/* Start Unsecure Routing */
/* Routes that do not require authentication */

// Login Page
app.use('/login', express.static(path.join(__dirname, '/login'), {
    maxAge: 31557600
}));

// Home Page
app.use(vhost('*.*', express.static(path.join(__dirname, '/root'), {
    maxAge: 31557600
})));

// Localhost
app.use(vhost('localhost', express.static(path.join(__dirname, '/root'), {
    maxAge: 31557600
})));

// Login Post Request
app.post('/login', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const body = req.body;
    if (body.email && body.password) {
        const db = require('./utils/database');
        db.query('SELECT * FROM accounts WHERE email = ? AND password = ?', [body.email.toLowerCase(), hash(body.password)])
            .then((results: any) => {
                if (results.length > 0) {
                    db.query('UPDATE accounts SET lastlogin = ? WHERE email = ?', [new Date(), body.email.toLowerCase()])
                        .catch((err: any) => {
                            logging.log.error(err);
                        });
                    db.query('DELETE FROM sessions WHERE email = ?', [body.email.toLowerCase()]).then(() => {
                        const session = cryptojs.randomBytes(64).toString('hex');
                        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        // Create 2FA code from cookie session
                        const shuffle = (str: string) => {
                            const arr = str.split('');
                            let n = arr.length;
                            while (n > 0) {
                                const i = Math.floor(Math.random() * n--);
                                const tmp = arr[n];
                                arr[n] = arr[i];
                                arr[i] = tmp;
                            }
                            return arr.join('').slice(0, 6).toUpperCase();
                        }
                        const code = shuffle(session);
                        const _email = body.email.toLowerCase();
                        db.query('INSERT INTO sessions (session, email, ip, code) VALUES (?, ?, ?, ?)', [session, _email, ip, code])
                            .then(() => {
                                res.cookie('session', session, {
                                    maxAge: 86400000,
                                    httpOnly: true
                                });
                                res.cookie('email', _email, {
                                    maxAge: 86400000,
                                    httpOnly: true
                                });
                                logging.log.info(`[LOGIN] ${_email}`);
                                email.send(_email, code);
                                res.sendFile(path.join(__dirname, 'login/2fa.html'));
                            }).catch((err: any) => {
                                logging.log.error(err);
                            });
                    }).catch((err: any) => {
                        logging.log.error(err);
                    });
                } else {
                    res.redirect('/login');
                }
            }).catch((err: any) => {
                logging.log.error(err);
                res.redirect('/login');
            });
    } else {
        res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`);
    }
});

app.post('/2fa', (req: any, res: any) => {
    const db = require('./utils/database');
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const body = req.body;
    const authentication = require('./utils/authentication');
    if (!req.cookies.session || !req.cookies.email) return res.redirect('/login');
    authentication.checkCode(req.cookies.email, body.code)
        .then((results: any) => {
            if (!results) return res.redirect('/login');
            db.query('UPDATE sessions SET code = ? WHERE email = ?', ['0', req.cookies.email])
                .then(() => {
                    res.redirect('/cpanel');
                }).catch((err: any) => {
                    logging.log.error(err);
                });
        }).catch((err: any) => {
            logging.log.error(err);
            res.redirect('/login');
        });
});

/* Start Secure Routing */
/* Routes that require authentication */

app.use(function(req: any, res: any, next: any) {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const authentication = require('./utils/authentication');
    if (!req.cookies.session) return res.redirect('/login');
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    authentication.checkSession(req.cookies.session, ip)
        .then((results: any) => {
            if (!results) return res.redirect('/login');
            authentication.checkCode(req.cookies.email, '0')
                .then((results: any) => {
                    if (!results) return res.redirect('/login');
                    next();
                }).catch((err: any) => {
                    logging.log.error(err);
                    return res.redirect('/login');
                });
        }).catch((err: any) => {
            logging.log.error(err);
            res.redirect('/login');
        });
});

app.post('/logout', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    if (req.cookies.session) {
        const db = require('./utils/database');
        db.query('DELETE FROM sessions WHERE session = ?', [req.cookies.session])
            .then(() => {
                logging.log.error(`[LOGOUT] ${req.cookies.email}`);
                res.clearCookie('session');
                res.clearCookie('email');
                res.redirect('/login');
            })
            .catch((err: any) => {
                logging.log.error(err);
                res.redirect('/login');
            });
    } else {
        res.redirect('/login');
    }
});

app.use('/cpanel', express.static(path.join(__dirname, '/cpanel')));

// API
app.get('/api', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    res.status(200).send('OK');
});

app.get('/api/@me', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const db = require('./utils/database');
    db.query('SELECT email FROM accounts WHERE email = ?', [req.cookies.email])
        .then((results: any) => {
            if (results.length > 0) {
                res.status(200).send(results[0]);
            } else {
                res.status(404).send('Not Found');
            }
        })
        .catch((err: any) => {
            logging.log.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/api/serverinfo', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const serverinfo = {
        ip: req.socket.remoteAddress,
        directory: path.basename(__dirname),
        domain: req.headers.host,
        protocol: req.headers['x-forwarded-proto'] || req.protocol
    };
    res.status(200).send(serverinfo);
});

app.get('/api/fileusage', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    const fs = require('node:fs');
    fs.statfs('/', (err: any, stats: any) => {
        const data = {
            total: stats.blocks * stats.bsize,
            free: stats.bfree * stats.bsize,
            used: (stats.blocks - stats.bfree) * stats.bsize,
        };
        res.status(200).send(data);
    });
});

// Redirect to root domain if route is not found
app.use(function(req: any, res: any, next: any) {
    res.setHeader('Cache-Control', 'public, max-age=31557600');
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
    const sum = numberValue.reduce((acc: string, curr: string, i: number) => acc + i, 0)
    return [hash, numberValue, sum];
}