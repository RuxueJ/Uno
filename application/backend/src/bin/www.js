#!/usr/bin/env node

/* eslint-disable */

/**
 * Module dependencies.
 */

import http from 'http';
import debugLib from 'debug';
import { Server as SocketIOServer}  from 'socket.io';
import app from '@/app';
import db from '@/database';
import * as configs from '@/config';
import { socketSetup } from '@/socket';
import socketAuth from '@/middleware/socketAuth';

/**
 * Start debug library
 */

const debug = debugLib('express-starter:server');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create SocketIO server.
 * and attach to HTTP server
 */ 

const io = new SocketIOServer(server, {
  cors: configs.corsConfig
});
io.use(socketAuth);
socketSetup.setUpSocketIO(io);

//export io for attaching userId to a socket instance
export { io }

/**
 * Listen on provided port, on all network interfaces.
 */

db.authenticate()
  .then(() => {
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  })
  .catch((err) => {
    console.error('Database connection error', err);
  });

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `Pipe ${addr}`
    : `Port ${addr.port}`;
  debug(`Listening on ${bind}`);
  console.log(`Listening on ${bind}`);
}