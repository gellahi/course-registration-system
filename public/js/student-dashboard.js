document.addEventListener('DOMContentLoaded', function () {
    // Fetch dashboard data
    fetchDashboardStats();

    // Fetch recent registrations
    fetchRecentRegistrations();

    // Initialize dashboard schedule
    initializeSchedule();
});

// Fetch course count and credit hours
function fetchDashboardStats() {
    // In a real implementation, this would be an API call
    // For demo purposes, we'll use setTimeout to simulate an API call
    setTimeout(() => {
        document.getElementById('courseCount').textContent = '5';
        document.getElementById('creditHours').textContent = '16';
    }, 1000);
}

// Fetch recent course registrations
function fetchRecentRegistrations() {
    // Simulate API call with setTimeout
    setTimeout(() => {
        const container = document.getElementById('recentRegistrations');

        // Sample data
        const registrations = [
            { courseCode: 'CSE301', courseName: 'Database Systems', status: 'approved', date: '2023-05-10' },
            { courseCode: 'CSE401', courseName: 'Artificial Intelligence', status: 'pending', date: '2023-05-09' },
            { courseCode: 'MTH201', courseName: 'Calculus II', status: 'approved', date: '2023-05-08' }
        ];

        // Clear loading spinner
        container.innerHTML = '';

        registrations.forEach(reg => {
            const regItem = document.createElement('div');
            regItem.className = 'registration-item';

            const statusClass = `status-${reg.status}`;

            regItem.innerHTML = `
                <div class="course-code">${reg.courseCode}</div>
                <div class="registration-details">
                    <h4>${reg.courseName}</h4>
                    <p>Registered on ${new Date(reg.date).toLocaleDateString()}</p>
                </div>
                <span class="registration-status ${statusClass}">${reg.status}</span>
            `;

            container.appendChild(regItem);
        });
    }, 1500);
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