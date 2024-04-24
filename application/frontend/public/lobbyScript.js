// JavaScript Code

// Sample active game data
const activeGames = [];

// Function to render active game list
function renderGamesList() {
  const gamesList = document.getElementById("gamesList");
  gamesList.innerHTML = ""; // Clear existing list

  activeGames.forEach((game) => {
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
    gamesList.appendChild(gameItem);
  });
}

// Render the initial list
renderGamesList();

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
