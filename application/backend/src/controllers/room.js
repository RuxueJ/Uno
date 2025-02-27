import db from "@/database";

export async function getRoomsData(req, res) {
  try {
    // Function to retrieve room data
    const getRoomData = async () => {
      // query all rooms
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
            isHost: user.isHost,
            connected: user.connected
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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
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
    const room = await db.models.room.create(
      {
        name,
        status: "waiting",
        maxplayer: maxPlayers
      },
      { transaction }
    );

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

    //add roomId to response
    const response = {
      roomId: room.dataValues.roomId,
      name: room.name,
      status: room.status,
      maxPlayers: room.maxplayer
    }

    res.status(201).json(response);
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
      return null;
    }

    if (room.status !== "waiting") {
      return null;
    }

    const user = await db.models.user.findOne({ where: { email: email } });
    if (!user) {
      return null;
    }
    const userId = user.userId;

    const existingroomUser = await db.models.roomUser.findOne({
      where: { roomId, userId },
    });
    if (existingroomUser) {
      return null;
    }

    const totalPlayers = await db.models.roomUser.findAll({
      where: { roomId },
    });
    if (totalPlayers) {
      if (totalPlayers.length >= room.dataValues.maxplayer) {
        return null;
      }
    }

    const roomUser = await db.models.roomUser.create({
      roomId: roomId,
      userId: userId,
      isHost: false,
      connected: true
    });

    return roomUser;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function putUserInRoom(roomId, userId, socketId) {
  try {
    const room = await db.models.room.findOne({ where: { roomId: roomId } });
    if (!room) {
      return null;
    }

    const existingroomUser = await db.models.roomUser.findOne({
      where: { roomId, userId },
    });
    if (!existingroomUser) {
      return null;
    }
    existingroomUser.socketId = socketId;
    await existingroomUser.save();
    return {
      "existingroomUser": existingroomUser
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function leaveRoom(userId, roomId) {
  const transaction = await db.transaction();
  try {
    const room = await db.models.room.findOne({ where: { roomId: roomId }, transaction });
    if (!room) {
      await transaction.rollback();
      return null;
    }


    const roomUsers = await db.models.roomUser.findAll({
      where: { roomId },
      order: [["isHost", "DESC"]],
      transaction
    });
    const userCount = roomUsers.length;

    const existingRoomUser = roomUsers.find((user) => user.dataValues.userId === userId);
    if (existingRoomUser) {


      //case where a user clicks leaveroom when the game is playing
      if (room.status === "playing") {
        existingRoomUser.connected = false
        await existingRoomUser.save()
      } else {
        const isHost = existingRoomUser.isHost;
        if (isHost) {
          if (userCount > 1) {
            roomUsers[1].isHost = true;
            await roomUsers[1].save({ transaction }); 
          }
        }
        await existingRoomUser.destroy({ transaction });

        if (userCount === 1) {
          await room.destroy({ transaction });
        }  
      }


      await transaction.commit();
      return existingRoomUser;
    } else {
      await transaction.rollback();
      return null;
    }
  } catch (err) {
    console.log("Error:", err);
    await transaction.rollback();
    return null;
  }
}


export async function disconnect(userId, roomId) {
  //if room status is waiting then make them leave room
  //if room status is playing then set their connected to false
  //logic is when its their turn if they are not connected then
  //have them draw or something and go next turn
  const transaction = await db.transaction();
  try {
    const room = await db.models.room.findOne({ where: { roomId: roomId } });
    if (!room) {
      return null;
    }

    const roomUsers = await db.models.roomUser.findAll({
      where: { roomId },
      order: [["isHost", "DESC"]],
      transaction
    });
    const userCount = roomUsers.length;

    const existingRoomUser = roomUsers.find((user) => user.userId === Number(userId));

    if (existingRoomUser) {
      //at the end of the game kick all players who are still not connected
      if (room.status === "waiting") {
        //just have them disconnect if room is waiting
        const isHost = existingRoomUser.isHost;
        if (isHost) {
          if (userCount > 1) {
            roomUsers[1].isHost = true;
            await roomUsers[1].save({ transaction }); // 提交新房主的更改
          }
        }
        await existingRoomUser.destroy({ transaction });
        console.log("user " + userId + " removed from room");
        if (userCount === 1) {
          //if room is empty then delete room
          await room.destroy({ transaction });
          console.log("room " + roomId + " deleted");
        }
      } else {
      //if room is playing then set connected for this user as false so we can reconnect
        existingRoomUser.connected = false;
        await existingRoomUser.save({ transaction });
      }
      await transaction.commit();
      return existingRoomUser;
    } else {
      transaction.rollback();
  
      return null;
    }
  } catch (err) {
    transaction.rollback();
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
      const roomInfo = await db.models.room.findOne({
        where: {roomId: userrooms.roomId}
      });
      //return both id and name
      const roomName = roomInfo.name
      return { roomId: userrooms.roomId, roomName }
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}
