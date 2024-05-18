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

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("email", data.data.email);
    sessionStorage.setItem("userName", data.data.userName);
    sessionStorage.setItem("userId", data.data.userId);

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
  const token = sessionStorage.getItem("token");
  if (!token) {
    return;
  }
});
