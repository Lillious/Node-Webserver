const express = require('express');
const compression = require('compression');
const app = express();
const path = require('node:path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('node:http');
const cluster = require('node:cluster');
const numCPUs = require('node:os').availableParallelism();
const rateLimit = require('express-rate-limit');
const vhost = require('vhost');

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(compression());

// Sub Domain Setup and Static Files Setup
app.set('subdomain offset', 1);
// app.use(vhost('mynewsubdomain.*.*', express.static(path.join(__dirname, '/mynewsubdomain'), { maxAge: 31557600 })));

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

// Timestamps for Logging
const timestamp = () => { return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); }

// Logging Setup
const log = {
    info: (message: string) => console.log(`${timestamp()} \x1b[32m${message}\x1b[0m`),
    error: (message: string) => console.error(`${timestamp()} \x1b[31m${message}\x1b[0m`),
    warn: (message: string) => console.warn(`${timestamp()} \x1b[33m${message}\x1b[0m`)
};

// Server Setup
const port = '80';
app.set('port', port);
const server = http.createServer(app);

// Cluster Setup
if (cluster.isPrimary) {
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
        var bind = typeof port === 'string' ?
            'Pipe ' + port :
            'Port ' + port;

        switch (error.code) {
            case 'EACCES':
                log.error(`${bind} requires elevated privileges`);
                process.exit(1);
            case 'EADDRINUSE':
                log.error(`${bind} is already in use`);
                process.exit(1);
            default:
                throw error;
        }
    });
}

/* Start Routing */

// API Path
app.get('/api', (req: any, res: any) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send('OK');
});

/* End Routing */


// Redirect to root domain if route is not found
app.use(function(req: any, res: any, next: any) {
    res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}`);
});