import * as roomController from "@/controllers/room.js";
import * as gameController from "@/controllers/game.js";
import * as userController from "@/controllers/user.js";

export function emitToRoom(io, roomId, eventName, eventData) {
  io.to(roomId).emit(eventName, eventData);
}

export function setUpSocketIO(io) {
  io.on("connection", async (socket) => {
    console.log("A user connected. Socket ID: ", socket.id);
    socket.join("lobby");
    //user info attached to this socket
    const userId = socket.handshake.query.userId;
    const email = socket.handshake.query.email;
    const userName = socket.handshake.query.userName || "User";
    const token = socket.handshake.query.token;

    socket.on('reconnectAttempt', async (userId) => {
      setTimeout(async () => {
        try {
          const reconnectAttempt = await roomController.reconnect(userId);
          if (reconnectAttempt == null) {
            console.log("No game rooms for this user to reconnect to");
          } else {
            const { roomId, roomName } = reconnectAttempt;
            console.log("User: " + email + " reconnecting to: " + roomId + " with roomName: " + roomName);


            //problem here is it redirects and then immediatly goes reJoinGame()
            //this path is when a user closes tab --> then refreshes on lobby page --> hitting redirect in roomToReconnectTo and then immediate reJoinGame()
            //which triggers putUserInRoom
            //socket.emit('roomToReconnectTo', { roomId: roomId, roomName: roomName });

            //this path happens when user refreshes game page
            socket.emit('userReconnect');
          }
        } catch (err) {
          console.log(err);
          socket.emit("reconnectError", { message: "Failed to execute reconnection check" });
        }
      }, 2000); // Delay of 1 second (1000 milliseconds)
    });

    socket.on("putUserInRoom", async (roomId) => {
      try {
        const putUserInRoomAttempt = await roomController.putUserInRoom(
          roomId,
          userId,
          socket.id
        );
        if (putUserInRoomAttempt === null) {
          //if the user refreshes the page while the game is waiting
          //we go back to lobby instead if they close the browser 
          socket.emit('backToLobby')
          throw new Error("error putting user in room inside sockets.js");
        }
        socket.leave("lobby");
        socket.join(roomId);

        //add a check if the user was already in this room if so then emit a userReconnect

        console.log("put user: " + userId + " back into room: " + roomId);
        emitToRoom(io, roomId, "userJoin", {
          userId: userId,
          userName: userName
        });

        socket.emit('userReconnect')

      } catch (err) {
        console.log(err);
      }
    });

    socket.on("joinRoom", async (roomId) => {
      try {
        const joinAttempt = await roomController.joinRoom(email, roomId);
        if (joinAttempt === null) {
          throw new Error("error joining room inside sockets.js");
        }
        console.log(`Socket ${socket.id} user ${email} joined room ${roomId}`);
        emitToRoom(io, roomId, "userJoin", "user joined the room");
      } catch (err) {
        console.log(err);
        socket.emit("joinRoomError", { message: "failed to join room" });
      }
    });

    socket.on("leaveRoom", async (roomId) => {
      try {
        const leaveAttempt = await roomController.disconnect(userId, roomId);
        if (leaveAttempt == null) {
          throw new Error("error leaving room inside socket.js");
        }
        console.log(`Socket ${socket.id} user ${email} left room ${roomId}`);
        emitToRoom(io, roomId, "userLeft", "user left the room");
      } catch (err) {
        console.log(err);
        socket.emit("leaveroomError", { message: "failed to leave room" });
      }
    });

    socket.on("roomChatMessage", (roomId, message) => {
      console.log("Received room message:", message);
      const timeStamp = new Date().toLocaleTimeString();
      console.log(socket.rooms);
      io.to(roomId).emit("newRoomMessage", {
        userName,
        message,
        timeStamp,
      });
    });

    socket.on("lobbyChatMessage", (message) => {
      console.log("Received lobby message:", message);
      const timeStamp = new Date().toLocaleTimeString();
      console.log(socket.rooms);
      io.to("lobby").emit("newLobbyMessage", {
        userName,
        message,
        timeStamp,
      });
    });

    socket.on("startGame", async (roomId) => {
      console.log("starting game " + roomId + " by user " + userId);

      try {
        const startStatus = await gameController.startGame(roomId, userId);
        if (!startStatus) {
          throw new Error("error starting room in socket.js");
        }

        console.log("successfully started game: " + roomId);
        console.log(
          "startStatus.playersHand" + JSON.stringify(startStatus.playersHand)
        );
        Object.entries(startStatus.socketIdMap).forEach(([key, value]) => {
          io.to(value).emit("playersHand", startStatus.playersHand[key]);
        });
        delete startStatus.playersHand;

        io.to(roomId).emit("gameStarted", startStatus);
      } catch (err) {
        console.log("problem starting game: " + roomId + " in socket.js");
        socket.emit("failedStart", roomId);
      }
    });

    socket.on("drawCard", async (roomId, userId) => {
      try {
        const drawStatus = await gameController.playerDrawCard(roomId, userId);
        if (!drawStatus) {
          throw new Error("error drawing card in socket.js");
        }
        console.log("successfully drew card: " + roomId);
        socket.emit("drawnCards", drawStatus.drawnCards);
        const nextTurn = {
          "nextTurn": drawStatus.nextTurn,
          "direction": drawStatus.direction
        }
        io.to(roomId).emit(
          "nextTurn",
          nextTurn
        );
      } catch (err) {
        console.log("problem drawing card: " + roomId + " in socket.js");
        socket.emit("failedDraw", roomId);
      }
    });

    socket.on("playCard", async (roomId, userId, card) => {
      try {
        const playStatus = await gameController.playerPlayCard(
          roomId,
          userId,
          card
        );
        if (!playStatus) {
          throw new Error("error playing card in socket.js");
        }
        console.log("successfully played card: " + roomId);
        io.to(roomId).emit("playedCard", playStatus);
        const nextTurn = {
          "nextTurn": drawStatus.nextTurn,
          "direction": drawStatus.direction
        }
        io.to(roomId).emit(
          "nextTurn",
          nextTurn
        );
      } catch (err) {
        console.log("problem playing card: " + roomId + " in socket.js");
        socket.emit("failedPlay", roomId);
      }
    });

    socket.on("cleanUpGame", async (roomId) => {
      try {
        const cleanUpAttempt = await gameController.cleanUpGame(roomId);
        if (cleanUpAttempt === null) {
          throw new Error("error cleaning up room in socket.js");
        }
        console.log("successfully cleaned up game: " + roomId);
      } catch (err) {
        console.log(err);
        socket.emit("cleanUpFailure", roomId);
      }
    });

    socket.on("disconnecting", () => {
      const roomIds = Array.from(socket.rooms).filter(
        (roomId) => roomId !== socket.id && roomId !== "lobby"
      );
      console.log(roomIds);
      roomIds.forEach(async (roomId) => {
        try {
          const roomDisconnectionAttempt = await roomController.disconnect(
            userId,
            roomId
          );
          if (!roomDisconnectionAttempt) {
            throw new Error("error in room disconnection attempt");
          }
        } catch (err) {
          console.log(err);
          socket.emit("disconnection error", {
            message: "disconnection error in DB",
          });
        }
      });
    });

    // handle disconnect event
    socket.on("disconnect", async () => {
      //socket.rooms is empty now
      console.log("User disconnected. Socket ID: ", socket.id);
    });

    //right now we are not using the socketio reconnecting feature
    socket.on("reconnecting", (attemptNumber) => {
      console.log(`Attempting to reconnect (attempt ${attemptNumber})`);
    });

    socket.on("reconnected", async (roomId) => {
      console.log("User: " + userId + " reconnected to room: " + roomId + ". Socket ID: ", socket.id);
      console.log(socket.rooms);
      const gameRoomIsPlaying = await gameController.getRoomIsPlaying(roomId);
      if (!gameRoomIsPlaying) {
        console.log("Game is not playing, will redirect user to lobby");
      }
      await gameController.userReconnected(userId, roomId)

      const playerState = await gameController.getPlayerState(userId, roomId)
      if(!playerState) {
        console.log("unable to get user's playerState")
      } else {
        const playersHand = playerState.dataValues.playerHand;
        if(!playersHand) {
          console.log("unable to get player's hand")
        } else {
          socket.emit('playersHand', playersHand)
        }
      }
      const gameState = await gameController.getGameState(roomId, userId)
      if(!gameState) {
        console.log("unable to get room's gameState")
      }

      //send top card
      //send discardtopcard
      socket.emit('gameStarted', gameState)
    });
  });
}
