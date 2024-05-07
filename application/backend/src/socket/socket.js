import * as lobby from '@/database/models/lobby.js';
import * as lobbyController from '@/controllers/lobby.js';


export function emitToLobby(io, lobbyId, eventName, eventData) {
    io.to(lobbyId).emit(eventName, eventData);
}


export function setUpSocketIO(io) {
    io.on('connection', (socket) => {
        console.log('A user connected. Socket ID: ', socket.id);
        //user info attached to this socket
        const userId = socket.handshake.query.userId;
        const email = socket.handshake.query.email;
        const userName = socket.handshake.query.userName || 'User';
        const token = socket.handshake.query.token;

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
            // broadcast message to all connected clients
            io.emit('newMessage', {
                userName,
                message,
                timeStamp
            });
        });

        // handle disconnect event
        socket.on('disconnect', async () => {
            //when a socket disconnects it disconnects from all rooms that socket was in
            console.log('User disconnected. Socket ID: ', socket.id);
            const userId = socket.userId;
            console.log('UserId: ' + userId + ' disconnected');
            //get the list of lobbyIds this socket was joined to
            const lobbyIds = Object.keys(socket.rooms);

            if(userId) {
                try {
                    for(const lobbyId of lobbyIds) {
                        //disconnect will either remove the lobbyUser records if the 
                        //lobby is in the waiting state
                        //or it will set all the lobbyUser records assocaited with this socket
                        //to connected = false
                        disconnectAttempt = await lobbyController.disconnect(userId, lobbyId)
                        console.log("user " + userId + " disconnect from " + lobbyId);
                        emitToLobby(io, lobbyId, 'user disconnected', 'user disconnect from the lobby')
                    }
                } catch (err) {
                    console.log("error disconnecting", err);
                }
            }
        });


        socket.on('reconnect', () => {
            console.log('User reconnected. Socket ID: ', socket.id);

        });

    });
}
