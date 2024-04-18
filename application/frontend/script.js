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
    var repasswordRequirements = document.getElementById("repasswordCheck");
    var passwordCheckBox= document.getElementById("repassword");
    var match = false;
    if (password === repassword){
        repasswordRequirements.innerHTML= "";
        match = true;
    }else{
        repasswordRequirements.innerHTML = "Password does not match";
       
    }

    passwordCheckBox.classList.toggle("border-red-500",!match);
    passwordCheckBox.classList.toggle("border-blue-500",match);
    return match;
}

function clearPasswordCheck(){
    var repasswordCheck = document.getElementById("repasswordCheck");
    repasswordCheck.innerHTML = "";
    
}

function clearEmailCheck(){
    var emailCheck = document.getElementById("emailCheck");
    emailCheck.innerHTML = "";
    email = document.getElementById("email")
    email.classList.remove("border-red-500");

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
    .then(response => {
        switch(response.status){
            case 200: alert("Sign-in Successful!");break;
            case 400:
                var emailCheck = document.getElementById("emailCheck");
                emailCheck.innerHTML = "User already exists";
                emailCheck.classList.add("text-red");
                var email = document.getElementById("email");
                email.classList.add("border-red-500");
                break;
            case 422:break;
            case 500:break;

        }
        
        return response.json()})
    .then(data => {
        if (data.message) {
            console.log('Message:', data.message);
        
            // Handle the message
        } else {
            console.error('Error: Message not found in the response');
            // Handle the case where message is missing
        }
        // Handle success response
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle error
    });

});
