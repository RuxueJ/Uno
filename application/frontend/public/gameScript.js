
// Dummy data for demonstration
const players = ["Player 1", "Player 2", "Player 3"];
const chatMessages = [
  { user: "Player 1", message: "Hello everyone!" },
  { user: "Player 2", message: "Hey there!" },
  { user: "Player 3", message: "Welcome to the UNO game room." },
];
const deck = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+2",
  "Skip",
  "Reverse",
];
const hand = ["Red 1", "Blue 5", "Green +2", "Yellow Reverse"];

//this is not the best way to manage page navigation
//when a user is connected to lobby a socket is opened
//when that user is redirected to another page like gamePage
//that user's socket is disconnected
//here we are getting the info to attach to the new socket connection made for this user for this page
//I think the socket.on'disconnecting' and our reconnecting logic needs to be checked
//but for now we can take our screenshots of different games being played at the same time
const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName");
const userId = localStorage.getItem('userId');
const email = localStorage.getItem('email');

const socket = io("http://localhost:3000", {
  query: { token, userName, email, userId },
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reeconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log("Successfully reconnected to the server!");
});


// Function to render player list
function renderPlayerList() {
  const playerList = document.getElementById("player-list");
  playerList.innerHTML = "";
  players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    playerList.appendChild(li);
  });
}

// Function to render chat messages
function renderChatMessages() {
  const chatMessagesDiv = document.getElementById("chat-messages");
  chatMessagesDiv.innerHTML = "";
  chatMessages.forEach((msg) => {
    const div = document.createElement("div");
    div.textContent = `${msg.user}: ${msg.message}`;
    chatMessagesDiv.appendChild(div);
  });
}

// Function to render remaining deck cards
function renderDeck() {
  const deckDiv = document.getElementById("deck");
  deckDiv.innerHTML = "";
  deck.forEach((card) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.textContent = card;
    deckDiv.appendChild(div);
  });
}

// Function to render player's hand cards
function renderHand() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";
  hand.forEach((card) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.textContent = card;
    handDiv.appendChild(div);
  });
}

function leaveRoom() {
  const urlParams =  new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  socket.emit('leaveRoom', roomId);
  console.log(`Leaving room ${roomId}`);
  window.location.href = "lobby.html"; // Change the URL accordingly
}

// Event listener for sending messages
document.getElementById("send-message").addEventListener("click", () => {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message !== "") {
    chatMessages.push({ user: "You", message });
    renderChatMessages();
    input.value = "";
  }
});

// Event listener for drawing a card
document.getElementById("draw-card").addEventListener("click", () => {
  // Add logic to draw a card
  alert("Drawing a card...");
});

// Initial rendering
renderPlayerList();
renderChatMessages();
renderDeck();
renderHand();

