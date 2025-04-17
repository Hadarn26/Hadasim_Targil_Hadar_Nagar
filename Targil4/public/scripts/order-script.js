// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to various DOM elements
    const supplierSelect = document.getElementById('supplierSelect');
    const supplierDetailsDiv = document.getElementById('supplierDetails');
    const productInputsDiv = document.getElementById('productInputs');
    const productListDiv = document.getElementById('productList');
    const submitBtn = document.getElementById('submitBtn');
    const productListInput = document.getElementById('productListInput');

    // Create and configure a display element for the total price
    const totalDisplay = document.createElement('div');
    totalDisplay.id = 'totalDisplay';
    totalDisplay.style.marginTop = '20px';
    totalDisplay.style.fontWeight = 'bold';
    totalDisplay.textContent = 'סכום כולל: 0 ₪';
    productInputsDiv.appendChild(totalDisplay);

    // Event listener for when a supplier is selected
    supplierSelect.addEventListener('change', async () => {
        const supplierId = supplierSelect.value;
        if (!supplierId) return;

        try {
            // Fetch supplier details from the server
            const res = await fetch(`/s/details/${supplierId}`);
            const data = await res.json();

            // Display supplier information
            supplierDetailsDiv.innerHTML = `
                <strong>שם חברה:</strong> ${data.companyName}<br>
                <strong>שם נציג:</strong> ${data.representativeName}<br>
                <strong>טלפון:</strong> ${data.phone}<br>
            `;
            supplierDetailsDiv.classList.remove('hidden');

            // Clear previous product list
            productListDiv.innerHTML = '';

            // Generate input fields for each product provided by the supplier
            data.products.forEach((p, index) => {
                const row = document.createElement('div');
                row.classList.add('product-row');
                row.style.marginBottom = '10px';

                row.innerHTML = `
                    <label><strong>${p.name}</strong> - ${p.price} ₪</label><br>
                    <small>כמות מינימלית: ${p.minimum}</small><br>
                    <input type="number" 
                           name="qty_${index}" 
                           min="${p.minimum}" 
                           max="10000" 
                           value="${p.minimum}" 
                           data-name="${p.name}"
                           data-price="${p.price}"
                           data-minimum="${p.minimum}"
                           class="qty-input">
                `;
                productListDiv.appendChild(row);
            });

            // Show relevant sections and calculate initial total
            productInputsDiv.classList.remove('hidden');
            submitBtn.classList.remove('hidden');
            updateTotal();

            // Add event listeners to all quantity input fields to update total dynamically
            document.querySelectorAll('.qty-input').forEach(input => {
                input.addEventListener('input', updateTotal);
            });

        } catch (err) {
            console.error('Error fetching supplier details:', err);
        }
    });

    // Function to calculate and display the total price
    function updateTotal() {
        let total = 0;
        document.querySelectorAll('.qty-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            const price = parseFloat(input.dataset.price);
            total += qty * price;
        });
        totalDisplay.textContent = `סה"כ לתשלום:  ${total} ₪`;
        document.getElementById('totalPriceInput').value = total;
    }

    // Handle form submission: collect selected products and quantities into a JSON string
    document.getElementById('orderForm').addEventListener('submit', e => {
        const inputs = document.querySelectorAll('.qty-input');
        const products = [];

        inputs.forEach(input => {
            const qty = parseInt(input.value);
            if (qty > 0) {
                products.push({
                    name: input.dataset.name,
                    qty
                });
            }
        });

        productListInput.value = JSON.stringify(products);
    });

    // Automatically hide the success message after 5 seconds
    const msg = document.getElementById('successMsg');
    if (msg) {
        setTimeout(() => {
            msg.style.display = 'none';
        }, 5000);
    }
});
