document.addEventListener('DOMContentLoaded', function () {
    fetchStudentSchedule();
});

function fetchStudentSchedule() {
    // Fetch registered courses with their schedule information
    fetch('/api/registrations/my', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderSchedule(data.registrations);
                createLegend(data.registrations);
            } else {
                showToast('Failed to load your schedule', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading your schedule', 'error');
        });
}

function renderSchedule(registrations) {
    // Get approved registrations only
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');

    if (approvedRegistrations.length === 0) {
        const container = document.querySelector('.schedule-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No scheduled courses</h3>
                    <p>You don't have any scheduled courses yet. Browse courses to register.</p>
                    <a href="/student/courses" class="btn btn-primary">Browse Courses</a>
                </div>
            `;
        }
        return;
    }

    // Create an array of colors to cycle through
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

    // Clear existing content
    document.querySelectorAll('.day-content').forEach(el => {
        el.innerHTML = '';
    });

    // Add time grid lines
    const timePoints = [];
    for (let hour = 8; hour <= 20; hour++) {
        timePoints.push(hour * 60); // Convert to minutes
    }

    document.querySelectorAll('.day-content').forEach(dayContent => {
        timePoints.forEach(timePoint => {
            const line = document.createElement('div');
            line.className = 'time-grid-line';
            line.style.top = `${(timePoint - 8 * 60) / (12 * 60) * 100}%`;
            dayContent.appendChild(line);
        });
    });

    // Render each course slot
    approvedRegistrations.forEach(reg => {
        const course = reg.course;

        course.schedule.forEach(slot => {
            const dayId = `${slot.day.toLowerCase()}-content`;
            const dayContent = document.getElementById(dayId);

            if (!dayContent) return;

            // Calculate position and height
            const startMinutes = convertTimeToMinutes(slot.startTime);
            const endMinutes = convertTimeToMinutes(slot.endTime);

            const topPercentage = ((startMinutes - 8 * 60) / (12 * 60)) * 100;
            const heightPercentage = ((endMinutes - startMinutes) / (12 * 60)) * 100;

            // Create course slot element
            const courseSlot = document.createElement('div');
            courseSlot.className = `course-slot ${courseColors[course._id]}`;
            courseSlot.style.top = `${topPercentage}%`;
            courseSlot.style.height = `${heightPercentage}%`;

            courseSlot.innerHTML = `
                <div class="course-slot-header">${course.courseCode}</div>
                <div class="course-slot-info">${course.title}</div>
                <div class="course-slot-location">${slot.room}</div>
            `;

            // Add click event to show more details
            courseSlot.addEventListener('click', function () {
                showCourseDetails(course, slot);
            });

            dayContent.appendChild(courseSlot);
        });
    });
}

function createLegend(registrations) {
    const legendContainer = document.getElementById('scheduleLegend');
    legendContainer.innerHTML = '';

    // Get approved registrations only
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');

    // Create an array of colors to cycle through
    const colors = [
        'course-color-1', 'course-color-2', 'course-color-3',
        'course-color-4', 'course-color-5', 'course-color-6',
        'course-color-7', 'course-color-8'
    ];

    approvedRegistrations.forEach((reg, index) => {
        const course = reg.course;
        const color = colors[index % colors.length];

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color ${color}"></div>
            <div class="legend-text">${course.courseCode} - ${course.title}</div>
        `;

        legendContainer.appendChild(legendItem);
    });
}

function showCourseDetails(course, slot) {
    // You can implement a modal or tooltip to show course details
    alert(`
        Course: ${course.courseCode} - ${course.title}
        Time: ${slot.startTime} - ${slot.endTime}
        Room: ${slot.room}
        Credit Hours: ${course.creditHours}
    `);
}

function convertTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}