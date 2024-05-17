async function fetchRoomsData() {
  try {
    const response = await fetch("http://localhost:3000/api/room/list");
    if (!response.ok) {
      throw new Error("Failed to fetch rooms data");
    }

    if (response.status === 200) {
      const data = await response.json();
      displayRoomsData(data);
    }
  } catch (error) {
    console.error("Error fetching rooms data:", error);
  }
}

function refreshGameList() {
  const gamesList = document.getElementById("gamesList");
  gamesList.innerHTML = "";
  fetchRoomsData();
}

function displayRoomsData(data) {
  const gamesList = document.getElementById("gamesList");
  data.forEach((game) => {
    const gameItem = document.createElement("div");
    gameItem.classList.add("game-item");

    const gameInfo = document.createElement("div");
    gameInfo.classList.add("game-info");
    let concatenatedString = "";
    game.users.forEach((gameUser) => {
      concatenatedString += gameUser.userName;
    });
    gameInfo.innerHTML = `<span>Game ID: ${game.name}</span><span>Members: ${concatenatedString}</span>`;

    const joinButton = document.createElement("button");
    console.log("I am create join button...");
    joinButton.classList.add("join-button");
    joinButton.textContent = "Join";
    joinButton.addEventListener("click", () => {
      console.log(game);
      const roomId = game.id;
      //basic session implementation?
      socket.emit("joinRoom", roomId);
      console.log(`Joining room ${roomId}`);
      window.open(`/public/game.html?roomId=${game.id}`, "_blank");
    });

    gameItem.appendChild(gameInfo);
    gameItem.appendChild(joinButton);
    gamesList.append(gameItem);
  });
}

// Function to fetch data at regular intervals
function fetchDataRegularly() {
  fetchRoomsData();
  setInterval(fetchRoomsData, 30000); // Fetch data every 30 seconds
}

// Start fetching data
fetchDataRegularly();

// Function to render active game list

function getGameList() {
  return activeGames[i++ % 5];
}

// Event listeners for buttons
// document.getElementById("createGameBtn").addEventListener("click", () => {
//   // Add your logic to create a new game
//   window.location.href = "createGame.html";
//   console.log("Creating a new game");
// });

document.getElementById("profileBtn").addEventListener("click", () => {
  // Add your logic to handle profile or logout
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("username");
  window.location.href = "SignIn.html";
  console.log("Profile / Logout clicked");
});

const token = sessionStorage.getItem("token");
const userName = sessionStorage.getItem("userName");
const userId = sessionStorage.getItem("userId");
const email = sessionStorage.getItem("email");

if (token && userName) {
  const greeting = document.getElementById("greeting");
  greeting.textContent = `Hello, ${userName} ！`;
  greeting.style.display = "block";
}

// create game system

document.getElementById("createGameBtn").addEventListener("click", () => {
  // Toggle the visibility of the form container
  const formContainer = document.querySelector(".create-game-form-container");
  const overlay = document.querySelector(".overlay");
  formContainer.style.display = "block";
  overlay.style.display = "block";
});

function closeCreateForm() {
  const form = document.getElementById("createGameForm");

  // Reset the form to clear input values
  form.reset();

  const formContainer = document.querySelector(".create-game-form-container");
  const overlay = document.querySelector(".overlay");

  // Hide the form container
  formContainer.style.display = "none";

  // Hide the overlay
  overlay.style.display = "none";
  console.log("i am in closeCreateForm function");
}

document.getElementById("cancelBtn").addEventListener("click", () => {
  closeCreateForm();
});

// Prevent form submission for testing
document
  .getElementById("createGameForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
      name: formData.get("gameTitle"),
      userId: userId,
      maxPlayers: formData.get("numPlayers"),
    };

    console.log("Form submitted", data); // For testing

    try {
      // Make the POST request to the server
      const response = await fetch("http://localhost:3000/api/room/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Handle the response
      if (response.ok) {
        // const result = await response.json();
        console.log("Room created successfully:");
        closeCreateForm();
        // Add any additional logic (e.g., redirecting the user, showing a success message)
      } else {
        console.error("Failed to create room", response.statusText);
        // Handle the error (e.g., show an error message)
      }
    } catch (error) {
      console.error("Error creating room:", error);
      // Handle the error (e.g., show an error message)
    }
  });

// chat system also where we make the socket connection for meow
const socket = io("http://localhost:3000", {
  query: { token, userName, email, userId },
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reeconnectionDelayMax: 5000,
});

const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");

socket.on("newLobbyMessage", function (data) {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.userName} @ ${data.timeStamp}: ${data.message}`;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("connect", () => {
  console.log("Successfully connected to the server!");
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("lobbyChatMessage", message);
    messageInput.value = "";
  }
}

function handleKeypress(event) {
  if (event.key === "Enter") {
    sendMessage();
    event.preventDefault(); // Prevent form from being submitted
  }
}
