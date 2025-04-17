// Toggle the visibility of the password field
function togglePassword() {
  const passwordField = document.getElementById('password');
  passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
}

// Validate password length and show/hide error message
function validatePasswordLength() {
  const passwordInput = document.getElementById("password");
  const errorDiv = document.getElementById("password-error");

  if (passwordInput.value.length < 6 || passwordInput.value.length > 8) {
    errorDiv.style.display = "block"; // Show error if password length is invalid
  } else {
    errorDiv.style.display = "none"; // Hide error if valid
  }
}

// Add a new product input field after validating current inputs
function addProduct(button) {
  const container = document.getElementById("products");

  // Get the current input group where the '+' button was clicked
  const inputGroup = button.closest(".product-field");
  const nameInput = inputGroup.querySelector(".product-name");
  const priceInput = inputGroup.querySelector(".product-price");
  const minInput = inputGroup.querySelector(".product-minimum");

  // Make sure all fields are filled before adding a new one
  if (!nameInput.value.trim() || priceInput.value === "" || minInput.value === "") {
    alert("אנא מלא את כל שדות הפריט לפני הוספת חדש."); // Show alert in Hebrew
    return;
  }

  // Create a new product input group
  const newField = document.createElement("div");
  newField.className = "product-field";
  newField.innerHTML = `
    <button type="button" onclick="addProduct(this)">+</button>
    <input type="text" placeholder="הכנס פריט" class="product-name" />
    <input type="number" min="0" step="0.01" placeholder="הכנס מחיר" class="product-price" />
    <input type="number" min="0" step="1" placeholder="כמות מינימלית לרכישה" min="0" max="10000" class="product-minimum" />
    <button type="button" onclick="removeProduct(this)">−</button>
  `;
  container.appendChild(newField);
}

// Remove a product input group, only if at least one remains
function removeProduct(button) {
  const container = document.getElementById("products");
  if (container.children.length > 1) {
    button.parentElement.remove();
  }
}

// Handle form submission: validate all inputs and prepare product list as JSON
document.querySelector("form").addEventListener("submit", function (e) {
  const passwordInput = document.getElementById("password");

  // Check password length before submitting
  if (passwordInput.value.length < 6 || passwordInput.value.length > 8) {
    alert("הסיסמה חייבת להכיל בין 6 ל־8 תווים."); // Show alert in Hebrew
    e.preventDefault();
    return;
  }

  const names = document.querySelectorAll(".product-name");
  const prices = document.querySelectorAll(".product-price");
  const minimums = document.querySelectorAll(".product-minimum");

  const productList = [];

  // Loop through product inputs to build the product list
  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim();
    const price = parseFloat(prices[i].value);
    const minQty = parseInt(minimums[i].value);

    // Validate each product's data
    if (!name || isNaN(price) || isNaN(minQty) || minQty < 0 || price < 0) {
      alert("ודא שכל שדות הסחורה מלאים ותקינים (כמות ומחיר ≥ 0)."); // Show alert in Hebrew
      e.preventDefault();
      return;
    }

    // Add the valid product to the list
    productList.push({ name: name, price: price, minimum: minQty });

    // Save the product list as a JSON string in a hidden input field
    document.getElementById("productListData").value = JSON.stringify(productList);
  }
});
