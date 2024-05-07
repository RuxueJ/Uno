import * as lobby from '@/database/models/lobby.js';
import * as lobbyController from '@/controllers/lobby.js';


export function associateUserWithSocket(socket, userId) {
    socket.userId = userId;
}



export function emitToLobby(io, lobbyId, eventName, eventData) {
    io.to(lobbyId).emit(eventName, eventData);
}


export function setUpSocketIO(io) {
    io.on('connection', (socket) => {
        console.log('A user connected. Socket ID: ', socket.id);

        
        io.on('login_success', ({ userId }) => {
            associateUserWithSocket(socket, userId)
        });


        socket.on('joinLobby', async (email, lobbyId) => {
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


        socket.on('leaveLobby', async (email, lobbyId) =>{
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



        const userName = socket.handshake.query.userName || 'User';
        const token = socket.handshake.query.token;
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
            if(userId) {
                try {
                    disconnectAttempt = await lobbyController.disconnect(userId, )

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
