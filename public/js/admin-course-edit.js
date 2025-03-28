document.addEventListener('DOMContentLoaded', function () {
    // Initialize form
    initCourseEditForm();

    // Fetch prerequisites for the dropdown and populate existing ones
    fetchPrerequisites();

    // Populate existing schedule entries
    populateScheduleEntries();

    // Set up checkbox for prerequisites
    setupPrerequisitesCheckbox();
});

function initCourseEditForm() {
    // Set up schedule entry management
    document.getElementById('addScheduleEntry').addEventListener('click', addScheduleEntry);

    // Set up form submission
    document.getElementById('courseForm').addEventListener('submit', submitCourseForm);
}

function setupPrerequisitesCheckbox() {
    const hasPrerequisitesCheckbox = document.getElementById('hasPrerequisites');
    const prerequisitesContainer = document.getElementById('prerequisitesContainer');

    // We'll check if there are selected prerequisites and update the checkbox accordingly
    const courseId = document.getElementById('courseForm').getAttribute('data-course-id');

    fetch(`/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(courseData => {
            if (courseData.success) {
                const hasExistingPrereqs = courseData.course.prerequisites &&
                    courseData.course.prerequisites.length > 0;

                // Set checkbox based on existing prerequisites
                hasPrerequisitesCheckbox.checked = hasExistingPrereqs;
                prerequisitesContainer.style.display = hasExistingPrereqs ? 'block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error checking prerequisites:', error);
        });

    // Add event listener for checkbox changes
    hasPrerequisitesCheckbox.addEventListener('change', function () {
        prerequisitesContainer.style.display = this.checked ? 'block' : 'none';

        // Clear selections when hiding
        if (!this.checked) {
            const prerequisitesSelect = document.getElementById('prerequisites');
            if (prerequisitesSelect) {
                for (let i = 0; i < prerequisitesSelect.options.length; i++) {
                    prerequisitesSelect.options[i].selected = false;
                }
            }
        }
    });
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
    const courseId = document.getElementById('courseForm').getAttribute('data-course-id');

    fetch('/api/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populatePrerequisites(data.courses, courseId);
            } else {
                showToast('Failed to load prerequisites', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading prerequisites', 'error');
        });
}

function populatePrerequisites(courses, currentCourseId) {
    const prerequisitesSelect = document.getElementById('prerequisites');
    const prerequisitesContainer = document.getElementById('prerequisitesContainer');
    const hasPrerequisitesCheckbox = document.getElementById('hasPrerequisites');
    const prerequisitesHelp = document.getElementById('prerequisitesHelp');

    // Clear existing options
    prerequisitesSelect.innerHTML = '';

    // Filter out the current course - can't be its own prerequisite
    const availableCourses = courses.filter(course => course._id !== currentCourseId);

    if (availableCourses.length === 0) {
        // No courses available for prerequisites
        prerequisitesHelp.textContent = 'No courses available to set as prerequisites.';
        hasPrerequisitesCheckbox.disabled = true;
        return;
    }

    // Get current course prerequisites
    fetch(`/api/courses/${currentCourseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(courseData => {
            if (courseData.success) {
                const currentPrereqs = courseData.course.prerequisites.map(prereq =>
                    typeof prereq === 'object' ? prereq._id : prereq
                );

                // Add options for all courses except the current one
                availableCourses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course._id;
                    option.textContent = `${course.courseCode} - ${course.title}`;

                    // Check if this course is already a prerequisite
                    if (currentPrereqs.includes(course._id)) {
                        option.selected = true;
                    }

                    prerequisitesSelect.appendChild(option);
                });
            } else {
                showToast('Failed to load course prerequisites', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading course prerequisites', 'error');
        });
}

function populateScheduleEntries() {
    const courseId = document.getElementById('courseForm').getAttribute('data-course-id');
    const scheduleEntries = document.getElementById('scheduleEntries');

    // Fetch course details to get schedule
    fetch(`/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.course.schedule) {
                // Clear any existing entries
                scheduleEntries.innerHTML = '';

                // Add each schedule entry
                data.course.schedule.forEach((slot, index) => {
                    const entry = document.createElement('div');
                    entry.className = 'schedule-entry';
                    entry.innerHTML = `
                        <div class="form-row">
                            <div class="form-group col-md-3">
                                <label for="day-${index}">Day</label>
                                <select id="day-${index}" name="schedule[${index}][day]" class="form-control" required>
                                    <option value="">Select Day</option>
                                    <option value="Monday" ${slot.day === 'Monday' ? 'selected' : ''}>Monday</option>
                                    <option value="Tuesday" ${slot.day === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                                    <option value="Wednesday" ${slot.day === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                                    <option value="Thursday" ${slot.day === 'Thursday' ? 'selected' : ''}>Thursday</option>
                                    <option value="Friday" ${slot.day === 'Friday' ? 'selected' : ''}>Friday</option>
                                </select>
                            </div>
                            <div class="form-group col-md-3">
                                <label for="startTime-${index}">Start Time</label>
                                <input type="time" id="startTime-${index}" name="schedule[${index}][startTime]" class="form-control" value="${slot.startTime}" required>
                            </div>
                            <div class="form-group col-md-3">
                                <label for="endTime-${index}">End Time</label>
                                <input type="time" id="endTime-${index}" name="schedule[${index}][endTime]" class="form-control" value="${slot.endTime}" required>
                            </div>
                            <div class="form-group col-md-3">
                                <label for="room-${index}">Room</label>
                                <input type="text" id="room-${index}" name="schedule[${index}][room]" class="form-control" value="${slot.room}" required>
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline remove-schedule-btn">
                            <i class="fas fa-times"></i> Remove
                        </button>
                    `;

                    scheduleEntries.appendChild(entry);

                    // Add remove functionality
                    entry.querySelector('.remove-schedule-btn').addEventListener('click', function () {
                        scheduleEntries.removeChild(entry);
                    });
                });

                // If no schedule entries were found, add an empty one
                if (data.course.schedule.length === 0) {
                    addScheduleEntry();
                }
            } else {
                // Add a default empty schedule entry
                addScheduleEntry();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading course schedule', 'error');
            // Add a default empty schedule entry
            addScheduleEntry();
        });
}

function submitCourseForm(e) {
    e.preventDefault();

    // Get course ID
    const courseId = this.getAttribute('data-course-id');

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
            if (document.getElementById('hasPrerequisites').checked) {
                courseData.prerequisites.push(value);
            }
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

    // Never modify available seats directly, use the controller to handle this
    delete courseData.availableSeats;

    // Submit the data
    fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(courseData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Course updated successfully', 'success');
                // Redirect to courses page after a delay
                setTimeout(() => {
                    window.location.href = '/admin/courses';
                }, 1500);
            } else {
                showToast(data.error || 'Failed to update course', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function showToast(message, type) {
    // Check if Toastify is available
    if (typeof Toastify === 'function') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545'
        }).showToast();
    } else {
        // Fallback to alert
        alert(message);
    }
}