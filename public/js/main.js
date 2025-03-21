// Main JavaScript file for shared functionality

document.addEventListener('DOMContentLoaded', function () {
    // Toggle sidebar
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const menuToggleBtn = document.querySelector('.menu-toggle');
    const appContainer = document.querySelector('.app-container');

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function () {
            appContainer.classList.toggle('sidebar-collapsed');
        });
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', function () {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Clear tokens, etc.
            localStorage.removeItem('token');

            // Redirect to home
            window.location.href = '/';
        });
    }
});

// Toast notification system
const toastContainer = document.getElementById('toastContainer');

function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <button class="toast-close">×</button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Show the toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');

        // Remove from DOM after animation
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });

    // Auto-close after duration
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toast.classList.remove('show');

            // Remove from DOM after animation
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, duration);
}