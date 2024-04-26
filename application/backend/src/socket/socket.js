export function setUpSocketIO(io) {
    io.on('connection', (socket) => {
        console.log('A user connected');
        
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
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

    });
}
