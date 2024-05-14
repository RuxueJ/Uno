// JavaScript Code

let i = 0;
// Sample active game data
const activeGames = [
  { status: 304, data: [] },
  { status: 200, data: [{ id: 1, members: "Jin, Jiji" }] },
  { status: 200, data: [{ id: 2, members: "Dante, Xu" }] },
  { status: 200, data: [{ id: 3, members: "Jin, Jiji, Dante, Xu" }] },
  { status: 200, data: [{ id: 4, members: "Jiji" }] },
  { status: 200, data: [{ id: 5, members: "Dante, Xu" }] },
];

// Function to render active game list
function renderGamesList(data) {
  const gamesList = document.getElementById("gamesList");
  data.forEach((game) => {
    const gameItem = document.createElement("div");
    gameItem.classList.add("game-item");

    const gameInfo = document.createElement("div");
    gameInfo.classList.add("game-info");
    gameInfo.innerHTML = `<span>Game ID: ${game.id}</span><span>Members: ${game.members}</span>`;

    const joinButton = document.createElement("button");
    joinButton.classList.add("join-button");
    joinButton.textContent = "Join";
    joinButton.addEventListener("click", () => {
      const roomId = game.id;
      //basic session implementation?
      socket.emit("joinRoom", roomId);
      console.log(`Joining room ${roomId}`);
      window.location.href = `/public/game.html?roomId=${game.id}`;
    });

    /*
    const leaveButton = document.createElement("button");
    leaveButton.classList.add("leave-button");
    leaveButton.textContent = "Leave";
    leaveButton.addEventListener("click", () => {
      // Add your logic to leave the game
      const roomId = game.id;
      socket.emit('leaveRoom', roomId );
      console.log(`Leaving room ${roomId}`);
    });
    */

    /*
    const startButton = document.createElement("button");
    startButton.classList.add("start-button");
    startButton.textContent = "Start";
    startButton.addEventListener("click", () => {
      // Add your logic to leave the game
      const roomId = game.id;
      socket.emit('startGame', roomId );
      console.log(`Starting game ${roomId}`);
    });
    */

    /*
    const endButton = document.createElement("button");
    endButton.classList.add("end-button");
    endButton.textContent = "End";
    endButton.addEventListener("click", () => {
      // Add your logic to leave the game
      const roomId = game.id;
      socket.emit('cleanUpGame', roomId );
      console.log(`Cleaning up game ${roomId}`);
    });
    */

    gameItem.appendChild(gameInfo);
    gameItem.appendChild(joinButton);
    //gameItem.appendChild(leaveButton);
    //gameItem.appendChild(startButton);
    //gameItem.appendChild(endButton);
    gamesList.append(gameItem);
  });
}

function getGameList() {
  return activeGames[i++ % 5];
}

const dummyData = [
  { id: 1, members: "Jin, Jiji" },
  { id: 2, members: "Dante, Xu" },
  { id: 3, members: "Jin, Jiji, Dante, Xu" },
];

renderGamesList(dummyData);
// setInterval(async() => {
//   const gameList = await getGameList(); // api call
//   if(gameList.status === 200) {
//     renderGamesList(gameList.data)
//   }
// }, 3000)

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

document.getElementById("cancelBtn").addEventListener("click", () => {
  const form = document.getElementById("createGameForm");

  // Reset the form to clear input values
  form.reset();

  const formContainer = document.querySelector(".create-game-form-container");
  const overlay = document.querySelector(".overlay");

  // Hide the form container
  formContainer.style.display = "none";

  // Hide the overlay
  overlay.style.display = "none";
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
        const result = await response.json();
        console.log("Room created successfully:", result);
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
