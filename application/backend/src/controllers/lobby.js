import db from '@/database';


// 长轮询获取房间数据的控制器
export async function getLobbiesData(req, res) {
    try {
        const timeout = 30000;

        // 获取房间数据的函数
    const getLobbyData = async () => {
        // 查询所有房间
        const lobbies = await db.models.lobby.findAll();

        // 查询所有关联的玩家信息
        const lobbyUsers = await db.models.lobbyUser.findAll();

        // 查询所有用户信息
        const users = await db.models.user.findAll();

        // 整合数据
        const result = lobbies.map(lobby => {
            // 获取此房间相关的玩家信息
            const usersInLobby = lobbyUsers.filter(user => user.lobbyId === lobby.id);

            // 将玩家信息附加到房间数据中
            const userDetails = usersInLobby.map(user => {
                const userInfo = users.find(u => u.id === user.userId);
                return {
                    userId: user.userId,
                    userName: userInfo ? userInfo.userName : null, // 找到玩家名称
                    isHost: user.isHost
                };
            });

            return {
                name: lobby.name,
                status: lobby.status,
                users: userDetails
            };
        });

        return result;
    };

        // 检查更新的函数
        const checkForUpdates = async () => {
            const lobbyData = await getLobbyData();

            if (lobbyData.length > 0) {
                res.json(lobbyData);
            } else {
                setTimeout(() => checkForUpdates(), 5000);
            }
        };

        // 设置超时
        const timer = setTimeout(() => {
            res.status(204).end(); // 返回无内容状态码
        }, timeout);

        // 开始检查更新
        checkForUpdates().finally(() => clearTimeout(timer));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 创建房间的控制器
export async function createLobby(req, res) {
    try {
        const { name, userId } = req.body;

        // 创建房间
        const lobby = await db.models.lobby.create({
            name,
            status: 'waiting',
            maxPlayers: 4,
        });

        // 创建房间用户
        await db.models.lobbyUser.create({
            lobbyId: lobby.id,
            userId: userId,
            isHost: true,
        });

        res.status(201).json(lobby);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}