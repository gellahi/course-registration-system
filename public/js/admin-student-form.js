document.addEventListener('DOMContentLoaded', function () {
    // Set up form submission
    document.getElementById('studentForm').addEventListener('submit', submitStudentForm);
});

function submitStudentForm(e) {
    e.preventDefault();

    // Get form data
    const rollNumber = document.getElementById('rollNumber').value;
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    // Validate form
    if (!rollNumber || !name || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Create student
    fetch('/api/users/create-student', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            rollNumber,
            name,
            password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Student created successfully', 'success');
                // Redirect to students page after a delay
                setTimeout(() => {
                    window.location.href = '/admin/students';
                }, 1500);
            } else {
                showToast(data.error || 'Failed to create student', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}