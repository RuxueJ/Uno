let hand = [];
let topPlayedCard = "";

const hostWaitingRoomFullMessage =
  "The room is not full. To start the game, please wait for another guest to come...";
const guestWaitingStartMessage =
  "Please wait for the host to start the game...";
const hostWaitingStartMessage =
  "The room is full, you can start the game by clicking the start button";

const token = sessionStorage.getItem("token");
const userName = sessionStorage.getItem("userName");
const userId = sessionStorage.getItem("userId");
const email = sessionStorage.getItem("email");

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

const queryString = window.location.search;
const queryParams = new URLSearchParams(queryString);
const gameRoomName = queryParams.get("gameName");

// Set the game room name as the text content of the header element
const gameRoomNameHeader = document.getElementById("gameRoomName");
console.log("the value of gameRoomname header is " + gameRoomNameHeader);
gameRoomNameHeader.textContent = "Game Room: " + gameRoomName;

const greetingMessage = document.getElementById("greetingMessage");
console.log("the value of greetingMessage is " + greetingMessage);
greetingMessage.textContent = "Hello " + userName;

function addStartButton() {
  console.log("I am adding start Button");
  const startButton = document.createElement("button");
  startButton.id = "startButton";
  startButton.textContent = "Start";
  startButton.addEventListener("click", startGame);

  const startButtonContainer = document.getElementById("startButtonContainer");
  startButtonContainer.innerHTML = "";
  startButtonContainer.appendChild(startButton);
}

function clearStartButton() {
  console.log("I am clearing start Button");

  const startButtonContainer = document.getElementById("startButtonContainer");
  startButtonContainer.innerHTML = "";
}

function clearDeckMessage() {
  const deckMessageDiv = document.querySelector(".deck_message");
  deckMessageDiv.innerHTML = "";
}

function setDeckMessage(message) {
  const h2Element = document.createElement("h2");
  h2Element.id = "waitingMessage";
  h2Element.textContent = message;
  // Find the container where you want to append the h2 element
  clearDeckMessage();
  const deckMessageDiv = document.querySelector(".deck_message");
  deckMessageDiv.appendChild(h2Element);
}

// function addStartGameMessage

const socket = io("http://localhost:3000", {
  query: { token, userName, email, userId },
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reeconnectionDelayMax: 5000,
});

async function getUserInRoom() {
  try {
    // Make the POST request to the server
    const response = await fetch(
      `http://localhost:3000/api/game/list/${roomId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Handle the response
    if (response.ok) {
      const result = await response.json();
      console.log(JSON.stringify(result));
      console.log(
        "the user in this room:" + JSON.stringify(result.player_list)
      );
      const playerList = document.getElementById("playerList");
      playerList.innerHTML = "";

      result.player_list.forEach((user) => {
        // Access properties of each object
        const userInfo = document.createElement("li");

        // Set the text content of the li element
        userInfo.textContent = user.userName;

        // Append the li element to the div container
        playerList.appendChild(userInfo);
        // console.log("user.isHost" + user.isHost);
        // console.log("result.player_list.length" + result.player_list.length);
        // console.log("result.max_player" + result.max_player);
        if (user.userId == userId) {
          if (user.isHost) {
            if (result.player_list.length == result.max_player) {
              addStartButton();
              setDeckMessage(hostWaitingStartMessage);
            } else {
              setDeckMessage(hostWaitingRoomFullMessage);
            }
          } else {
            clearStartButton();
            setDeckMessage(guestWaitingStartMessage);
          }
        }
      });

      // Add any additional logic (e.g., redirecting the user, showing a success message)
    } else {
      console.error("Failed to create room", response.statusText);
      // Handle the error (e.g., show an error message)
    }
  } catch (error) {
    console.error("Error creating room:", error);
    // Handle the error (e.g., show an error message)
  }
}

function leaveRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("leaveRoom", roomId);
  console.log(`Leaving room ${roomId}`);
  //because we are changing the window to lobby.html the socket disconnects and goes through socket.on('disconnecting')
  window.location.href = "lobby.html"; // Change the URL accordingly
}

function startGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("startGame", roomId);
  console.log(`Starting game ${roomId}`);
}

function endGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("cleanUpGame", roomId);
  console.log(`Cleaning up game ${roomId}`);
}

const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");

function sendGameMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("roomChatMessage", roomId, message);
    messageInput.value = "";
  }
}

socket.on("connect", () => {
  console.log("Successfully connected to the server!");
  setTimeout(() => {
    reJoinGame();
  }, 500); //needs short delay to make sure the socket is fully connected
});


socket.emit('reconnectAttempt', userId)

socket.on('backToLobby', () => {
  window.location.href = "lobby.html";
})

function reJoinGame() {
  console.log("rejoining: " + roomId + " for user: " + userId);
  socket.emit("putUserInRoom", roomId);
  console.log("after emitting");
}

socket.on("newRoomMessage", function (data) {
  console.log("I am in newRoomMessage event");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.userName} @ ${data.timeStamp}: ${data.message}`;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});

// Handling "userJoin" event
socket.on("userJoin", () => {
  console.log("I am in userJoin event");
  getUserInRoom();

});

socket.on('userReconnect', () => {
  console.log("I am in userReconnect event")
  getUserInRoom();
  socket.emit('reconnected', roomId)
  clearDeckMessage();
  clearStartButton();

})


// Handling "userLeft" event
socket.on("userLeft", () => {
  console.log("I am in userLeft event");
  getUserInRoom();
});

// Handling "userLeft" event
socket.on("drawnCards", (data) => {
  console.log(JSON.stringify(data[0]));
});

socket.on("nextTurn", (data) => {
  // check if it is your turn
});

socket.on("playedCard", (data) => {
  // top deck card
  console.log(data);
});

//=========================startGame====================================
function startGame() {
  socket.emit("startGame", roomId);
  console.log("I am emit startGame event");
}

socket.on("playersHand", (data) => {
  console.log("I am in playersHand event");
  console.log(data);
  data.forEach((card) => {
    hand.push(getURL(card));
  });
  renderHand();
});
socket.on("gameStarted", (data) => {
  console.log("I am in gameStarted event" + data);
  topPlayedCard = getURL(data.discardDeckTopCard);
  clearDeckMessage();
  renderDeckCard(topPlayedCard);
});

function getURL(card) {
  let url = "";
  if (card.type == "number" || card.type == "special") {
    url = "./static/uno_card-" + card.color + card.value + ".png";
  } else {
    url = "./static/uno_card-" + card.value + ".png";
  }
  return url;
}
//=========================startGame====================================

// Event listener for drawing a card
document.getElementById("draw-card").addEventListener("click", () => {
  // Add logic to draw a card
  alert("Drawing a card...");
});

function handleKeypress(event) {
  if (event.key === "Enter") {
    sendGameMessage();
    event.preventDefault(); // Prevent form from being submitted
  }
}

//=========================renderHand====================================

function renderHand() {
  const handDiv = document.getElementById("hand");

  // Loop through the cardImages array and create img elements for each card
  hand.forEach((card) => {
    const cardImg = document.createElement("img");
    cardImg.src = card;
    cardImg.classList.add("hand_card");
    handDiv.appendChild(cardImg);
  });

  handDiv.addEventListener("wheel", function (event) {
    event.preventDefault();
    handDiv.scrollLeft += event.deltaY;
  });
}

//=========================renderHand====================================

//=========================renderDeck====================================

// Loop through the cardImages array and create img elements for each card

function renderDeckCard(topPlayedCardUrl) {
  const deckDiv = document.getElementById("deck");

  const backUnoImage = document.createElement("img");
  backUnoImage.src = "./static/uno_card-back.png";
  backUnoImage.classList.add("deck_card");
  deckDiv.appendChild(backUnoImage);

  const topPlayImage = document.createElement("img");
  topPlayImage.src = topPlayedCardUrl;
  topPlayImage.classList.add("deck_card");
  deckDiv.appendChild(topPlayImage);
}

//=========================renderDeck====================================

//=========================drawCard====================================
const drawCard = document.getElementById("draw-card");
drawCard.addEventListener("click", () => {
  socket.emit("drawCard", roomId, userId);
});
//=========================drawCard====================================
