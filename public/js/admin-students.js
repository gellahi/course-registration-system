document.addEventListener('DOMContentLoaded', function () {
    fetchStudents();
});

function fetchStudents() {
    // Show loading
    document.getElementById('studentsLoading').style.display = 'flex';
    document.getElementById('studentsTable').innerHTML = '';

    // In a real app, you would fetch from a students API endpoint
    // For now, we'll use the user profile endpoint to simulate
    fetch('/api/users/profile', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('studentsLoading').style.display = 'none';

            // Simulate student data
            // In a real app, you'd use a proper admin endpoint to get all students
            const students = [
                { _id: '1', name: 'Gohar Ellahi', rollNumber: '22F-3636', registeredCourses: [] },
                { _id: '2', name: 'Ahmed Khan', rollNumber: '22F-1234', registeredCourses: [] },
                { _id: '3', name: 'Fatima Ali', rollNumber: '22F-5678', registeredCourses: [] },
                { _id: '4', name: 'Mohammad Rizwan', rollNumber: '22F-9012', registeredCourses: [] }
            ];

            renderStudentsTable(students);
        })
        .catch(error => {
            document.getElementById('studentsLoading').style.display = 'none';
            console.error('Error:', error);
            showToast('An error occurred while loading students', 'error');
        });
}

function renderStudentsTable(students) {
    const container = document.getElementById('studentsTable');

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <h3>No students found</h3>
                <p>There are no students in the system yet. <a href="/admin/students/create">Add a new student</a>.</p>
            </div>
        `;
        return;
    }

    // Create search control
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.innerHTML = `
        <div class="search-box">
            <input type="text" id="studentSearch" placeholder="Search students..." class="form-control">
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
            <th>Roll Number</th>
            <th>Name</th>
            <th>Registered Courses</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    students.forEach(student => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${student.rollNumber}</td>
            <td>${student.name}</td>
            <td>${student.registeredCourses.length}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-btn" data-id="${student._id}" title="View Student">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-btn" data-id="${student._id}" title="Edit Student">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${student._id}" title="Delete Student">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Add event listeners
    document.getElementById('studentSearch').addEventListener('input', function () {
        filterTable(this.value);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const studentId = this.getAttribute('data-id');
            viewStudent(studentId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const studentId = this.getAttribute('data-id');
            window.location.href = `/admin/students/edit/${studentId}`;
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const studentId = this.getAttribute('data-id');
            deleteStudent(studentId);
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

function viewStudent(studentId) {
    // In a real app, you would fetch student details from the API
    // For now, we'll just show a simple alert
    alert(`View student details for ID: ${studentId}`);
}

function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        return;
    }

    // In a real app, you would delete the student via API
    // For now, we'll just show a success message
    showToast('Student deleted successfully', 'success');
    fetchStudents(); // Refresh the table
}