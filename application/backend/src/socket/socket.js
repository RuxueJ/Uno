import * as lobby from '@/database/models/lobby.js';
import * as lobbyController from '@/controllers/lobby.js';


export function emitToLobby(io, lobbyId, eventName, eventData) {
    io.to(lobbyId).emit(eventName, eventData);
}


export function setUpSocketIO(io) {
    io.on('connection', async (socket) => {
        console.log('A user connected. Socket ID: ', socket.id);
        //user info attached to this socket
        const userId = socket.handshake.query.userId;
        const email = socket.handshake.query.email;
        const userName = socket.handshake.query.userName || 'User';
        const token = socket.handshake.query.token;

        //for the req: If a user closes a game tab, 
        //and then reconnects to the game, the game must be able 
        //to be reloaded in the current state for that user
        //idea: when user connects check if their userId has any
        //lobbyUser records if so check if that record is connected or not
        //the first lobbyUser record that exists for this user and has the
        //connected flag as false will be considered a reconnect to that
        //game room.
        //when I close a tab it consideres it a disconnect
        //when I reopen the tab it considers it a connection so on.reconnect is not
        //being used
        try {
            //reconnect will give the first record gmaeId in userLobby if it exists with connection=false
            const reconnectAttempt = await lobbyController.reconnect(userId);
            if (reconnectAttempt == null) {
                console.log("no game rooms for this user to reconnect to");
            } else {
                console.log("user: " + email + " reconnecting to: " + reconnectAttempt);
                //need more logic to reapply game state to user aswelll
                //rejoin socket room for this game room
                socket.join(reconnectAttempt);
                emitToLobby(io, reconnectAttempt, 'user reconnect', 'user ' + email + 'reconnected to lobby');
            }
        } catch (err) {
            console.log(err);
            socket.emit('reconnectError', { message: 'failed to execute reconnection check'})
        }


        socket.on('joinLobby', async (lobbyId) => {
            try {
                const joinAttempt = await lobbyController.joinLobby(email, lobbyId);
                if(joinAttempt == null) {
                    throw new Error("error joining lobby inside sockets.js")
                }
                socket.join(lobbyId);
                console.log(`Socket ${socket.id} user ${email} joined lobby ${lobbyId}`)
                emitToLobby(io, lobbyId, 'user join', 'user joined the lobby')
            } catch (err) {
                console.log(err);
                socket.emit('joinLobbyError', { message: 'failed to join lobby'} );
            }
        })


        socket.on('leaveLobby', async (lobbyId) =>{
            try {
                const leaveAttempt = await lobbyController.leaveLobby(email, lobbyId);
                if(leaveAttempt == null) {
                    throw new Error("error leaving lobby inside socket.js")
                }
                socket.leave(lobbyId);
                console.log(`Socket ${socket.id} user ${email} left lobby ${lobbyId}`);
                emitToLobby(io, lobbyId, 'user left', 'user left the lobby')
            } catch (err) {
                console.log(err)
                socket.emit('leaveLobbyError', { message: 'failed to leave lobby'} );
            }
        })


        // listen to self-defined event
        socket.on('chatMessage', (message) => {
            console.log('Received message:', message);
            const timeStamp = new Date().toLocaleTimeString();

            console.log(socket.rooms);
            // broadcast message to all connected clients
            io.emit('newMessage', {
                userName,
                message,
                timeStamp
            });
        });

        socket.on('disconnecting', () => {
            const lobbyIds = Array.from(socket.rooms).filter(lobbyId => lobbyId !== socket.id);
            console.log(lobbyIds);
            lobbyIds.forEach(async lobbyId => {
                try {
                    const lobbyDisconnectionAttempt =  await lobbyController.disconnect(userId, lobbyId);
                    if(!lobbyDisconnectionAttempt) {
                        throw new Error("error in lobby disconnection attempt");
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
