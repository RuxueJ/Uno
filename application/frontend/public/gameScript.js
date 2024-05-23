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

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

const queryString = window.location.search;
const queryParams = new URLSearchParams(queryString);
const gameRoomName = queryParams.get("gameName");

// Set the game room name as the text content of the header element
const gameRoomNameHeader = document.getElementById("gameRoomName");
// console.log("the value of gameRoomname header is " + gameRoomNameHeader);
gameRoomNameHeader.textContent = "Game Room: " + gameRoomName;

const greetingMessage = document.getElementById("greetingMessage");
// console.log("the value of greetingMessage is " + greetingMessage);
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

function updataCardsToPlay() {
  cardsToPlay = [];

  if (topPlayedCard === null || hand === undefined || hand.length === 0) {
    console.log("topPlayedCard is null or hand is empty");
    return [];
  }

  if (
    (topPlayedCard.value === "draw2" || topPlayedCard.value == "wilddraw4") &&
    drawAmount == 0
  ) {
    console.log("topPlayedCard is draw2 or wilddraw4 and drawAmount is 0");
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
      players = result.player_list;
      const playerList = document.getElementById("playerList");
      const playerListNeedtoBeUpdated = playerList.children.length === 0;
      if(playerListNeedtoBeUpdated) playerList.innerHTML = "";
      result.player_list.forEach((user) => {
        // Access properties of each object
        if(playerListNeedtoBeUpdated) {
          const userInfo = document.createElement("li");
          // Set the text content of the li element
          userInfo.textContent = user.userName;
          // Append the li element to the div container
          playerList.appendChild(userInfo);
        }

        // console.log("user.isHost" + user.isHost);
        // console.log("result.player_list.length" + result.player_list.length);
        // console.log("result.max_player" + result.max_player);

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
        showTurn();
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
  console.log(`Leaving room ${roomId}`);
  //because we are changing the window to lobby.html the socket disconnects and goes through socket.on('disconnecting')
  window.location.href = "lobby.html"; // Change the URL accordingly
}

function startGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  socket.emit("startGame", roomId);
  console.log(`Starting game ${roomId}`);
  clearDeckMessage();
  clearStartButton();
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

// socket.emit("reconnectAttempt", userId);

socket.on("backToLobby", () => {
  socket.on("backToLobby", () => {
    window.location.href = "lobby.html";
  });
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
socket.on("userJoin", (data) => {
  console.log("I am in userJoin event");
  // console.log("data.gamePlaying" + data.gamePlaying);
  getUserInRoom();
});

socket.on("userReconnect", () => {
  console.log("I am in userReconnect event");
  socket.emit("reconnected", roomId);
});

// Handling "userLeft" event
socket.on("userLeft", () => {
  console.log("I am in userLeft event");
  getUserInRoom();
});

// Handling "userLeft" event
socket.on("drawnCards", (data) => {
  console.log("I am in drawnCards event");
  data.forEach((card) => {
    hand.push(card);
  });
});

socket.on("nextTurn", (data) => {
  // check if it is your turn
  console.log("I am in nextTurn event");
  nextPlayer = data.nextTurn;
  showTurn(data.nextTurn);
  if (data.nextTurn == userId) {
    showDrawPlayButton();
  } else {
    // Get the div element by its ID
    disappearDrawPlayButton();
  }

  // showTurn();
  cardsToPlay = updataCardsToPlay();
  renderDeckCard();
  renderHand();
  showCurrentColor(topPlayedCard);
});

socket.on("playedCard", (data) => {

  console.log(
    "I am in playedCard event,data.discardDesckTop: " + data.discardDesckTop
  );
  topPlayedCard = data.discardDesckTop;

});

//=========================startGame====================================
function startGame() {
  socket.emit("startGame", roomId);
  isPlaying = true;
  console.log("I am emit startGame event");
}

function disappearDrawPlayButton() {
  console.log("I am in disappear draw play button");
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
  // if (cardsToPlay.length == 0) {
  //   playCardBtn.disabled = true;
  // } else {
  //   playCardBtn.disabled = false;
  // }
  // console.log(
  //   "I am in show DrawPlay button funcion, and playcardbutton is: " +
  //     playCardBtn.disabled
  // );
}

function showCurrentColor(currentCard) {
  const deck = document.getElementById("deck-container");
  deck.style.backgroundColor = currentCard.color;
}

socket.on("updateDrawAmount", (data) => {
  drawAmount = Number(data);
});

socket.on("playersHand", (data) => {
  console.log("I am in playersHand event");
  console.log(JSON.stringify(data));

  hand = [];

  // cardsToPlay = checkCards(topPlayedCard, data.playersHand);
  data.forEach((card) => {
    hand.push(card);
  });
});
socket.on("gameStarted", (data) => {
  if (data) isPlaying = true;
  console.log("I am in gameStarted event" + JSON.stringify(data));


  topPlayedCard = data.discardDeckTopCard;
  showCurrentColor(topPlayedCard);

  console.log("topPlayedCard: " + JSON.stringify(topPlayedCard));

  // topPlayedCardUrl = getURL(topPlayedCard);
  // console.log("topPlayedCardUrl: " + topPlayedCardUrl);
  cardsToPlay = updataCardsToPlay();
  renderHand();

//   topPlayedCard = getURL(data.discardDeckTopCard);
  showTurn(data.nextTurn);

  clearDeckMessage();
  renderDeckCard();
  clearStartButton();

  console.log("I am in gameStarted socket evnet");
  console.log("I am in nextTurn event");
  console.log("data.nextTurn" + data.nextTurn);
  console.log("userId" + userId);
  if (data.nextTurn == userId) {
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
  }
})

function showTurn(currentPlayingUser) {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
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
    playerList.appendChild(child)
  }
}

function renderPlayerCardsCount(data) {
  console.log(data);
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
  console.log("I am in renderhand function");
  const handDiv = document.getElementById("hand");
  handDiv.innerHTML = "";

  console.log("hand: " + JSON.stringify(hand));
  console.log("topPlayedCard " + JSON.stringify(topPlayedCard));

  console.log("cardsToPlay: " + JSON.stringify(cardsToPlay));

  // Loop through the cardImages array and create img elements for each card
  hand.forEach((card) => {
    if (cardsToPlay.includes(card)) {
      const cardImg = document.createElement("img");
      cardImg.src = getURL(card);
      cardImg.classList.add("hand_card_play");
      cardImg.addEventListener("click", () => {
        handleCardClick(cardImg);
        cardToPlay = card;
        console.log("cardToPlay: " + JSON.stringify(cardToPlay));
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
  console.log("i am in closeCreateForm function");
}

function chooseColor(color) {
  if (cardToPlay.type === "wild") {
    cardToPlay.color = color;
    topPlayedCard = cardToPlay;
    console.log(
      "after choosing the color, the cardToPlay is:" +
        JSON.stringify(cardToPlay)
    );
    socket.emit("playCard", roomId, userId, cardToPlay);
    showCurrentColor(topPlayedCard);
  } else {
    console.log("setting color for wild card has error");
  }
}

function playCard() {
  console.log("I am in playCard function");

  if (cardToPlay.type === "wild") {
    console.log("cardToPlay.type is wild and shows animation");
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
