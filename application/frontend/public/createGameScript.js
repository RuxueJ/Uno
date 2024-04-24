const createGameBtn = document.getElementById("createGameBtn");
const createGameModal = document.getElementById("createGameModal");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const createGameForm = document.getElementById("createGameForm");

createGameBtn.addEventListener("click", function () {
  createGameModal.style.display = "block";
});

closeModalBtn.addEventListener("click", function () {
  createGameModal.style.display = "none";
});

cancelBtn.addEventListener("click", function () {
  createGameModal.style.display = "none";
});

createGameForm.addEventListener("submit", function (event) {
  event.preventDefault();
  // Handle form submission here
  createGameModal.style.display = "none";
});
