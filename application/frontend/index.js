const express = require("express");
const path = require("path");
const app = express();
const PORT = 8080;

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.redirect("/public/signIn.html");
});

app.get("/signup", function (req, res) {
  res.redirect("/public/signUp.html");
});

app.get("/lobby", function (req, res) {
  res.redirect("/public/lobby.html");
});
app.get("/game", function (req, res) {
  res.redirect("/public/game.html");
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
