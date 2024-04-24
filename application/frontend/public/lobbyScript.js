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

// Render the initial list
setInterval(async() => {
  const gameList = await getGameList(); // api call
  if(gameList.status === 200) {
    renderGamesList(gameList.data)
  }
}, 3000)

// Event listeners for buttons
document.getElementById("createGameBtn").addEventListener("click", () => {
  // Add your logic to create a new game
  window.location.href = "createGame.html";
  console.log("Creating a new game");
});

document.getElementById("profileBtn").addEventListener("click", () => {
  // Add your logic to handle profile or logout
  console.log("Profile / Logout clicked");
});
