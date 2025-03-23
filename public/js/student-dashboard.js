document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard data
    fetchDashboardStats();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Initialize dashboard schedule
    initializeSchedule();
});

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
                // Count approved registrations
                const approvedRegistrations = data.registrations.filter(reg => reg.status === 'approved');
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
    fetch('/api/registrations/my', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('recentRegistrations');
            container.innerHTML = '';

            if (data.success && data.registrations.length > 0) {
                // Sort by registration date (most recent first)
                const sortedRegistrations = data.registrations
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
            console.error('Error:', error);
            document.getElementById('recentRegistrations').innerHTML = `
            <div class="error-state">
                <p>Failed to load registrations</p>
            </div>
        `;
        });
}

// Initialize weekly schedule
function initializeSchedule() {
    // Simulate API call with setTimeout
    setTimeout(() => {
        const scheduleContainer = document.getElementById('dashboardSchedule');

        // Sample schedule data
        const courses = [
            {
                id: 1,
                code: 'CSE301',
                name: 'Database Systems',
                schedule: [
                    { day: 'Monday', startTime: '10:00', endTime: '11:30', room: 'A-101' },
                    { day: 'Wednesday', startTime: '10:00', endTime: '11:30', room: 'A-101' }
                ],
                color: 'course-color-1'
            },
            {
                id: 2,
                code: 'MTH201',
                name: 'Calculus II',
                schedule: [
                    { day: 'Tuesday', startTime: '13:00', endTime: '14:30', room: 'B-203' },
                    { day: 'Thursday', startTime: '13:00', endTime: '14:30', room: 'B-203' }
                ],
                color: 'course-color-2'
            },
            {
                id: 3,
                code: 'CSE401',
                name: 'Artificial Intelligence',
                schedule: [
                    { day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'C-105' },
                    { day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'C-105' }
                ],
                color: 'course-color-3'
            }
        ];

        // Create a simplified weekly calendar view
        scheduleContainer.innerHTML = `
            <div class="simplified-schedule">
                <div class="schedule-day">
                    <div class="day-label">Monday</div>
                    <div class="day-slots" id="monday-slots"></div>
                </div>
                <div class="schedule-day">
                    <div class="day-label">Tuesday</div>
                    <div class="day-slots" id="tuesday-slots"></div>
                </div>
                <div class="schedule-day">
                    <div class="day-label">Wednesday</div>
                    <div class="day-slots" id="wednesday-slots"></div>
                </div>
                <div class="schedule-day">
                    <div class="day-label">Thursday</div>
                    <div class="day-slots" id="thursday-slots"></div>
                </div>
                <div class="schedule-day">
                    <div class="day-label">Friday</div>
                    <div class="day-slots" id="friday-slots"></div>
                </div>
            </div>
        `;

        // Add course slots to days
        courses.forEach(course => {
            course.schedule.forEach(slot => {
                const dayContainer = document.getElementById(`${slot.day.toLowerCase()}-slots`);

                if (dayContainer) {
                    const courseSlot = document.createElement('div');
                    courseSlot.className = `simplified-slot ${course.color}`;
                    courseSlot.innerHTML = `
                        <div class="slot-time">${slot.startTime} - ${slot.endTime}</div>
                        <div class="slot-course">${course.code}</div>
                        <div class="slot-room">${slot.room}</div>
                    `;

                    dayContainer.appendChild(courseSlot);
                }
            });
        });

        // Add styles for simplified schedule
        const style = document.createElement('style');
        style.textContent = `
            .simplified-schedule {
                display: flex;
                width: 100%;
                min-height: 200px;
                overflow-x: auto;
            }
            
            .schedule-day {
                flex: 1;
                min-width: 120px;
                display: flex;
                flex-direction: column;
                border-right: 1px solid var(--gray-200);
            }
            
            .schedule-day:last-child {
                border-right: none;
            }
            
            .day-label {
                padding: 0.75rem;
                text-align: center;
                font-weight: 600;
                background-color: var(--gray-100);
                border-bottom: 1px solid var(--gray-200);
            }
            
            .day-slots {
                flex: 1;
                padding: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .simplified-slot {
                padding: 0.75rem;
                border-radius: var(--border-radius-sm);
                color: white;
            }
            
            .slot-time {
                font-size: 0.75rem;
                margin-bottom: 0.25rem;
            }
            
            .slot-course {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }
            
            .slot-room {
                font-size: 0.75rem;
                opacity: 0.9;
            }
        `;

        document.head.appendChild(style);

    }, 1800);
}