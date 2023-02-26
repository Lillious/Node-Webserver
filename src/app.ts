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
const helmet = require("helmet");
require('dotenv').config();

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
// Helmet Security Setup
app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
// Static Files Setup
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
server.on('error', onError);
server.on('listening', onListening);

// Development Mode Setup
const development = process.env.NODE_ENV?.toLowerCase() === 'development' ? true : process.env.NODE_ENV?.toLowerCase() === 'production' ? false : undefined;

// Cluster Setup
if (cluster.isPrimary) {
  if (development) {
    log.warn(`You are running in development mode`);
  } else if (development === false) {
    log.info(`You are running in production mode`);
  } else if (development === undefined) {
    throw new Error('NODE_ENV is not set to "development" or "production"');
  }
  // Fork workers
  log.info(`Primary ${process.pid} is running on port ${port}`);
  for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
  }
  cluster.on('exit', (worker: any, code: any, signal: any) => {
      log.error(`worker ${worker.process.pid} died`);
  });
} else {
  if (development) {
      const reload = require('reload');
      reload(app).then(function(reloadReturned: any) {
          server.listen(port);
      }).catch(function(err: any) {
          log.error(`Reload didn\'t work, ${err}`);
      });
    } else if (development === false) {
      // Production Mode
      server.listen(port);
    }
}

// Error Handling
function onError(error: any) {
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
}

// Server Listening
function onListening() {
    log.info(`Worker ${process.pid} started`);
}

// 404 Error Handling
app.use(function(req: any, res: any, next: any) {
    if (res.status(404)) {
        res.send('404 - File Not Found');
    }
});