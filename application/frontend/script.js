var username;
var password;
var email;

function validateForm(event) {
    if (!checkUsername() || !checkPasswordRequirements() || !checkPasswordMatch()) {
        event.preventDefault(); // Prevent default form submission
        console.log("should not submit")
        return false;
    }      
    console.log("should submit")
    return true
}


function checkUsername(){

    username = document.getElementById("username").value.trim();
   
    if (username === ""){
        alert("Please enter username");
        return false;
    }
    return true;
}

function checkPasswordRequirements() {

    password = document.getElementById("password").value.trim();
   
    var requirements = document.getElementById("passwordRequirements");
    var isValid = true;
    var requirementMessages = [];

    // Check if password meets the criteria and update the requirements
    if (!/[A-Z]/.test(password)) {
        requirementMessages.push("Password must contain at least one uppercase letter.");
        isValid = false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
        requirementMessages.push("Password must include at least one special character.");
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
    return isValid
}

function checkPasswordMatch(){
  
    var repassword = document.getElementById("repassword").value.trim();
    var repasswordRequirements = document.getElementById("repasswordRequirements");
    if (password === repassword){
        repasswordRequirements.innerHTML= "";
        return true
    }else{
        repasswordRequirements.innerHTML = "Password does not match";
        return false
    }
}

function clearPasswordCheck(){
    var repasswordRequirements = document.getElementById("repasswordRequirements");
    repasswordRequirements.innerHTML = "";
    
}

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

    username = document.getElementById("username").value.trim();
    password = document.getElementById("password").value.trim();
    email = document.getElementById("email").value.trim();

    // Construct JSON object
    const jsonObject = {
        userName: username,
        email: email,
        password: password
    };


    // Call the API
    fetch("http://localhost:3000/api/user/register", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonObject)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Handle success response
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle error
    });

});
