const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const chalk = require('chalk');
const log = console.log;

const port = 8888;

app.use(express.static('public'));

server.listen(port, null, null, () => {
  log(chalk.green(`Server running on http://localhost:${port}`));
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', socket => {
  socket.emit('connected', { connected: true });
});
