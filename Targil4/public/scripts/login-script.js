// Toggle the visibility of the password input field between 'password' and 'text'
function togglePassword() {
    const passwordField = document.getElementById('password');
    
    // If the current type is 'password', change to 'text' to show the password, and vice versa
    passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
}

// Validate that the password length is between 6 and 8 characters
function validatePasswordLength() {
    const passwordInput = document.getElementById("password");
    const errorDiv = document.getElementById("password-error");

    // If the password is too short or too long, show the error message
    if (passwordInput.value.length < 6 || passwordInput.value.length > 8) {
        errorDiv.style.display = "block";
    } else {
        // If the password length is valid, hide the error message
        errorDiv.style.display = "none";
    }
}
