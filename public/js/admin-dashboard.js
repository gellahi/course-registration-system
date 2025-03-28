// Update the document.ready function
document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard statistics
    fetchDashboardStats();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Fetch courses with low seats
    fetchLowSeatsCourses();

    // Fetch system alerts
    fetchSystemAlerts();
});

// Replace the fetchDashboardStats function to fix course count issue
function fetchDashboardStats() {
    // Fetch student count
    fetch('/api/users/count?role=student', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('studentCount').textContent = data.count;
            } else {
                document.getElementById('studentCount').textContent = 'Error';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('studentCount').textContent = 'Error';
        });

    // Improved fetch course count with better error handling
    fetch('/api/courses/count', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('courseCount').textContent = data.count;
            } else {
                document.getElementById('courseCount').textContent = 'Error';
                console.error('API Error:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching course count:', error);
            document.getElementById('courseCount').textContent = 'Error';
        });

    // Fetch registration count
    fetch('/api/registrations/count', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('registrationCount').textContent = data.count;
            } else {
                document.getElementById('registrationCount').textContent = 'Error';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('registrationCount').textContent = 'Error';
        });

    // Fetch prerequisite issues count
    fetch('/api/reports/prerequisite-issues/count', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('issueCount').textContent = data.count || '0';
            } else {
                console.error('API Error:', data.error);
                document.getElementById('issueCount').textContent = '0';
            }
        })
        .catch(error => {
            console.error('Error fetching prerequisite issues count:', error);
            document.getElementById('issueCount').textContent = '0';
        });
}

// Add this function to fetch system alerts
function fetchSystemAlerts() {
    fetch('/api/config/alerts', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('systemAlerts');

            if (data.success && data.alerts.length > 0) {
                container.innerHTML = '';

                data.alerts.forEach(alert => {
                    const alertItem = document.createElement('div');
                    alertItem.className = 'alert-item';
                    alertItem.innerHTML = `
                    <div class="alert-icon ${alert.type}">
                        <i class="fas fa-${getIconForAlertType(alert.type)}"></i>
                    </div>
                    <div class="alert-content">
                        <h4>${alert.title}</h4>
                        <p>${alert.description}</p>
                        ${alert.link ? `<a href="${alert.link}" class="alert-link">${alert.linkText}</a>` : ''}
                    </div>
                `;

                    container.appendChild(alertItem);
                });
            } else {
                container.innerHTML = `
                <div class="empty-state-small">
                    <p>No system alerts</p>
                </div>
            `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('systemAlerts').innerHTML = `
            <div class="error-state">
                <p>Failed to load system alerts</p>
            </div>
        `;
        });
}

function getIconForAlertType(type) {
    switch (type) {
        case 'info':
            return 'info-circle';
        case 'warning':
            return 'exclamation-circle';
        case 'danger':
            return 'exclamation-triangle';
        case 'success':
            return 'check-circle';
        default:
            return 'bell';
    }
}

// Replace the fetchRecentRegistrations function
function fetchRecentRegistrations() {
    const container = document.getElementById('recentRegistrations');

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading recent registrations...</p>
        </div>
    `;

    fetch('/api/registrations?limit=5', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            container.innerHTML = '';

            if (data.success && data.registrations && data.registrations.length > 0) {
                // Create table
                const table = document.createElement('table');
                table.className = 'data-table';

                // Create table header
                const thead = document.createElement('thead');
                thead.innerHTML = `
                <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            `;
                table.appendChild(thead);

                // Create table body
                const tbody = document.createElement('tbody');

                data.registrations.forEach(reg => {
                    const tr = document.createElement('tr');

                    // Student column
                    const tdStudent = document.createElement('td');
                    tdStudent.innerHTML = `
                    <div class="user-info-cell">
                        <div class="user-avatar-sm">
                            <img src="/img/avatar.svg" alt="${reg.student.name}">
                        </div>
                        <div class="user-details">
                            <div class="user-name">${reg.student.name}</div>
                            <div class="user-id">${reg.student.rollNumber}</div>
                        </div>
                    </div>
                `;
                    tr.appendChild(tdStudent);

                    // Course column
                    const tdCourse = document.createElement('td');
                    tdCourse.innerHTML = `
                    <div class="course-info-cell">
                        <div class="course-code">${reg.course.courseCode}</div>
                        <div class="course-name">${reg.course.title}</div>
                    </div>
                `;
                    tr.appendChild(tdCourse);

                    // Date column
                    const tdDate = document.createElement('td');
                    tdDate.textContent = formatDate(reg.registrationDate);
                    tr.appendChild(tdDate);

                    // Status column
                    const tdStatus = document.createElement('td');
                    const statusClass = `status-${reg.status}`;
                    tdStatus.innerHTML = `<span class="status-badge ${statusClass}">${reg.status}</span>`;
                    tr.appendChild(tdStatus);

                    // Action column
                    const tdAction = document.createElement('td');
                    tdAction.innerHTML = `
                    <div class="action-buttons">
                        <button class="btn-icon" data-id="${reg._id}" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" data-id="${reg._id}" data-action="edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                `;
                    tr.appendChild(tdAction);

                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                container.appendChild(table);

                // Add event listeners for action buttons
                document.querySelectorAll('.btn-icon').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const id = this.getAttribute('data-id');
                        const action = this.getAttribute('data-action');

                        if (action === 'view') {
                            window.location.href = `/admin/registrations/view/${id}`;
                        } else if (action === 'edit') {
                            window.location.href = `/admin/registrations/edit/${id}`;
                        }
                    });
                });
            } else {
                container.innerHTML = `
                <div class="empty-state-small">
                    <p>No registrations found</p>
                </div>
            `;
            }
        })
        .catch(error => {
            console.error('Error fetching registrations:', error);
            container.innerHTML = `
            <div class="error-state">
                <p>Failed to load registrations</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="fetchRecentRegistrations()">Try Again</button>
            </div>
        `;
        });
}

// Replace the fetchLowSeatsCourses function
function fetchLowSeatsCourses() {
    fetch('/api/courses?availableSeats_lte=5&sort=availableSeats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('lowSeatsCourses');
            container.innerHTML = '';

            if (data.success && data.courses.length > 0) {
                const courses = data.courses.slice(0, 3); // Show only top 3

                // Create courses list
                const list = document.createElement('div');
                list.className = 'low-seats-list';

                courses.forEach(course => {
                    const percentFilled = ((course.totalSeats - course.availableSeats) / course.totalSeats) * 100;

                    const courseItem = document.createElement('div');
                    courseItem.className = 'low-seats-item';
                    courseItem.innerHTML = `
                    <div class="course-info">
                        <div class="course-code">${course.courseCode}</div>
                        <div class="course-name">${course.title}</div>
                    </div>
                    <div class="seats-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentFilled}%"></div>
                        </div>
                        <div class="seats-text">
                            <span class="${course.availableSeats === 0 ? 'text-danger' : 'text-warning'}">${course.availableSeats}</span> / ${course.totalSeats} seats available
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-sm btn-outline" data-id="${course._id}">
                            Adjust Seats
                        </button>
                    </div>
                `;

                    list.appendChild(courseItem);
                });

                container.appendChild(list);

                // Add event listeners for adjust seats buttons
                document.querySelectorAll('.course-actions .btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const id = this.getAttribute('data-id');
                        window.location.href = `/admin/courses/edit/${id}`;
                    });
                });
            } else {
                container.innerHTML = `
                <div class="empty-state-small">
                    <p>No courses with low seats</p>
                </div>
            `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = `
            <div class="error-state">
                <p>Failed to load courses</p>
            </div>
        `;
        });
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}