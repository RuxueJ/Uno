import * as roomController from '@/controllers/room.js';
import * as gameController from '@/controllers/game.js'
import { UUIDV4 } from 'sequelize';


export function emitToRoom(io, roomId, eventName, eventData) {
    io.to(roomId).emit(eventName, eventData);
}


export function setUpSocketIO(io) {
    io.on('connection', async (socket) => {
        console.log('A user connected. Socket ID: ', socket.id);


        //rest of socket logic
        socket.join('lobby');
        //user info attached to this socket
        const userId = socket.handshake.query.userId;
        const email = socket.handshake.query.email;
        const userName = socket.handshake.query.userName || 'User';
        const token = socket.handshake.query.token;

        try {
            const reconnectAttempt = await roomController.reconnect(userId);
            if (reconnectAttempt == null) {
                console.log("no game rooms for this user to reconnect to");
            } else {
                console.log("user: " + email + " reconnecting to: " + reconnectAttempt);
                //may need more logic to reapply game state
                //rejoin socket room for this game room
                socket.join(reconnectAttempt);
                socket.leave('lobby')
                emitToRoom(io, reconnectAttempt, 'user reconnect', 'user ' + email + 'reconnected to room');
            }
        } catch (err) {
            console.log(err);
            socket.emit('reconnectError', { message: 'failed to execute reconnection check'})
        }


        socket.on('joinRoom', async (roomId) => {
            try {
                const joinAttempt = await roomController.joinRoom(email, roomId);
                if(joinAttempt === null) {
                    throw new Error("error joining room inside sockets.js")
                }
                socket.leave('lobby')
                socket.join(roomId);
                console.log(`Socket ${socket.id} user ${email} joined room ${roomId}`)
                emitToRoom(io, roomId, 'user join', 'user joined the room')
            } catch (err) {
                console.log(err);
                socket.emit('joinRoomError', { message: 'failed to join room'} );
            }
        })


        socket.on('leaveRoom', async (roomId) =>{
            try {
                const leaveAttempt = await roomController.leaveRoom(email, roomId);
                if(leaveAttempt == null) {
                    throw new Error("error leaving room inside socket.js")
                }
                socket.leave(roomId);
                socket.join('lobby');
                console.log(`Socket ${socket.id} user ${email} left room ${roomId}`);
                emitToRoom(io, roomId, 'user left', 'user left the room')
            } catch (err) {
                console.log(err)
                socket.emit('leaveroomError', { message: 'failed to leave room'} );
            }
        })


        socket.on('roomChatMessage', (roomId, message) => {
            console.log('Received room message:', message);
            const timeStamp = new Date().toLocaleTimeString();
            io.to(roomId).emit('newRoomMessage', {
                userName,
                message,
                timeStamp
            });
        });


        socket.on('lobbyChatMessage', (message) => {
            console.log('Received room message:', message);
            const timeStamp = new Date().toLocaleTimeString();
            console.log(socket.rooms);
            io.to('lobby').emit('newLobbyMessage', {
                userName,
                message,
                timeStamp
            });
        });


        socket.on('startGame', async (roomId) => {
            console.log('starting game ' + roomId + ' by user ' + userId);
            try {
                const startAttempt = gameController.startGame(roomId, userId);
                if(!startAttempt) {
                    throw new Error("error starting room in socket.js");
                }
                console.log("successfully started game: " + roomId);
            } catch (err) {
                console.log("problem starting game: " + roomId + " in socket.js");
                socket.emit('failedStart', roomId);
            }
        });


        socket.on('cleanUpGame', async (roomId) => {
            try {
                const cleanUpAttempt = gameController.cleanUpGame(roomId);
                if(cleanUpAttempt === null) {
                    throw new Error('error cleaning up room in socket.js');
                }
                console.log('successfully cleaned up game: ' + roomId);
            } catch (err) {
                console.log(err);
                socket.emit('cleanUpFailure', roomId);
            }

        });


        socket.on('disconnecting', () => {
            const roomIds = Array.from(socket.rooms).filter(roomId => roomId !== socket.id && roomId !== 'lobby');
            console.log(roomIds);
            roomIds.forEach(async roomId => {
            try {
                const roomDisconnectionAttempt = await roomController.disconnect(userId, roomId);
                if(!roomDisconnectionAttempt) {
                    throw new Error("error in room disconnection attempt");
                }
            } catch (err) {
                console.log(err)
                socket.emit('disconnection error', { message: 'disconnection error in DB'} );
            }
            });
        });

        // handle disconnect event
        socket.on('disconnect', async () => {
            //socket.rooms is empty now
            console.log('User disconnected. Socket ID: ', socket.id);
        });

        //right now we are not using the socketio reconnecting feature
        socket.on('reconnecting', (attemptNumber) => {
            console.log(`Attempting to reconnect (attempt ${attemptNumber})`);
        });

        //not using this right now
        socket.on('reconnect', () => {
            console.log('User reconnected. Socket ID: ', socket.id);
            console.log(socket.rooms);
        });

    });
}
