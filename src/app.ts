const express = require('express');
const asyncify = require('express-asyncify');
const app = asyncify(express());
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const debug = require('debug')('server:server');
const http = require('node:http');
const cluster = require('node:cluster');
const numCPUs = require('node:os').availableParallelism();
require('dotenv').config();

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
// Static Files Setup

const helmet = require('helmet')

app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'"],
      "connect-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "style-src-elem": ["'self'", "data:"],
      "script-src": ["'unsafe-inline'", "'self'"],
      "object-src": ["'none'"],
    },
  })
);
app.use(express.static(path.join(__dirname, '/public')));

// Logging Setup
const log = {
    info: (message: string) => console.log(`\x1b[32m${message}\x1b[0m`),
    error: (message: string) => console.error(`\x1b[31m${message}\x1b[0m`),
    warn: (message: string) => console.warn(`\x1b[33m${message}\x1b[0m`)
}

// Server Setup
const port = process.env.PORT || '80';
app.set('port', port);
const server = http.createServer(app);

// Cluster Setup
if (cluster.isPrimary) {
  // Fork workers
  log.info(`Primary ${process.pid} is running on port ${port}`);
  for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
  }
  // If a worker dies, create a new one to replace it (for load balancing)
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

// 404 Error Handling
app.use(function(req: any, res: any, next: any) {
    if (res.status(404)) {
        res.send('404 - File Not Found');
    }
});