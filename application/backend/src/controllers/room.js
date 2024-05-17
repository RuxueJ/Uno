import db from "@/database";

export async function getRoomsData(req, res) {
  try {
    // Function to retrieve room data
    const getRoomData = async () => {
      // 查询所有房间     query all rooms
      const rooms = await db.models.room.findAll({
        attributes: ["roomId", "name", "status", "maxplayer", "createtime"],
        order: [["roomId", "DESC"]],
      });

      const roomIds = rooms.map((room) => room.roomId);

      // Query all associated player information
      const roomUsers = await db.models.roomUser.findAll({
        attributes: ["roomUserId", "roomId", "userId", "isHost", "connected"],
        where: { roomId: roomIds },
        order: [
            ['roomId', 'DESC'],         // new room first
            ['isHost', 'DESC'],         // put host first
            ['roomUserId', 'ASC']       // new player last
        ]
    });
      const userIds = roomUsers.map((user) => user.userId);

      // query all users in room information
      const users = await db.models.user.findAll({
        // get userId, userName, email
        attributes: ["userId", "userName"],
        where: { userId: userIds },
      });

      // integrate data
      /*
        [
            {
                name: "Room 1",
                id: 1,
                status: "waiting",
                maxPlayers: 4,
                createTime: "2021-07-01T00:00:00.000Z",
                users: [
                    { userId: 1, userName: "User 1", isHost: true},
                    { userId: 2, userName: "User 2", isHost: false},
                    { userId: 3, userName: "User 3", isHost: false}
                ]
            }
        ]
      */
      const result = rooms.map((room) => {
        // Retrieve player information related to this room
        const roomUser = roomUsers.filter((user) => user.roomId === room.roomId);
        // Retrieve user information related to this room
        const roomUsersInfo = roomUser.map((user) => {
          const userInfo = users.find((u) => u.userId === user.userId);
          return {
            userId: user.userId,
            userName: userInfo.userName,
            isHost: user.isHost
          };
        });
        // Return the integrated data
        return {
          id: room.roomId,
          name: room.name,
          status: room.status,
          maxPlayers: room.maxplayer,
          createTime: room.createtime,
          users: roomUsersInfo
        };
     });
    return result;
    }

    const roomData = await getRoomData();
    res.json({ gamelist: roomData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}


// controller for creating rooms
export async function createRoom(req, res) {
  const transaction = await db.transaction();

  try {
    const { name, userId, maxPlayers } = req.body;

    console.log(req.body);

    // 创建房间     create room
    const room = await db.models.room.create(
      {
        name,
        status: "waiting",
        maxplayer: maxPlayers
      },
      { transaction }
    );
    console.log("Room created:", room);
    console.log("Room.id:", room.dataValues.roomId);

    // create room user
    const roomUser = await db.models.roomUser.create(
      {
        roomId: room.dataValues.roomId,
        userId: userId,
        isHost: true,
        connected: true,
      },
      { transaction }
    );
    console.log("Room user created:", roomUser); // Log created room user

    await transaction.commit();

    res.status(201).json(room);
  } catch (err) {
    await transaction.rollback();
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

export async function joinRoom(email, roomId) {
  try {
    const room = await db.models.room.findOne({ where: { roomId: roomId } });
    if (!room) {
      console.log("room does not exist");
      return null;
    }

    if (room.status !== "waiting") {
      console.log("cannot join room; game is in session");
      return null;
    }

    const user = await db.models.user.findOne({ where: { email: email } });
    if (!user) {
      console.log("user does not exist");
      return null;
    }
    const userId = user.userId;

    const existingroomUser = await db.models.roomUser.findOne({
      where: { roomId, userId },
    });
    if (existingroomUser) {
      console.log("user already in room");
      return null;
    }

    const totalPlayers = await db.models.roomUser.findAll({
      where: { roomId },
    });
    if (totalPlayers) {
      if (totalPlayers.length >= room.dataValues.maxplayer) {
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

    return roomUser;
  } catch (err) {
    console.log(err);
    return null;
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
    const user = await db.models.user.findOne({ where: { email: email } });
    if (!user) {
      console.log("user " + userId + " does not exist");
      return null;
    }
    const userId = user.userId;

    const existingRoomUser = await db.models.roomUser.findOne({
      where: { roomId, userId },
    });
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
    console.log(err);
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

    const existingRoomUser = await db.models.roomUser.findOne({
      where: { roomId, userId },
    });
    if (existingRoomUser) {
      //at the end of the game kick all players who are still not connected
      if (room.status === "waiting") {
        //just have them disconnect if room is waiting
        await existingRoomUser.destroy();
        console.log("removing disconnected user " + userId + " from room");
        return 1;
      }
      //if room is playing then set connected for this user as false so we can reconnect
      existingRoomUser.connected = false;
      await existingRoomUser.save();
      console.log("user " + userId + " disconnected");
      return existingRoomUser;
    } else {
      console.log("user " + userId + " is not in the room");
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function reconnect(userId) {
  try {
    //are there any games this user is a part of where their connected flag is false
    //will reconnect to first disconnected game if multi disconnects
    //
    const userrooms = await db.models.roomUser.findOne({
      where: { userId, connected: false },
    });
    if (userrooms) {
      userrooms.connected = true;
      await userrooms.save();
      return userrooms.roomId;
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}
