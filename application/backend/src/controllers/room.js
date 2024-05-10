import db from '@/database';


// 长轮询获取房间数据的控制器       Controller for long polling to retrieve room data
export async function getRoomsData(req, res) {
    try {
        const timeout = 30000;

        // 获取房间数据的函数       Function to retrieve room data
    const getRoomData = async () => {
        // 查询所有房间     query all rooms
        const rooms = await db.models.room.findAll();

        // 查询所有关联的玩家信息       Query all associated player information
        const roomUsers = await db.models.roomUser.findAll();

        // 查询所有用户信息     query all users in room information
        const users = await db.models.user.findAll();

        // 整合数据     integrate data
        const result = rooms.map(room => {
            // 获取此房间相关的玩家信息         Retrieve player information related to this room
            const usersInRoom = roomUsers.filter(user => user.roomId === room.id);

            // 将玩家信息附加到房间数据中       append player info to room data
            const userDetails = usersInRoom.map(user => {
                const userInfo = users.find(u => u.id === user.userId);
                return {
                    userId: user.userId,
                    userName: userInfo ? userInfo.userName : null, // 找到玩家名称      find player name
                    isHost: user.isHost,
                    score: user.score,
                    connected: user.connected,
                };
            });

            return {
                name: room.name,
                status: room.status,
                users: userDetails
            };
        });

        return result;
    };

        // 检查更新的函数       function to check for updates
        const checkForUpdates = async () => {
            const roomData = await getRoomData();

            if (roomData.length > 0) {
                res.json(roomData);
            } else {
                setTimeout(() => checkForUpdates(), 5000);
            }
        };

        // 设置超时     set a timeout
        const timer = setTimeout(() => {
            res.status(204).end(); // 返回无内容状态码      Return a status code indicating no content
        }, timeout);

        // 开始检查更新     start checking for updates
        checkForUpdates().finally(() => clearTimeout(timer));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 创建房间的控制器     controller for creating rooms
export async function createRoom(req, res) {
    const transaction = await db.transaction();
    try {
        const { name, userId, password } = req.body;

        // 创建房间     create room
        const room = await db.models.room.create({
            name,
            status: 'waiting',
            maxPlayers: 4,
            password: password ? password: null,        //if a password is provided
        }, { transaction });

        // 创建房间用户     create room user
        await db.models.roomUser.create({
            roomId: room.id,
            userId: userId,
            isHost: true,
            connected: true,
        }, { transaction });

        await transaction.commit();

        res.status(201).json(room);
    } catch (err) {
        await transaction.rollback();
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}


//controller for joining rooms
export async function joinRoom(email, roomId) {
    try {
        const room = await db.models.room.findOne({ where: { roomId: roomId } });
        if (!room) {
            console.log("room does not exist");
            return null;
        }


        //get userId
        const user = await db.models.user.findOne( { where: { email: email } } );
        if(!user) {
            console.log("user does not exist");
            return null;
        }
        const userId = user.userId;

        const existingroomUser = await db.models.roomUser.findOne({ where: { roomId, userId } });
        if (existingroomUser) {
            console.log("user already in room");
            return null;
        }

        const totalPlayers = await db.models.roomUser.findAll( { where: { roomId } } );
        if(totalPlayers) {
            if(totalPlayers.length >= room.maxPlayers){
            console.log("room is full");
            return null;
            }
        }

        const roomUser = await db.models.roomUser.create({
            roomId: roomId,
            userId: userId,
            isHost: false,
            connected: true,
        });

        return(roomUser);
    } catch (err) {
        console.log(err);
        return null
    }
}

export async function leaveRoom(email, roomId) {
    try {
        const room = await db.models.room.findOne({ where: { roomId: roomId } });
        if (!room) {
            console.log("room does not exist");
            return null;
        }

        //get userId
        const user = await db.models.user.findOne( { where: { email: email } } );
        if(!user) {
            console.log("user " + userId + " does not exist");
            return null;
        }
        const userId = user.userId;

        const existingRoomUser = await db.models.roomUser.findOne({ where: { roomId, userId } });
        if (existingRoomUser) {
            try {
                //try to delete it
                await existingRoomUser.destroy();
                console.log("user " + userId + " removed from room");
                return existingRoomUser;
            } catch (err) {
                console.log("error deleting user from room");
                return null;
            }
        } else {
            console.log("user " + userId + " doesn't exist in room");
            return null;
        }

    } catch (err) {
        console.log(err)
        return null;
    }
}

export async function disconnect(userId, roomId) {
    //if room status is waiting then make them leave room
    //if room status is playing then set their connected to false
    //logic is when its their turn if they are not connected then
    //have them draw or something and go next turn
    console.log("starting disconnect in room.js");
    try {
        const room = await db.models.room.findOne({ where: { roomId: roomId } });
        if (!room) {
            console.log("room does not exist");
            return null;
        }

        const existingRoomUser = await db.models.roomUser.findOne({ where: { roomId, userId } });
        if(existingRoomUser) {
            //at the end of the game kick all players who are still not connected
            if (room.status === "waiting") {    //just have them disconnect if room is waiting
                await existingRoomUser.destroy();
                console.log("removing disconnected user " + userId + " from room")
                return 1;
            }
            //if room is playing then set connected for this user as false so we can reconnect
            existingRoomUser.connected = false;
            await existingRoomUser.save();
            console.log("user " + userId + " disconnected")
            return existingRoomUser;
        } else {
            console.log("user " + userId + " is not in the room");
            return null
        }

    } catch (err) {
        console.log(err)
        return null;
    }
}

//returns room id of reconnect
export async function reconnect(userId) {
    try {
        //are there any games this user is a part of where their connected flag is false
        const userrooms = await db.models.roomUser.findOne( { where: { userId, connected: false } } );
        if (userrooms) {
            userrooms.connected = true;
            await userrooms.save();
            return userrooms.roomId;
        } else {
            return null;
        }
    } catch (err) {
        console.log(err)
        return null;
    }
}
