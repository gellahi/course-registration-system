document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard statistics
    fetchDashboardStats();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Fetch courses with low seats
    fetchLowSeatsCourses();
});

// Replace the fetchDashboardStats function
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
        }
    })
    .catch(error => console.error('Error:', error));

    // Fetch course count
    fetch('/api/courses/count', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('courseCount').textContent = data.count;
        }
    })
    .catch(error => console.error('Error:', error));

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
        }
    })
    .catch(error => console.error('Error:', error));

    // Fetch prerequisite issues count
    fetch('/api/reports/prerequisite-issues/count', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('issueCount').textContent = data.count;
        }
    })
    .catch(error => console.error('Error:', error));
}

// Replace the fetchRecentRegistrations function
function fetchRecentRegistrations() {
    fetch('/api/registrations?limit=5', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('recentRegistrations');
        container.innerHTML = '';
        
        if (data.success && data.registrations.length > 0) {
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
                btn.addEventListener('click', function() {
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
        console.error('Error:', error);
        document.getElementById('recentRegistrations').innerHTML = `
            <div class="error-state">
                <p>Failed to load registrations</p>
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
                btn.addEventListener('click', function() {
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