document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard statistics
    fetchDashboardStats();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Fetch courses with low seats
    fetchLowSeatsCourses();
});

// Fetch dashboard statistics
function fetchDashboardStats() {
    // In a real implementation, these would be API calls
    // For now, we'll simulate with some values
    setTimeout(() => {
        document.getElementById('studentCount').textContent = '342';
        document.getElementById('courseCount').textContent = '127';
        document.getElementById('registrationCount').textContent = '598';
        document.getElementById('issueCount').textContent = '8';
    }, 1000);
}

// Fetch recent registrations
function fetchRecentRegistrations() {
    // Simulate API call with setTimeout
    setTimeout(() => {
        const container = document.getElementById('recentRegistrations');

        // Sample data
        const registrations = [
            { id: 1, studentName: 'Gohar Ellahi', studentRoll: '22F-3636', courseCode: 'CSE301', courseName: 'Database Systems', status: 'approved', date: '2023-05-10' },
            { id: 2, studentName: 'Ahmed Khan', studentRoll: '22F-1234', courseCode: 'CSE401', courseName: 'Artificial Intelligence', status: 'pending', date: '2023-05-09' },
            { id: 3, studentName: 'Fatima Ali', studentRoll: '22F-5678', courseCode: 'MTH201', courseName: 'Calculus II', status: 'approved', date: '2023-05-08' },
            { id: 4, studentName: 'Mohammad Rizwan', studentRoll: '22F-9012', courseCode: 'PHY101', courseName: 'Physics I', status: 'rejected', date: '2023-05-07' },
            { id: 5, studentName: 'Ayesha Ahmad', studentRoll: '22F-3456', courseCode: 'ENG201', courseName: 'Technical Writing', status: 'approved', date: '2023-05-06' }
        ];

        // Clear loading spinner
        container.innerHTML = '';

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

        registrations.forEach(reg => {
            const tr = document.createElement('tr');

            // Student column
            const tdStudent = document.createElement('td');
            tdStudent.innerHTML = `
                <div class="user-info-cell">
                    <div class="user-avatar-sm">
                        <img src="/img/avatar.svg" alt="${reg.studentName}">
                    </div>
                    <div class="user-details">
                        <div class="user-name">${reg.studentName}</div>
                        <div class="user-id">${reg.studentRoll}</div>
                    </div>
                </div>
            `;
            tr.appendChild(tdStudent);

            // Course column
            const tdCourse = document.createElement('td');
            tdCourse.innerHTML = `
                <div class="course-info-cell">
                    <div class="course-code">${reg.courseCode}</div>
                    <div class="course-name">${reg.courseName}</div>
                </div>
            `;
            tr.appendChild(tdCourse);

            // Date column
            const tdDate = document.createElement('td');
            tdDate.textContent = formatDate(reg.date);
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
                    <button class="btn-icon" data-id="${reg.id}" data-action="view">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" data-id="${reg.id}" data-action="edit">
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
                    alert(`View registration ${id}`);
                } else if (action === 'edit') {
                    alert(`Edit registration ${id}`);
                }
            });
        });

    }, 1500);
}

// Fetch courses with low seats
function fetchLowSeatsCourses() {
    // Simulate API call with setTimeout
    setTimeout(() => {
        const container = document.getElementById('lowSeatsCourses');

        // Sample data
        const courses = [
            { id: 1, code: 'CSE401', name: 'Artificial Intelligence', available: 2, total: 40 },
            { id: 2, code: 'CSE301', name: 'Database Systems', available: 0, total: 45 },
            { id: 3, code: 'CSE201', name: 'Data Structures', available: 3, total: 50 }
        ];

        // Clear loading spinner
        container.innerHTML = '';

        // Create courses list
        const list = document.createElement('div');
        list.className = 'low-seats-list';

        courses.forEach(course => {
            const percentFilled = ((course.total - course.available) / course.total) * 100;

            const courseItem = document.createElement('div');
            courseItem.className = 'low-seats-item';
            courseItem.innerHTML = `
                <div class="course-info">
                    <div class="course-code">${course.code}</div>
                    <div class="course-name">${course.name}</div>
                </div>
                <div class="seats-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentFilled}%"></div>
                    </div>
                    <div class="seats-text">
                        <span class="${course.available === 0 ? 'text-danger' : 'text-warning'}">${course.available}</span> / ${course.total} seats available
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn btn-sm btn-outline" data-id="${course.id}">
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
                alert(`Adjust seats for course ${id}`);
            });
        });

    }, 1800);
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}