document.addEventListener('DOMContentLoaded', function () {
    // Fetch student registrations
    fetchRegistrations();
});

function fetchRegistrations() {
    // Show loading
    document.getElementById('registrationsLoading').style.display = 'flex';
    document.getElementById('registrationsList').innerHTML = '';

    // Fetch registrations from API
    fetch('/api/registrations/my', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('registrationsLoading').style.display = 'none';

            if (data.success) {
                renderRegistrations(data.registrations);
            } else {
                showToast('Failed to load your registrations', 'error');
            }
        })
        .catch(error => {
            document.getElementById('registrationsLoading').style.display = 'none';
            console.error('Error:', error);
            showToast('An error occurred while loading your registrations', 'error');
        });
}

function renderRegistrations(registrations) {
    const container = document.getElementById('registrationsList');

    if (registrations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No registrations found</h3>
                <p>You haven't registered for any courses yet. <a href="/student/courses">Browse available courses</a>.</p>
            </div>
        `;
        return;
    }

    // Group registrations by status
    const approved = registrations.filter(reg => reg.status === 'approved');
    const pending = registrations.filter(reg => reg.status === 'pending');
    const rejected = registrations.filter(reg => reg.status === 'rejected');

    // Create section for each status group if they have registrations
    if (approved.length > 0) {
        container.appendChild(createRegistrationSection('Approved Registrations', approved, 'success'));
    }

    if (pending.length > 0) {
        container.appendChild(createRegistrationSection('Pending Registrations', pending, 'warning'));
    }

    if (rejected.length > 0) {
        container.appendChild(createRegistrationSection('Rejected Registrations', rejected, 'danger'));
    }
}

function createRegistrationSection(title, registrations, type) {
    const section = document.createElement('div');
    section.className = 'registrations-section';

    // Add section heading
    const heading = document.createElement('h3');
    heading.className = `section-heading text-${type}`;
    heading.innerHTML = `<i class="fas fa-${getIconForType(type)}"></i> ${title}`;
    section.appendChild(heading);

    // Add registrations
    const cards = document.createElement('div');
    cards.className = 'registration-cards';

    registrations.forEach(registration => {
        const course = registration.course;

        const card = document.createElement('div');
        card.className = 'registration-card';

        // Format schedule for display
        const scheduleDisplay = course.schedule.map(slot =>
            `<div class="schedule-item">
                <i class="fas fa-clock"></i> ${slot.day} ${slot.startTime} - ${slot.endTime}
                <span class="room">${slot.room}</span>
            </div>`
        ).join('');

        card.innerHTML = `
            <div class="card-header">
                <div class="course-code">${course.courseCode}</div>
                <div class="status-badge status-${registration.status}">${registration.status}</div>
            </div>
            <h4 class="course-title">${course.title}</h4>
            <div class="course-meta">
                <div class="meta-item">
                    <i class="fas fa-building"></i> ${course.department}
                </div>
                <div class="meta-item">
                    <i class="fas fa-graduation-cap"></i> ${course.creditHours} Credits
                </div>
            </div>
            <div class="card-schedule">
                ${scheduleDisplay}
            </div>
            <div class="card-footer">
                <span class="registration-date">
                    Registered on ${new Date(registration.registrationDate).toLocaleDateString()}
                </span>
                ${registration.status !== 'rejected' ?
                `<button class="btn btn-sm btn-danger cancel-btn" data-id="${registration._id}">
                        Cancel Registration
                    </button>` : ''}
            </div>
        `;

        cards.appendChild(card);
    });

    section.appendChild(cards);

    // Add event listeners to cancel buttons
    setTimeout(() => {
        section.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const registrationId = this.getAttribute('data-id');
                cancelRegistration(registrationId);
            });
        });
    }, 0);

    return section;
}

function cancelRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) {
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
                showToast('Registration successfully cancelled', 'success');
                fetchRegistrations(); // Refresh the list
            } else {
                showToast(data.error || 'Failed to cancel registration', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'clock';
        case 'danger': return 'times-circle';
        default: return 'info-circle';
    }
}