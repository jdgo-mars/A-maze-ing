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


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

const GameEngine = require('./GameEngine');

const gameEngine = new GameEngine();

// 0 grass tile
// 1 wall tile

// If player requests a new session
// We check if there are sessions running
// if there are sessions running
// and they are available (1 player present) put the player there
// with the current generated maze
// if there are no available sessions
// create a new session with a new maze
// and place the player



// Socket should emit the updated players position
// so we can keep track of the players
// also 
const x = 20;
const y = 10;


/**
 * Returns Room ID
 */
const getRoomId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * Returns Player Object
 * @param {Object} socket 
 * 
 */
const newPlayer = (playerSocket) => ({
    position: [],
    playerSocket,
});

/**
 * Returns Room Object
 * @param {Array} maze  
 * @param {Object} socket
 * 
 */
const newRoom = (maze = [], playerSocket = null) => ({
    roomId: getRoomId(),
    players: playerSocket ? [newPlayer(playerSocket)] : [],
    maze,
});

/**
 * Add new room to rooms
 * @param {Object} room
 */
const setRoom = room => rooms.set(room.roomId, room);

/**
 * Remove room from rooms
 * @param {Object} room
 */
const removeRoom = ({ roomId }) => rooms.delete(room.roomId);

// Map with rooms
const rooms = new Map();
setRoom(newRoom(gameEngine.getMaze(x, y)));


io.on('connection', socket => {
    socket.emit('connected', { connected: true });
    // if client requests multiplayer
    socket.on('multiplayer-requested', () => {
        console.log('connected')
        let roomToJoin;
        const lastCreatedRoom = Array.from(rooms.values()).pop();

        // If players in the room less than 2 
        if (lastCreatedRoom.players.length < 2) {
            // push newly connected player
            lastCreatedRoom.players.push(newPlayer(socket));
            setRoom(lastCreatedRoom);
            // assign the room we want to join
            roomToJoin = lastCreatedRoom;
        } else {
            // assign newly generated Room
            const newlyCreatedRoom = newRoom(
                gameEngine.getMaze(x, y),
            );

            // Add new room
            setRoom(newlyCreatedRoom);

            // assign the room we want to join
            roomToJoin = newlyCreatedRoom;
        }



        socket.join(roomToJoin.roomId, () => {
            // emit the maze from current room
            io.to(roomToJoin.roomId).emit('joined-room', roomToJoin.maze)
            // if room to join has 2 players
            if (rooms.get(roomToJoin.roomId).players.length < 2) {
                io.to(roomToJoin.roomId).emit('waiting-opponent', { bla: 'bla' })
            } else {
                io.to(roomToJoin.roomId).emit('start-game')
            }


        });



    })
    socket.on('disconnect', () => {
        rooms.forEach((room, key) => {
            // Find player to remove in the playerSocket Array
            const playerToRemove = room.players.find(player => player.playerSocket.id === socket.id);
            if (playerToRemove) {
                removeRoom(room)
                // Emit event to room telling oponent left and reset player Game
                io.to(room.roomId).emit('opponent-left', room.id);
                io.to(room.roomId).emit('reset-game', room.id);
            }


        })

    });



});


