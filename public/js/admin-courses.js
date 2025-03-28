document.addEventListener('DOMContentLoaded', function () {
    fetchCourses();
});

function fetchCourses() {
    // Show loading
    document.getElementById('coursesLoading').style.display = 'flex';
    document.getElementById('coursesTable').innerHTML = '';

    // Fetch all courses
    fetch('/api/courses', {
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
            // Hide loading
            document.getElementById('coursesLoading').style.display = 'none';

            if (data.success) {
                // Check if courses is an array before rendering
                if (Array.isArray(data.courses)) {
                    renderCoursesTable(data.courses);
                } else {
                    console.error('Invalid courses data format:', data);
                    showToast('Received invalid courses data from server', 'error');
                    document.getElementById('coursesTable').innerHTML = `
                    <div class="error-state">
                        <p>Failed to load courses: Invalid data format</p>
                    </div>
                `;
                }
            } else {
                console.error('API Error:', data.error);
                showToast(data.error || 'Failed to load courses', 'error');
                document.getElementById('coursesTable').innerHTML = `
                <div class="error-state">
                    <p>Failed to load courses</p>
                </div>
            `;
            }
        })
        .catch(error => {
            document.getElementById('coursesLoading').style.display = 'none';
            console.error('Error fetching courses:', error);
            showToast('An error occurred while loading courses', 'error');
            document.getElementById('coursesTable').innerHTML = `
            <div class="error-state">
                <p>Failed to load courses: ${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="fetchCourses()">Try Again</button>
            </div>
        `;
        });
}fetchRecentRegistrations
function renderCoursesTable(courses) {
    const container = document.getElementById('coursesTable');

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No courses found</h3>
                <p>There are no courses in the system yet. <a href="/admin/courses/create">Add a new course</a>.</p>
            </div>
        `;
        return;
    }

    // Create search and filter controls
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.innerHTML = `
        <div class="search-box">
            <input type="text" id="courseSearch" placeholder="Search courses..." class="form-control">
        </div>
        <div class="filter-options">
            <select id="departmentFilter" class="form-control">
                <option value="">All Departments</option>
                <option value="CSE">Computer Science</option>
                <option value="EE">Electrical Engineering</option>
                <option value="MTH">Mathematics</option>
                <option value="PHY">Physics</option>
            </select>
        </div>
    `;
    container.appendChild(controls);

    // Create table
    const table = document.createElement('table');
    table.className = 'data-table';

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Course Code</th>
            <th>Title</th>
            <th>Department</th>
            <th>Credit Hours</th>
            <th>Seats</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    courses.forEach(course => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${course.courseCode}</td>
            <td>${course.title}</td>
            <td>${course.department}</td>
            <td>${course.creditHours}</td>
            <td>${course.availableSeats}/${course.totalSeats}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-btn" data-id="${course._id}" title="View Course">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-btn" data-id="${course._id}" title="Edit Course">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${course._id}" title="Delete Course">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Add pagination if needed
    if (courses.length > 10) {
        const pagination = document.createElement('div');
        pagination.className = 'table-pagination';
        pagination.innerHTML = `
            <button class="btn btn-sm btn-outline">Previous</button>
            <span>Page 1 of ${Math.ceil(courses.length / 10)}</span>
            <button class="btn btn-sm btn-outline">Next</button>
        `;
        container.appendChild(pagination);
    }

    // Add event listeners
    document.getElementById('courseSearch').addEventListener('input', function () {
        filterTable(this.value);
    });

    document.getElementById('departmentFilter').addEventListener('change', function () {
        filterTableByDepartment(this.value);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            viewCourse(courseId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            window.location.href = `/admin/courses/edit/${courseId}`;
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            deleteCourse(courseId);
        });
    });
}

function filterTable(query) {
    const rows = document.querySelectorAll('.data-table tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterTableByDepartment(department) {
    const rows = document.querySelectorAll('.data-table tbody tr');

    if (!department) {
        rows.forEach(row => row.style.display = '');
        return;
    }

    rows.forEach(row => {
        const deptCell = row.cells[2].textContent;
        if (deptCell === department) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function viewCourse(courseId) {
    fetch(`/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const course = data.course;

                // Format schedule for display
                const scheduleDisplay = course.schedule.map(slot =>
                    `${slot.day}: ${slot.startTime} - ${slot.endTime} (${slot.room})`
                ).join('\n');

                // Display course details in an alert for now
                // In a real app, you'd use a modal with more formatting
                alert(`
                Course Code: ${course.courseCode}
                Title: ${course.title}
                Department: ${course.department}
                Level: ${course.level}
                Credit Hours: ${course.creditHours}
                Available Seats: ${course.availableSeats}/${course.totalSeats}
                
                Schedule:
                ${scheduleDisplay}
                
                Description:
                ${course.description || 'No description provided'}
            `);
            } else {
                showToast('Failed to load course details', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }

    fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Course deleted successfully', 'success');
                fetchCourses(); // Refresh the table
            } else {
                showToast(data.error || 'Failed to delete course', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}