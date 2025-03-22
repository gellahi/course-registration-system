document.addEventListener('DOMContentLoaded', function () {
    fetchRegistrations();
});

function fetchRegistrations() {
    // Show loading
    document.getElementById('registrationsLoading').style.display = 'flex';
    document.getElementById('registrationsTable').innerHTML = '';

    // Fetch all registrations
    fetch('/api/registrations', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('registrationsLoading').style.display = 'none';

            if (data.success) {
                renderRegistrationsTable(data.registrations);
            } else {
                showToast('Failed to load registrations', 'error');
            }
        })
        .catch(error => {
            document.getElementById('registrationsLoading').style.display = 'none';
            console.error('Error:', error);
            showToast('An error occurred while loading registrations', 'error');
        });
}

function renderRegistrationsTable(registrations) {
    const container = document.getElementById('registrationsTable');

    if (registrations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No registrations found</h3>
                <p>There are no course registrations in the system yet.</p>
            </div>
        `;
        return;
    }

    // Create search and filter controls
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.innerHTML = `
        <div class="search-box">
            <input type="text" id="registrationSearch" placeholder="Search registrations..." class="form-control">
        </div>
        <div class="filter-options">
            <select id="statusFilter" class="form-control">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
            <th>Student</th>
            <th>Course</th>
            <th>Registration Date</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    registrations.forEach(registration => {
        const tr = document.createElement('tr');

        // Format date
        const registrationDate = new Date(registration.registrationDate).toLocaleDateString();

        tr.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar-sm">
                        <img src="/img/avatar.svg" alt="${registration.student.name}">
                    </div>
                    <div class="user-details">
                        <div class="user-name">${registration.student.name}</div>
                        <div class="user-id">${registration.student.rollNumber}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="course-info-cell">
                    <div class="course-code">${registration.course.courseCode}</div>
                    <div class="course-name">${registration.course.title}</div>
                </div>
            </td>
            <td>${registrationDate}</td>
            <td><span class="status-badge status-${registration.status}">${registration.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon approve-btn ${registration.status === 'approved' ? 'disabled' : ''}" 
                        data-id="${registration._id}" title="Approve" ${registration.status === 'approved' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon reject-btn ${registration.status === 'rejected' ? 'disabled' : ''}" 
                        data-id="${registration._id}" title="Reject" ${registration.status === 'rejected' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${registration._id}" title="Delete">
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
    document.getElementById('registrationSearch').addEventListener('input', function () {
        filterTable(this.value);
    });

    document.getElementById('statusFilter').addEventListener('change', function () {
        filterTableByStatus(this.value);
    });

    document.querySelectorAll('.approve-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function () {
            const registrationId = this.getAttribute('data-id');
            updateRegistrationStatus(registrationId, 'approved');
        });
    });

    document.querySelectorAll('.reject-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function () {
            const registrationId = this.getAttribute('data-id');
            updateRegistrationStatus(registrationId, 'rejected');
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const registrationId = this.getAttribute('data-id');
            deleteRegistration(registrationId);
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

function filterTableByStatus(status) {
    const rows = document.querySelectorAll('.data-table tbody tr');

    if (!status) {
        rows.forEach(row => row.style.display = '');
        return;
    }

    rows.forEach(row => {
        const statusText = row.querySelector('.status-badge').textContent;
        if (statusText === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateRegistrationStatus(registrationId, status) {
    fetch(`/api/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(`Registration ${status} successfully`, 'success');
                fetchRegistrations(); // Refresh the table
            } else {
                showToast(data.error || `Failed to ${status} registration`, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function deleteRegistration(registrationId) {
    if (!confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
        return;
    }

    fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Registration deleted successfully', 'success');
                fetchRegistrations(); // Refresh the table
            } else {
                showToast(data.error || 'Failed to delete registration', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}