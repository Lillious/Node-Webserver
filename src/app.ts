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
const db = require('./utils/database');
const fs = require('node:fs');

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
        domain: '.lillious.com' // Update this to your domain
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
    max: 200, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Server Setup
const port = '80';
app.set('port', port);
const server = http.createServer(app);

// Job System
if (cluster.isPrimary) {
    require ('./jobs/jobs');
}

// Cluster Setup
if (cluster.isPrimary) {
    // Test Database Connection
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

// Email validation
function validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    const re2 = /\S+%40\S+\.\S+/;
    if (re.test(email) || re2.test(email)) return true;
    return false;
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
    maxAge: 2.88e+7
}));

// Register Page
(function() {
    const settings = require('./settings.json');
    if (settings.registration) {
        app.use('/register', express.static(path.join(__dirname, '/register'), {
            maxAge: 2.88e+7
        }));
    }
})();

// Home Page
app.use(vhost('*.*', express.static(path.join(__dirname, '/root'), {
    maxAge: 2.88e+7
})));

// Localhost
app.use(vhost('localhost', express.static(path.join(__dirname, '/root'), {
    maxAge: 2.88e+7
})));

// Login Post Request
app.post('/login', (req: any, res: any) => {
    res.clearCookie('session');
    res.clearCookie('email');
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const body = req.body;
    if (body.email && body.password) {
        if (!validateEmail(body.email)) return res.redirect('/login');
        res.cookie('email', body.email, {
            maxAge: 86400000,
            httpOnly: true
        });
        db.query('SELECT * FROM accounts WHERE email = ? AND password = ?', [body.email.toLowerCase(), hash(body.password)])
            .then((results: any) => {
                if (results.length > 0) {
                    // Check if the account needs a password reset
                    if (results[0].passwordreset == '1') return res.sendFile(path.join(__dirname, '/login/passwordreset.html'));
                    db.query('UPDATE accounts SET lastlogin = ? WHERE email = ?', [new Date(), body.email.toLowerCase()])
                        .then(() => {
                            createSession(req, res, body.email.toLowerCase());
                        })
                        .catch((err: any) => {
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

// Check if registration is enabled
app.get('/register', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const settings = require('./settings.json');
    if (settings.registration) {
        res.status(200);
    } else {
        res.status(404);
    } 
});

// Check if maintenance mode is enabled
app.get('/maintenance', (req: any, res: any) => {
    const settings = require('./settings.json');
    if (settings.maintenance) {
        res.status(200).send("Maintenance Mode: Enabled");
    } else {
        res.status(404).send("Maintenance Mode: Disabled");
    }
});

// Register Post Request
app.post('/register', (req: any, res: any) => {
    const settings = require('./settings.json');
    if (!settings.registration) return res.redirect('/login');
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const body = req.body;
    if (body.email && body.password && body.password2) {
    // Check if the passwords match
        if (body.password !== body.password2) return res.redirect('/register');
    }
    // Check if the email is valid
    if (!validateEmail(body.email)) return res.redirect('/register');
    // Check if the email is already in use
    db.query('SELECT * FROM accounts WHERE email = ?', [body.email.toLowerCase()])
        .then((results: any) => {
            if (results.length > 0) return res.redirect('/register');
        }).catch((err: any) => {
            logging.log.error(err);
        });

    // Create the account and send the user to the 2fa page
    db.query('INSERT INTO accounts (email, password, lastlogin) VALUES (?, ?, ?)', [body.email.toLowerCase(), hash(body.password), new Date()])
        .then(() => {
            res.cookie('email', body.email.toLowerCase(), {
                maxAge: 86400000,
                httpOnly: true
            });
            createSession(req, res, body.email.toLowerCase());
        }).catch((err: any) => {
            logging.log.error(err);
            res.redirect('/register');
        });
});

app.post('/2fa', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const body = req.body;
    const authentication = require('./utils/authentication');
    // Verify session and email cookies exist
    if (!req.cookies.session || !req.cookies.email) return res.redirect('/login');
    // Check if the email is valid
    if (!validateEmail(req.cookies.email)) return res.redirect('/login');
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
            res.redirect('/login/2fa.html');
        });
});

/* Start Secure Routing */
/* Routes that require authentication */

app.use(function(req: any, res: any, next: any) {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const authentication = require('./utils/authentication');
    // Verify session and email cookies exist
    if (!req.cookies.session || !req.cookies.email) return res.redirect('/login');
    // Check if the email is valid
    if (!validateEmail(req.cookies.email)) return res.redirect('/login');
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // get request url
    authentication.checkSession(req.cookies.session, ip)
        .then((results: any) => {
            if (!results) return res.redirect('/login');
            authentication.checkCode(req.cookies.email, '0')
                .then((results: any) => {
                    if (!results) return res.redirect('/login');
                    next();
                }).catch(() => {
                    return res.redirect('/login');
                });
        }).catch(() => {
            res.redirect('/login');
        });
});


// Enable maintenance mode
app.post('/api/toggle-maintenance', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const authentication = require('./utils/authentication');
    const body = req.body;
    authentication.checkAccess(req.cookies.email)
    .then((results: any) => {
        if (results === 1) {
            const settings = require('./settings.json');
            if (body.maintenance == 'true') {
                settings.maintenance = true;
                fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(settings, null, 4));
                logging.log.warn('[Maintenance Mode] - Enabled');
                res.redirect('back');
            } else {
                settings.maintenance = false;
                fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(settings, null, 4));
                logging.log.warn('[Maintenance Mode] - Disabled');
                res.redirect('back');
            }
        } else {
            res.redirect('/cpanel');
        }
    }).catch((err: any) => {
        logging.log.error(err);
    });
});

app.post('/logout', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
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
});

app.use('/cpanel', express.static(path.join(__dirname, '/cpanel'), {
    maxAge: 2.88e+7
}));

// API
app.get('/api', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    res.status(200).send('OK');
});

app.get('/api/@me', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
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
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const serverinfo = {
        ip: req.socket.remoteAddress,
        directory: path.basename(__dirname),
        domain: req.headers.host,
        protocol: req.headers['x-forwarded-proto'] || req.protocol
    };
    res.status(200).send(serverinfo);
});

app.get('/api/fileusage', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
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

app.post('/api/create-account', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    const authentication = require('./utils/authentication');
    const body = req.body;
    if (!body.email) return res.redirect(path.join(__dirname, 'back'));
    // Check access
    authentication.checkAccess(req.cookies.email)
    .then((results: any) => {
        if (results === 1) {
            // Check if account already exists by email
            db.query('SELECT email FROM accounts WHERE email = ?', [body.email])
            .then((results: any) => {
                if (results.length === 0) {
                    const password = cryptojs.randomBytes(8).toString('hex');
                    db.query('INSERT INTO accounts (email, password, passwordreset) VALUES (?, ?, ?)', [body.email, hash(password), '1'])
                    .then(() => {
                        logging.log.info(`[CREATE ACCOUNT] ${body.email}`);
                        email.send(body.email, 'Account Created',
                        `Your account has been created. Your temporary password is ${password}. Please login to your account ${req.protocol}://${req.headers.host}/login and change your password.`);
                        res.redirect('back');
                    }).catch((err: any) => {
                        logging.log.error(err);
                        res.status(500).send('Internal Server Error');
                    });
                } else {
                    logging.log.error(`[CREATE ACCOUNT] ${body.email} already exists`);
                    res.redirect('back');
                }
            }).catch((err: any) => {
                logging.log.error(err);
                res.status(500).send('Internal Server Error');
            });
        } else {
            logging.log.error(`[CREATE ACCOUNT] ${req.cookies.email} does not have access`);
            res.redirect('back');
        }
    }).catch((err: any) => {
        logging.log.error(err);
        res.redirect('back');
    });
});

app.post('/2fa/resend', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    createSession(req, res, req.cookies.email);
});

app.post('/reset-password', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
    if (!req.cookies.session || !req.cookies.email) return res.redirect('/login');
    const session = cryptojs.randomBytes(64).toString('hex');
    const temp = shuffle(session, 8);
    db.query('UPDATE accounts SET password = ?, passwordreset = ? WHERE email = ?', [hash(temp), '1', req.cookies.email])
    .then(() => {
        email.send(req.cookies.email, 'Password Reset', `Your temporary password is: ${temp}`);
        res.sendFile(path.join(__dirname, 'login/passwordreset.html'));
    }).catch((err: any) => {
        logging.log.error(err);
        res.redirect('/login');
    });
});

app.post('/api/reset-password', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');    
    const body = req.body;
    if (!body.temppassword || !body.password1 || !body.password2) return res.sendFile(path.join(__dirname, 'login/passwordreset.html'));
    if (body.password1 !== body.password2) return res.sendFile(path.join(__dirname, 'login/passwordreset.html'));
    db.query('SELECT passwordreset FROM accounts WHERE email = ? AND password = ?', [req.cookies.email, hash(body.temppassword)])
        .then((results: any) => {
            if (results[0].passwordreset === '1') {
                db.query('UPDATE accounts SET password = ?, passwordreset = ? WHERE email = ?', [hash(body.password1), '0', req.cookies.email])
                    .then(() => {
                        logging.log.info(`[PASSWORD RESET] ${req.cookies.email}`);
                        createSession(req, res);
                }).catch((err: any) => {
                    logging.log.error(err);
                    res.status(500).send('Internal Server Error');
                });
            } else {
                res.redirect('/login');
            }
        }
    ).catch((err: any) => {
        logging.log.error(err);
        res.status(500).send('Internal Server Error');
    });
});


// Redirect to root domain if route is not found
app.use(function(req: any, res: any, next: any) {
    res.setHeader('Cache-Control', 'public, max-age=2.88e+7');
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

function shuffle(str: string, length: number) {
    length = length || 6;
    const arr = str.split('');
    let n = arr.length;
    while (n > 0) {
        const i = Math.floor(Math.random() * n--);
        const tmp = arr[n];
        arr[n] = arr[i];
        arr[i] = tmp;
    }
    return arr.join('').slice(0, length).toUpperCase();
}

function createSession (req: any, res: any, _email?: string) {
    _email = _email || req.cookies.email;
    // Check if an account exists with the email
    db.query('SELECT email FROM accounts WHERE email = ?', [_email]).then((results: any) => {
        if (results.length === 0) return res.redirect('/login');
        logging.log.info(`[2FA SEND] ${_email}`);
            // Delete any existing sessions
        db.query('DELETE FROM sessions WHERE email = ?', [_email]).then(() => {
            const session = cryptojs.randomBytes(64).toString('hex');
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const code = shuffle(session, 6);
            db.query('INSERT INTO sessions (session, email, ip, code, created) VALUES (?, ?, ?, ?, ?)', [session, _email, ip, code, new Date()])
                .then(() => {
                    res.cookie('session', session, {
                        maxAge: 86400000,
                        httpOnly: true
                    });
                    logging.log.info(`[LOGIN] ${_email}`);
                    email.send(_email, 'Verification Code', `Your verification code is: ${code}`);
                    res.sendFile(path.join(__dirname, 'login/2fa.html'));
                }).catch((err: any) => {
                    logging.log.error(err);
                });
        }).catch((err: any) => {
            logging.log.error(err);
            res.status(500).send('Internal Server Error');
        });
    }).catch((err: any) => {
        logging.log.error(err);
    }); 
}