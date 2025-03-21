document.addEventListener('DOMContentLoaded', function () {
    const studentLoginForm = document.getElementById('studentLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const rollNumber = document.getElementById('rollNumber').value;
            const password = document.getElementById('password').value;

            // Validate form
            if (!rollNumber || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            // Send login request
            fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rollNumber, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Save token to localStorage
                        localStorage.setItem('token', data.token);

                        // Redirect to dashboard
                        window.location.href = '/student/dashboard';
                    } else {
                        showToast(data.error || 'Login failed. Please try again.', 'error');

                        // Reset button
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred. Please try again.', 'error');

                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Validate form
            if (!username || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            // Send login request
            fetch('/api/users/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Save token to localStorage
                        localStorage.setItem('token', data.token);

                        // Redirect to dashboard
                        window.location.href = '/admin/dashboard';
                    } else {
                        showToast(data.error || 'Login failed. Please try again.', 'error');

                        // Reset button
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred. Please try again.', 'error');

                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
});