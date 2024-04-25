export function setUpSocketIO(io) {
    io.on('connection', (socket) => {
        console.log('A user connected');
        
        // 监听自定义事件，例如聊天消息
        socket.on('chatMessage', (message) => {
            console.log('Received message:', message);
            // 将消息广播给所有客户端
            io.emit('newMessage', message);
        });

        // 处理断开连接
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        // 这里可以添加更多的事件处理逻辑。
    });
}
