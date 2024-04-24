async function login(email, password) {
  try {
    const response = await fetch("http://localhost:3000/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Store the JWT token in local storage for future requests
    localStorage.setItem("token", data.token);
    // localStorage.setItem("userId", data.data.id);
    // localStorage.setItem("username", data.data.userName);
    // Redirect to the dashboard or perform any other action
    window.location.href = "lobby.html"; // Change the URL accordingly
  } catch (error) {
    console.error("Error:", error);
    alert("Login failed. Please try again.");
  }
}

document
  .getElementById("signInForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });

  window.addEventListener("load", (event) => {
    const token = localStorage.getItem("token");
    if(!token) {
      return;
    }

    // call API to check if a user was playing a game before
    const roomId = "dummy";
    if(roomId) {
      window.location.href = `/game/${roomId}`;
    }else {
      localStorage.removeItem("token")
    }
  });
