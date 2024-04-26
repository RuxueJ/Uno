// JavaScript Code

let i = 0;
// Sample active game data
const activeGames = [ 
  {status : 304, data: []},
  {status : 200, data : [{id : 1, members: 'Jin, Jiji'}]},
  {status : 200, data : [{id : 2, members: 'Dante, Xu'}]},
  {status : 200, data : [{id : 3, members: 'Jin, Jiji, Dante, Xu'}]},
  {status : 200, data : [{id : 4, members: 'Jiji'}]},
  {status : 200, data : [{id : 5, members: 'Dante, Xu'}]},
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
      // Add your logic to join the game
      console.log(`Joining game ${game.id}`);
    });

    gameItem.appendChild(gameInfo);
    gameItem.appendChild(joinButton);
    gamesList.append(gameItem);
  });
}

function getGameList() {
  return activeGames[i++ % 5];
}

const dummyData = [{id : 1, members: 'Jin, Jiji'}, {id : 2, members: 'Dante, Xu'}, {id : 3, members: 'Jin, Jiji, Dante, Xu'}]

renderGamesList(dummyData);
// setInterval(async() => {
//   const gameList = await getGameList(); // api call
//   if(gameList.status === 200) {
//     renderGamesList(gameList.data)
//   }
// }, 3000)

// Event listeners for buttons
document.getElementById("createGameBtn").addEventListener("click", () => {
  // Add your logic to create a new game
  window.location.href = "createGame.html";
  console.log("Creating a new game");
});

document.getElementById("profileBtn").addEventListener("click", () => {
  // Add your logic to handle profile or logout
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = "SignIn.html";
  console.log("Profile / Logout clicked");
});

const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName');
// chat system 
const socket = io('http://localhost:3000', { 
  query: { token, userName },
  transports: ['websocket'] 
});
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');

socket.on('newMessage', function(data) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.userName} @ ${data.timeStamp}: ${data.message}`;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight; 
});
socket.on('connect', () => {
    console.log('Successfully connected to the server!');
});
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', message);
        messageInput.value = ''; 
    }
}
function handleKeypress(event) {
    if (event.key === "Enter") {
        sendMessage();
        event.preventDefault(); // Prevent form from being submitted
    }
}