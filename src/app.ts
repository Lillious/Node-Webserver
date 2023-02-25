const express = require('express');
const asyncify = require('express-asyncify');
const app = asyncify(express());
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const debug = require('debug')('server:server');
const http = require('http');
require ('dotenv').config();

// View Engine Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

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

// Development Mode
if (process.env.NODE_ENV?.toLowerCase() === 'development') {
  log.warn(`You are running in development mode`);
  log.warn(`To run in production mode, set NODE_ENV to production`);
  const reload = require('reload');
  reload(app).then(function (reloadReturned: any) {
    server.listen(port);
  }).catch(function (err: any) {
    log.error(`Reload didn\'t work, ${err}`);
  });
}
// Production Mode
else if (process.env.NODE_ENV?.toLowerCase() === 'production') {
  server.listen(port);
} else {
  throw new Error('NODE_ENV is not set to "development" or "production"');
}

function onError(error: any) {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
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

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
    debug('Listening on ' + bind);
    log.info('Listening on ' + bind);
}

app.use(function(req: any, res: any, next: any) {
    if (res.status(404)) {
        res.send('404 - File Not Found');
    }
});