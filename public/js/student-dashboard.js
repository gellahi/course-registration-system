// Add these functions and call them in the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard data
    fetchDashboardStats();

    // Fetch current session
    fetchCurrentSession();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Fetch deadlines
    fetchDeadlines();

    // Initialize dashboard schedule
    initializeSchedule();
});

// Add this function to fetch current session
function fetchCurrentSession() {
    fetch('/api/config/session', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('currentSession').textContent = data.session;
            } else {
                document.getElementById('currentSession').textContent = 'Unknown';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('currentSession').textContent = 'Unknown';
        });
}

// Add this function to fetch deadlines
function fetchDeadlines() {
    fetch('/api/config/deadlines', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('deadlinesList');

            if (data.success && data.deadlines.length > 0) {
                container.innerHTML = '';

                // Display up to 3 deadlines
                const displayDeadlines = data.deadlines.slice(0, 3);

                displayDeadlines.forEach(deadline => {
                    const date = new Date(deadline.date);
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    const deadlineItem = document.createElement('div');
                    deadlineItem.className = 'deadline-item';
                    deadlineItem.innerHTML = `
                    <div class="deadline-date">
                        <span class="month">${monthNames[date.getMonth()]}</span>
                        <span class="day">${date.getDate()}</span>
                    </div>
                    <div class="deadline-content">
                        <h4>${deadline.title}</h4>
                        <p>${deadline.description}</p>
                    </div>
                `;

                    container.appendChild(deadlineItem);
                });
            } else {
                container.innerHTML = `
                <div class="empty-state-small">
                    <p>No upcoming deadlines</p>
                </div>
            `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('deadlinesList').innerHTML = `
            <div class="error-state">
                <p>Failed to load deadlines</p>
            </div>
        `;
        });
}

// Replace the fetchDashboardStats function
function fetchDashboardStats() {
    fetch('/api/registrations/my', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Filter out registrations with missing course data
                const validRegistrations = data.registrations.filter(reg => reg.course != null);

                // Count approved registrations
                const approvedRegistrations = validRegistrations.filter(reg => reg.status === 'approved');
                document.getElementById('courseCount').textContent = approvedRegistrations.length;

                // Calculate total credit hours
                const totalCredits = approvedRegistrations.reduce((total, reg) =>
                    total + (reg.course ? reg.course.creditHours : 0), 0);
                document.getElementById('creditHours').textContent = totalCredits;
            } else {
                showToast('Failed to load dashboard stats', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading dashboard stats', 'error');
        });
}

// Replace the fetchRecentRegistrations function
function fetchRecentRegistrations() {
    const container = document.getElementById('recentRegistrations');

    // Show loading indicator
    container.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p>Loading registrations...</p>
        </div>
    `;

    fetch('/api/registrations/my', {
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
                // Filter out registrations with null course data
                const validRegistrations = data.registrations.filter(reg => reg.course != null);

                if (validRegistrations.length === 0) {
                    container.innerHTML = `
                    <div class="empty-state-small">
                        <p>No valid registrations found</p>
                        <a href="/student/courses" class="btn btn-sm btn-outline">Browse Courses</a>
                    </div>
                `;
                    return;
                }

                // Sort by registration date (most recent first)
                const sortedRegistrations = validRegistrations
                    .slice()
                    .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
                    .slice(0, 3); // Take only the 3 most recent

                sortedRegistrations.forEach(reg => {
                    const regItem = document.createElement('div');
                    regItem.className = 'registration-item';

                    const statusClass = `status-${reg.status}`;

                    regItem.innerHTML = `
                    <div class="course-code">${reg.course.courseCode}</div>
                    <div class="registration-details">
                        <h4>${reg.course.title}</h4>
                        <p>Registered on ${new Date(reg.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <span class="registration-status ${statusClass}">${reg.status}</span>
                `;

                    container.appendChild(regItem);
                });
            } else {
                container.innerHTML = `
                <div class="empty-state-small">
                    <p>No registrations found</p>
                    <a href="/student/courses" class="btn btn-sm btn-outline">Browse Courses</a>
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


// Replace the initializeSchedule function with this improved version
function initializeSchedule() {
    const scheduleContainer = document.getElementById('dashboardSchedule');

    // Show loading state
    scheduleContainer.innerHTML = `
        <div class="schedule-loading">
            <div class="spinner"></div>
            <p>Loading your schedule...</p>
        </div>
    `;

    // Fetch registrations
    fetch('/api/registrations/my', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success || data.registrations.length === 0) {
                scheduleContainer.innerHTML = `
                <div class="empty-schedule-message">
                    <p>You have no courses scheduled yet.</p>
                    <a href="/student/courses" class="btn btn-sm btn-outline">Browse Courses</a>
                </div>
            `;
                return;
            }

            // Get approved registrations only
            const approvedRegistrations = data.registrations.filter(reg => reg.status === 'approved');

            if (approvedRegistrations.length === 0) {
                scheduleContainer.innerHTML = `
                <div class="empty-schedule-message">
                    <p>You have no approved course registrations yet.</p>
                    <a href="/student/courses" class="btn btn-sm btn-outline">Browse Courses</a>
                </div>
            `;
                return;
            }

            // Create an array of colors to cycle through - same as in schedule.js
            const colors = [
                'course-color-1', 'course-color-2', 'course-color-3',
                'course-color-4', 'course-color-5', 'course-color-6',
                'course-color-7', 'course-color-8'
            ];

            // Map each course to a color
            const courseColors = {};
            approvedRegistrations.forEach((reg, index) => {
                courseColors[reg.course._id] = colors[index % colors.length];
            });

            // Create a mini version of the weekly calendar
            scheduleContainer.innerHTML = `
            <div class="mini-weekly-calendar">
                <div class="mini-day-column">
                    <div class="mini-day-header">Mon</div>
                    <div class="mini-day-content" id="mini-monday-content"></div>
                </div>
                <div class="mini-day-column">
                    <div class="mini-day-header">Tue</div>
                    <div class="mini-day-content" id="mini-tuesday-content"></div>
                </div>
                <div class="mini-day-column">
                    <div class="mini-day-header">Wed</div>
                    <div class="mini-day-content" id="mini-wednesday-content"></div>
                </div>
                <div class="mini-day-column">
                    <div class="mini-day-header">Thu</div>
                    <div class="mini-day-content" id="mini-thursday-content"></div>
                </div>
                <div class="mini-day-column">
                    <div class="mini-day-header">Fri</div>
                    <div class="mini-day-content" id="mini-friday-content"></div>
                </div>
            </div>
        `;

            // Helper function to convert time to minutes since midnight
            function convertTimeToMinutes(timeString) {
                const [hours, minutes] = timeString.split(':').map(Number);
                return hours * 60 + minutes;
            }

            // Render each course slot
            approvedRegistrations.forEach(reg => {
                const course = reg.course;

                course.schedule.forEach(slot => {
                    const dayId = `mini-${slot.day.toLowerCase()}-content`;
                    const dayContent = document.getElementById(dayId);

                    if (!dayContent) return;

                    // Calculate position and height
                    const startMinutes = convertTimeToMinutes(slot.startTime);
                    const endMinutes = convertTimeToMinutes(slot.endTime);

                    // Position calculations - 8am (480) to 8pm (1200) - 720 minutes range
                    const startPosition = ((startMinutes - 480) / 720) * 100;
                    const height = ((endMinutes - startMinutes) / 720) * 100;

                    // Create course slot element
                    const courseSlot = document.createElement('div');
                    courseSlot.className = `mini-course-slot ${courseColors[course._id]}`;
                    courseSlot.style.top = `${startPosition}%`;
                    courseSlot.style.height = `${height}%`;

                    courseSlot.innerHTML = `
                    <div class="mini-course-code">${course.courseCode}</div>
                `;

                    // Add tooltip with more details
                    courseSlot.title = `${course.courseCode} - ${course.title}\n${slot.startTime} - ${slot.endTime} in ${slot.room}`;

                    dayContent.appendChild(courseSlot);
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            scheduleContainer.innerHTML = `
            <div class="error-state">
                <p>Failed to load schedule</p>
            </div>
        `;
        });
}