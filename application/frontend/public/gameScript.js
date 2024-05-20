// Dummy data for demonstration
// const players = ["Player 1", "Player 2", "Player 3"];
// const chatMessages = [
//   { user: "Player 1", message: "Hello everyone!" },
//   { user: "Player 2", message: "Hey there!" },
//   { user: "Player 3", message: "Welcome to the UNO game room." },
// ];
// const deck = [
//   "0",
//   "1",
//   "2",
//   "3",
//   "4",
//   "5",
//   "6",
//   "7",
//   "8",
//   "9",
//   "+2",
//   "Skip",
//   "Reverse",
// ];
let hand = [];

let topPlayedCard = "";

// getUserInRoom();

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
  window.location.href = "lobby.html"; // Change the URL accordingly
}

// function startGame() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const roomId = urlParams.get("roomId");
//   socket.emit("startGame", roomId);
//   console.log(`Starting game ${roomId}`);
// }

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

// Handling "userLeft" event
socket.on("userLeft", () => {
  console.log("I am in userLeft event");
  getUserInRoom();
});

// Handling "userLeft" event
socket.on("drawnCards", (data) => {
  console.log(JSON.stringify(data[0]));
});

socket.on("cardPlayed", (data) => {
  console.log(data);
});
//=============================================================
// Event listener for sending messages
//document.getElementById("send-message").addEventListener("click", () => {
//  const input = document.getElementById("chat-input");
//  const message = input.value.trim();
//  if (message !== "") {
//    chatMessages.push({ user: "You", message });
//    renderChatMessages();
//    input.value = "";
//  }
//});
//=====================================================================

//=========================startGame====================================
function startGame() {
  socket.emit("startGame", roomId);
  console.log("I am emit startGame event");
}

socket.on("playersHand", (data) => {
  console.log("I am in playersHand event");
  data[userId].forEach((card) => {
    hand.push(getURL(card));
  });
  renderHand();
});
socket.on("gameStarted", (data) => {
  topPlayedCard = getURL(data.discardDeckTopCard);
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

// function renderDeck() {}

const deckDiv = document.getElementById("deck");

// Loop through the cardImages array and create img elements for each card

function renderDeckCard(topPlayedCardUrl) {
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
