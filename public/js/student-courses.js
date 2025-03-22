document.addEventListener('DOMContentLoaded', function () {
    // Initialize filters
    setupFilters();

    // Fetch courses
    fetchCourses();
});

function setupFilters() {
    // Get filter elements
    const departmentFilter = document.getElementById('departmentFilter');
    const levelFilter = document.getElementById('levelFilter');
    const dayFilter = document.getElementById('dayFilter');
    const seatsFilter = document.getElementById('seatsFilter');
    const resetButton = document.getElementById('resetFilters');

    // Add event listeners
    [departmentFilter, levelFilter, dayFilter, seatsFilter].forEach(filter => {
        filter.addEventListener('change', fetchCourses);
    });

    // Reset filters
    resetButton.addEventListener('click', function () {
        departmentFilter.value = '';
        levelFilter.value = '';
        dayFilter.value = '';
        seatsFilter.value = '0';
        fetchCourses();
    });
}

function fetchCourses() {
    // Show loading
    document.getElementById('coursesLoading').style.display = 'flex';
    document.getElementById('coursesGrid').innerHTML = '';

    // Get filter values
    const department = document.getElementById('departmentFilter').value;
    const level = document.getElementById('levelFilter').value;
    const day = document.getElementById('dayFilter').value;
    const minSeats = document.getElementById('seatsFilter').value === '1' ? 1 : 0;

    // Build query string
    let queryParams = [];
    if (department) queryParams.push(`department=${department}`);
    if (level) queryParams.push(`level=${level}`);
    if (day) queryParams.push(`day=${day}`);
    if (minSeats > 0) queryParams.push(`minSeats=${minSeats}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Fetch courses from API
    fetch(`/api/courses${queryString}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            document.getElementById('coursesLoading').style.display = 'none';

            if (data.success) {
                renderCourses(data.courses);
            } else {
                showToast('Failed to load courses', 'error');
            }
        })
        .catch(error => {
            document.getElementById('coursesLoading').style.display = 'none';
            console.error('Error:', error);
            showToast('An error occurred while loading courses', 'error');
        });
}

function renderCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');

    if (courses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No courses found</h3>
                <p>Try adjusting your filters to find available courses.</p>
            </div>
        `;
        return;
    }

    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';

        // Format schedule for display
        const scheduleDisplay = course.schedule.map(slot =>
            `${slot.day} ${slot.startTime}-${slot.endTime} (${slot.room})`
        ).join('<br>');

        // Format prerequisites for display
        let prerequisitesDisplay = 'None';
        if (course.prerequisites && course.prerequisites.length > 0) {
            prerequisitesDisplay = course.prerequisites.map(prereq =>
                `<span class="prerequisite-tag">${prereq.courseCode}</span>`
            ).join(' ');
        }

        courseCard.innerHTML = `
            <div class="course-header">
                <h3>${course.courseCode}</h3>
                <span class="credit-hours">${course.creditHours} CR</span>
            </div>
            <h4>${course.title}</h4>
            <div class="course-details">
                <div class="course-detail">
                    <i class="fas fa-building"></i> ${course.department}
                </div>
                <div class="course-detail">
                    <i class="fas fa-layer-group"></i> ${course.level} Level
                </div>
                <div class="course-detail">
                    <i class="fas fa-users"></i> 
                    <span class="${course.availableSeats === 0 ? 'no-seats' : ''}">${course.availableSeats}</span>/${course.totalSeats} Seats
                </div>
            </div>
            <div class="course-schedule">
                <h5><i class="fas fa-calendar-alt"></i> Schedule</h5>
                <p>${scheduleDisplay}</p>
            </div>
            <div class="course-prerequisites">
                <h5><i class="fas fa-project-diagram"></i> Prerequisites</h5>
                <p>${prerequisitesDisplay}</p>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary view-course-btn" data-id="${course._id}">
                    View Details
                </button>
                <button class="btn btn-outline register-course-btn ${course.availableSeats === 0 ? 'disabled' : ''}" 
                    data-id="${course._id}" ${course.availableSeats === 0 ? 'disabled' : ''}>
                    ${course.availableSeats === 0 ? 'No Seats' : 'Register'}
                </button>
            </div>
        `;

        coursesGrid.appendChild(courseCard);
    });

    // Add event listeners for buttons
    document.querySelectorAll('.view-course-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            viewCourseDetails(courseId);
        });
    });

    document.querySelectorAll('.register-course-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function () {
            const courseId = this.getAttribute('data-id');
            registerForCourse(courseId);
        });
    });
}

function viewCourseDetails(courseId) {
    // Fetch course details and display in a modal
    fetch(`/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show course details in a modal
                alert(`Course: ${data.course.courseCode} - ${data.course.title}\n` +
                    `Department: ${data.course.department}\n` +
                    `Level: ${data.course.level}\n` +
                    `Credit Hours: ${data.course.creditHours}\n` +
                    `Available Seats: ${data.course.availableSeats}/${data.course.totalSeats}\n\n` +
                    `Description: ${data.course.description || 'No description provided'}`);
            } else {
                showToast('Failed to load course details', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function registerForCourse(courseId) {
    // Register for course
    fetch('/api/registrations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Successfully registered for course!', 'success');
                // Refresh courses to update available seats
                fetchCourses();
            } else {
                showToast(data.error || 'Registration failed', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}