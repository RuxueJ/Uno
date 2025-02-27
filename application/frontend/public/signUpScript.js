var username = document.getElementById("username").value.trim();

function validateForm(event) {
  if (
    !checkUsername() ||
    !checkPasswordRequirements() ||
    !checkPasswordMatch()
  ) {
    event.preventDefault(); // Prevent default form submission
    return false;
  }
  return true;
}

function checkUsername() {
  var username = document.getElementById("username").value.trim();

  if (username === "") {
    alert("Please enter username");
    return false;
  }
  return true;
}

function checkPasswordRequirements() {
  var password = document.getElementById("password").value.trim();

  var requirements = document.getElementById("passwordRequirements");
  var isValid = true;
  var requirementMessages = [];

  // Check if password meets the criteria and update the requirements
  if (!/[A-Z]/.test(password)) {
    requirementMessages.push(
      "Password must contain at least one uppercase letter."
    );
    isValid = false;
  }
  if (!/[!@#$%^&*]/.test(password)) {
    requirementMessages.push(
      "Password must include at least one special character."
    );
    isValid = false;
  }
  if (password.length < 8) {
    requirementMessages.push("Password must be at least 8 characters long.");
    isValid = false;
  }

  requirements.innerHTML = requirementMessages.join("<br>");

  // Update input box color based on validit
  var inputBox = document.getElementById("password");
  inputBox.classList.toggle("border-red-500", !isValid);
  inputBox.classList.toggle("border-blue-500", isValid);
  return isValid;
}

function checkPasswordMatch() {
  var password = document.getElementById("password").value.trim();

  var repassword = document.getElementById("repassword").value.trim();
  var repasswordRequirements = document.getElementById("repasswordCheck");
  var passwordCheckBox = document.getElementById("repassword");
  var match = false;
  if (password === repassword) {
    repasswordRequirements.innerHTML = "";
    match = true;
  } else {
    repasswordRequirements.innerHTML = "Password does not match";
  }

  passwordCheckBox.classList.toggle("border-red-500", !match);
  passwordCheckBox.classList.toggle("border-blue-500", match);
  return match;
}

function clearPasswordCheck() {
  var repasswordCheck = document.getElementById("repasswordCheck");
  repasswordCheck.innerHTML = "";
}

function clearEmailCheck() {
  var emailCheck = document.getElementById("emailCheck");
  emailCheck.innerHTML = "";
  var emailBox = document.getElementById("email");
  emailBox.classList.remove("border-red-500");
}

document
  .getElementById("SignUpForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();

    var email = document.getElementById("email").value.trim();

    // Construct JSON object
    const jsonObject = {
      userName: username,
      email: email,
      password: password,
    };

    // Call the API
    fetch("http://localhost:3000/api/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonObject),
    })
      .then((response) => {
        switch (response.status) {
          case 200:
            alert("Sign-up Successfully!");
            window.location.href = "SignIn.html";
            break;
          case 400:
            var emailCheck = document.getElementById("emailCheck");
            emailCheck.innerHTML = "User already exists";
            emailCheck.classList.add("text-red");
            var email = document.getElementById("email");
            email.classList.add("border-red-500");
            break;
          case 422:
            break;
          case 500:
            break;
        }

        return response.json();
      })
      .then((data) => {
        if (data.message) {
          console.log("Message:", data.message);

          // Handle the message
        } else {
          console.error("Error: Message not found in the response");
          // Handle the case where message is missing
        }
        // Handle success response
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle error
      });
  });
