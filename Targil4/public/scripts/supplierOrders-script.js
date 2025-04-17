// Iterate over all forms with the class 'approve-form' and add an event listener for submission
document.querySelectorAll('.approve-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        // Prevent the default form submission action
        e.preventDefault();

        // Get the order ID from the form's data attribute
        const orderId = form.getAttribute('data-order-id');

        try {
            // Send a POST request to approve the order, passing the order ID in the request body
            const response = await fetch('/s/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'  // Indicate that the body is JSON
                },
                body: JSON.stringify({ orderId })  // Convert the orderId to a JSON string and send it in the body
            });

            // If the response is successful, reload the page to reflect changes
            if (response.ok) {
                location.reload();
            } else {
                // If there was an error with the approval request, show an alert
                alert('An error occurred while approving the order');
            }
        } catch (err) {
            // If there's an issue with the fetch request, log the error and show a server error alert
            console.error(err);
            alert('Server error');
        }
    });
});
