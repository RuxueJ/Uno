let hand = [];

let cardsToPlay = [];
let cardToPlay;
let drawAmount = 0;
let topPlayedCard = "";
let isPlaying = false;
let players;
let nextPlayer;
let playersCardcount;

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

if (!token || !userName || !userId || !email) {
  window.location.href = "signIn.html";
  alert("Please sign in first");
}

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

const queryString = window.location.search;
const queryParams = new URLSearchParams(queryString);
const gameRoomName = queryParams.get("gameName");

// Set the game room name as the text content of the header element
const gameRoomNameHeader = document.getElementById("gameRoomName");
gameRoomNameHeader.textContent = "Game Room: " + gameRoomName;

const greetingMessage = document.getElementById("greetingMessage");
greetingMessage.textContent = "Hello " + userName;

function addStartButton() {
  const startButton = document.createElement("button");
  startButton.id = "startButton";
  startButton.textContent = "Start";
  startButton.addEventListener("click", startGame);

  const startButtonContainer = document.getElementById("startButtonContainer");
  startButtonContainer.innerHTML = "";
  startButtonContainer.appendChild(startButton);
}

function clearStartButton() {
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

function updataCardsToPlay() {
  cardsToPlay = [];

  if (topPlayedCard === null || hand === undefined || hand.length === 0) {
    return [];
  }

  if (
    (topPlayedCard.value === "draw2" || topPlayedCard.value == "wilddraw4") &&
    drawAmount == 0
  ) {
    return [];
  }

  if (topPlayedCard.type == "wild") {
    hand.forEach((card) => {
      if (card.color === topPlayedCard.color || card.type === "wild") {
        cardsToPlay.push(card);
      }
    });
  } else {
    hand.forEach((card) => {
      if (
        card.color === topPlayedCard.color ||
        card.value === topPlayedCard.value ||
        card.type === "wild"
      ) {
        cardsToPlay.push(card);
      }
    });
  }

  return cardsToPlay;
}

// function addStartGameMessage

const socket = io("http://localhost:3000", {
  auth: { token: token },
  query: { userName, email, userId },
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reeconnectionDelayMax: 5000,
});

function renderPlayerList() {
  if(!players) return;
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
  for(const player of players) {
    const userInfo = document.createElement("li");
    userInfo.textContent = player.userName;
    userInfo.id = player.userId;
    playerList.appendChild(userInfo);
  }
  if(playersCardcount) renderPlayerCardsCount(playersCardcount);
  if(nextPlayer) showTurn(nextPlayer);
}

async function getUserInRoom() {
  try {
    // Make the POST request to the server
    const response = await fetch(
      `http://localhost:3000/api/game/list/${roomId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      }
    );

    // Handle the response
    if (response.ok) {
      const result = await response.json();
      players = result.player_list;
      renderPlayerList();
      result.player_list.forEach((user) => {
        if (result.gamePlaying) {
          clearDeckMessage();
          clearStartButton();
        } else {
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
        }
      });
      if(nextPlayer) {
        showTurn(nextPlayer);
      }
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
  //because we are changing the window to lobby.html the socket disconnects and goes through socket.on('disconnecting')
  window.location.href = "lobby.html"; // Change the URL accordingly
}

async function stayRoom() {
  const overlay = document.querySelector(".overlay");
  const endGamePopup = document.querySelector(".endgame-popup");
  endGamePopup.style.display = "none";
  overlay.style.display = "none";
  await getUserInRoom();
}

function startGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("startGame", roomId);
  clearDeckMessage();
  clearStartButton();
}

function endGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("cleanUpGame", roomId);
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

socket.on("backToLobby", () => {
  window.location.href = "lobby.html";
});

function reJoinGame() {
  socket.emit("putUserInRoom", roomId);
}

socket.on("newRoomMessage", function (data) {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data?.userName} @ ${data?.timeStamp}: ${data?.message}`;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});

// Handling "userJoin" event
socket.on("userJoin", async (data) => {
  await getUserInRoom();
});

socket.on("userReconnect", async () => {
  await getUserInRoom();
  socket.emit("reconnected", roomId);
});

// Handling "userLeft" event
socket.on("userLeft", () => {
  getUserInRoom();
});

// Handling "userLeft" event
socket.on("drawnCards", (data) => {
  data.forEach((card) => {
    hand.push(card);
  });
});

socket.on("getNextTurn", (data) => {
  if(data?.nextTurn) showTurn(data.nextTurn)
  if (data?.nextTurn == userId) {
    showDrawPlayButton();
  } else {
    // Get the div element by its ID
    disappearDrawPlayButton();
  }
})

socket.on("nextTurn", (data) => {
  // check if it is your turn
  nextPlayer = data?.nextTurn;
  if(data?.nextTurn) showTurn(data.nextTurn);
  if (data.nextTurn == userId) {
    showDrawPlayButton();
  } else {
    // Get the div element by its ID
    disappearDrawPlayButton();
  }

  cardsToPlay = updataCardsToPlay();
  renderDeckCard();
  renderHand();
  showCurrentColor(topPlayedCard);
});

socket.on("playedCard", (data) => {
  topPlayedCard = data?.discardDesckTop;
});

//=========================startGame====================================
function startGame() {
  socket.emit("startGame", roomId);
  isPlaying = true;
}

function disappearDrawPlayButton() {
  var divElement = document.getElementById("draw-card-container");

  // Set its display property to "none"
  divElement.style.display = "none";
  var divElement = document.getElementById("play-card-container");

  // Set its display property to "none"
  divElement.style.display = "none";
}

function showDrawPlayButton() {
  var divElement = document.getElementById("draw-card-container");

  // Set its display property to "none"
  divElement.style.display = "inline";
  var divElement = document.getElementById("play-card-container");

  var playCardBtn = document.getElementById("play-card");

  // Set its display property to "none"
  divElement.style.display = "inline";
}

function showCurrentColor(currentCard) {
  const deck = document.getElementById("deck-container");
  deck.style.backgroundColor = currentCard.color;
}

socket.on("updateDrawAmount", (data) => {
  drawAmount = Number(data);
});

socket.on("playersHand", (data) => {
  hand = [];

  // cardsToPlay = checkCards(topPlayedCard, data.playersHand);
  data.forEach((card) => {
    hand.push(card);
  });
});
socket.on("gameStarted", (data) => {
  if (data) isPlaying = true;
  topPlayedCard = data?.discardDeckTopCard;
  showCurrentColor(topPlayedCard);
  cardsToPlay = updataCardsToPlay();
  renderHand();

  if(data?.nextTurn) showTurn(data.nextTurn);

  clearDeckMessage();
  renderDeckCard();
  clearStartButton();
  if (data?.nextTurn == userId) {
    showDrawPlayButton();
  } else {
    // Get the div element by its ID
    disappearDrawPlayButton();
  }
});
socket.on("getPlayersHandsCount", (data) => {
  if(Object.keys(data).length > 0) {
    playersCardcount = data;
    renderPlayerCardsCount(data);
    for(const userId in data) {
      if(data[userId] === 0) socket.emit("endGame", roomId, userId);
    }
  }
})

socket.on("gameEnded", (data) => {
  showEndGame(data);
})


function showEndGame(data) {
  let winnerName = "";
  for(const player of players) {
    if(Number(data) === player.userId) winnerName = player.userName;
  }
  const overlay = document.querySelector(".overlay");
  const endGamePopup = document.querySelector(".endgame-popup");
  const endGameMessage = document.querySelector("#end-message");;
  endGameMessage.innerHTML = `Game End! The winner is ${winnerName} You will be redirected to lobby page in 10 seconds.`;
  endGamePopup.style.display = "block";
  overlay.style.display = "block";

  setTimeout(() => {
    leaveRoom();
  }, 10000)
}

function showUno(userId) {
  const user = document.getElementById(userId);
  const unoText = document.createElement("span");
  unoText.id = "unoText"
  unoText.innerHTML = "UNO!!!!!";
  unoText.className = 'unoText';
  user.appendChild(unoText);
}

function showTurn(currentPlayingUser) {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
  if(!players) return;
  for(let player of players) {
    let cardCountInfo = "";
    if(playersCardcount) {
      cardCountInfo = `[card count : ${playersCardcount[player.userId]}]`;
    }
    const child = document.createElement("li");
    child.id = player.userId;
    if(player.userId === currentPlayingUser) {
      child.textContent = player.userName + cardCountInfo + "     <<<<<< Turn!";
      child.style.fontSize = '24px';
      child.style.fontWeight = 'bold';
      child.style.color = '#007bff';
    } else {
      child.textContent = player.userName + cardCountInfo;
    }
    if(playersCardcount && playersCardcount[player.userId] === 1) {
      const unoText = document.createElement("span");
      unoText.id = "unoText"
      unoText.innerHTML = "UNO!!!!!";
      unoText.className = 'unoText';
      child.appendChild(unoText);
    }
    playerList.appendChild(child)
  }
}

function renderPlayerCardsCount(data) {
  const playerList = document.getElementById("playerList");
  const players = [...playerList.children];
  for(const player of players) {
    const text = player.innerHTML;
    if(text.includes('card count')) break;
    const textParts = text.split(' ');
    textParts.splice(1, 0, `[card count : ${data[player.id]}]`);
    const finalText = textParts.join(" ");
    player.innerHTML = finalText;
  }
}

function getURL(card) {
  let url = "";
  if (card.type == "number" || card.type == "special") {
    url =
      "./static/" + card.type + "-" + card.color + "-" + card.value + ".png";
  } else {
    url = "./static/" + card.type + "-" + card.value + ".png";
  }
  return url;
}
//=========================startGame====================================

function handleKeypress(event) {
  if (event.key === "Enter") {
    sendGameMessage();
    event.preventDefault(); // Prevent form from being submitted
  }
}

//=========================renderHand====================================
function handleCardClick(cardImg) {
  // Remove 'expanded' class from all cards
  document.querySelectorAll(".hand_card_play").forEach((card) => {
    card.classList.remove("expanded");
  });
  // Toggle 'expanded' class only for the clicked card
  cardImg.classList.toggle("expanded");
}
function renderHand() {
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";

  // Loop through the cardImages array and create img elements for each card
  hand.forEach((card) => {
    if (cardsToPlay.includes(card)) {
      const cardImg = document.createElement("img");
      cardImg.src = getURL(card);
      cardImg.classList.add("hand_card_play");
      cardImg.addEventListener("click", () => {
        handleCardClick(cardImg);
        cardToPlay = card;
      });
      handDiv.appendChild(cardImg);
    } else {
      const cardImg = document.createElement("img");
      cardImg.src = getURL(card);
      cardImg.classList.add("hand_card_not_play");
      handDiv.appendChild(cardImg);
    }
  });

  handDiv.addEventListener("wheel", function (event) {
    event.preventDefault();
    handDiv.scrollLeft += event.deltaY;
  });
}

//=========================renderHand====================================

//=========================renderDeck====================================

// Loop through the cardImages array and create img elements for each card

function renderDeckCard() {
  const deckDiv = document.getElementById("deck");
  deckDiv.innerHTML = "";

  const backUnoImage = document.createElement("img");
  backUnoImage.src = "./static/back.png";
  backUnoImage.classList.add("deck_card");
  deckDiv.appendChild(backUnoImage);

  const topPlayImage = document.createElement("img");
  topPlayImage.src = getURL(topPlayedCard);
  topPlayImage.classList.add("deck_card");
  deckDiv.appendChild(topPlayImage);
}

//=========================renderDeck====================================

//=========================drawCard====================================

function drawCard() {
  socket.emit("drawCard", roomId, userId);
}

function showWildAnimation() {
  const modal = document.querySelector(".wild-animation-container");
  const overlay = document.querySelector(".overlay");
  modal.style.display = "block";
  overlay.style.display = "block";
}

function closeWildAnimation() {
  const modal = document.querySelector(".wild-animation-container");
  const overlay = document.querySelector(".overlay");
  // Hide the form container
  modal.style.display = "none";
  // Hide the overlay
  overlay.style.display = "none";
}

function chooseColor(color) {
  if (cardToPlay.type === "wild") {
    cardToPlay.color = color;
    topPlayedCard = cardToPlay;
    socket.emit("playCard", roomId, userId, cardToPlay);
    showCurrentColor(topPlayedCard);
  } else {
    console.log("setting color for wild card has error");
  }
}

function playCard() {
  if (cardToPlay.type === "wild") {
    let indexToRemove = hand.indexOf(cardToPlay);
    if (indexToRemove !== -1) {
      hand.splice(indexToRemove, 1);
    }
    showWildAnimation();
  } else {
    let indexToRemove = hand.indexOf(cardToPlay);
    if (indexToRemove !== -1) {
      hand.splice(indexToRemove, 1);
    }
    socket.emit("playCard", roomId, userId, cardToPlay);
  }
}
//=========================drawCard====================================
