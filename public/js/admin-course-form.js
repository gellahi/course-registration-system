document.addEventListener('DOMContentLoaded', function () {
    // Initialize form
    initCourseForm();

    // Fetch prerequisites for the dropdown
    fetchPrerequisites();
});

function initCourseForm() {
    // Set up schedule entry management
    document.getElementById('addScheduleEntry').addEventListener('click', addScheduleEntry);

    // Set up form submission
    document.getElementById('courseForm').addEventListener('submit', submitCourseForm);
}

function addScheduleEntry() {
    const scheduleEntries = document.getElementById('scheduleEntries');
    const entryCount = scheduleEntries.querySelectorAll('.schedule-entry').length;

    const newEntry = document.createElement('div');
    newEntry.className = 'schedule-entry';
    newEntry.innerHTML = `
        <div class="form-row">
            <div class="form-group col-md-3">
                <label for="day-${entryCount}">Day</label>
                <select id="day-${entryCount}" name="schedule[${entryCount}][day]" class="form-control" required>
                    <option value="">Select Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                </select>
            </div>
            <div class="form-group col-md-3">
                <label for="startTime-${entryCount}">Start Time</label>
                <input type="time" id="startTime-${entryCount}" name="schedule[${entryCount}][startTime]" class="form-control" required>
            </div>
            <div class="form-group col-md-3">
                <label for="endTime-${entryCount}">End Time</label>
                <input type="time" id="endTime-${entryCount}" name="schedule[${entryCount}][endTime]" class="form-control" required>
            </div>
            <div class="form-group col-md-3">
                <label for="room-${entryCount}">Room</label>
                <input type="text" id="room-${entryCount}" name="schedule[${entryCount}][room]" class="form-control" required>
            </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline remove-schedule-btn">
            <i class="fas fa-times"></i> Remove
        </button>
    `;

    scheduleEntries.appendChild(newEntry);

    // Add remove functionality
    newEntry.querySelector('.remove-schedule-btn').addEventListener('click', function () {
        scheduleEntries.removeChild(newEntry);
    });
}

function fetchPrerequisites() {
    fetch('/api/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populatePrerequisites(data.courses);
            } else {
                showToast('Failed to load prerequisites', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading prerequisites', 'error');
        });
}

function populatePrerequisites(courses) {
    const prerequisitesSelect = document.getElementById('prerequisites');

    // Add a disabled option at the top to indicate prerequisites are optional
    const defaultOption = document.createElement('option');
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = '-- Prerequisites (Optional) --';
    prerequisitesSelect.appendChild(defaultOption);

    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id;
        option.textContent = `${course.courseCode} - ${course.title}`;
        prerequisitesSelect.appendChild(option);
    });

    // Add a "No prerequisites" message directly in the form
    const prereqHelp = document.createElement('small');
    prereqHelp.className = 'form-text text-muted';
    prereqHelp.textContent = 'Leave empty if the course has no prerequisites.';
    prerequisitesSelect.parentNode.appendChild(prereqHelp);
}

function submitCourseForm(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const courseData = {};

    courseData.prerequisites = [];

    // Convert form data to JSON
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('schedule')) {
            // Handle nested schedule data
            const match = key.match(/schedule\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = match[1];
                const field = match[2];

                if (!courseData.schedule) courseData.schedule = [];
                if (!courseData.schedule[index]) courseData.schedule[index] = {};

                courseData.schedule[index][field] = value;
            }
        } else if (key === 'prerequisites' && value) {
            // Only add non-empty prerequisites
            courseData.prerequisites.push(value);
        } else if (key !== 'prerequisites') {
            courseData[key] = value;
        }
    }

    // Clean up the schedule array (remove empty slots)
    if (courseData.schedule) {
        courseData.schedule = courseData.schedule.filter(Boolean);
    }

    // Convert numeric fields
    courseData.level = parseInt(courseData.level);
    courseData.creditHours = parseInt(courseData.creditHours);
    courseData.totalSeats = parseInt(courseData.totalSeats);
    courseData.availableSeats = courseData.totalSeats;

    // Submit the data
    fetch('/api/courses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(courseData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Course created successfully', 'success');
                // Redirect to courses page after a delay
                setTimeout(() => {
                    window.location.href = '/admin/courses';
                }, 1500);
            } else {
                showToast(data.error || 'Failed to create course', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}