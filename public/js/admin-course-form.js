document.addEventListener('DOMContentLoaded', function () {
    // Initialize form
    initCourseForm();

    // Fetch prerequisites for the dropdown
    fetchPrerequisites();

    // Set up checkbox for prerequisites
    setupPrerequisitesCheckbox();
});

function initCourseForm() {
    // Set up schedule entry management
    document.getElementById('addScheduleEntry').addEventListener('click', addScheduleEntry);

    // Set up form submission
    document.getElementById('courseForm').addEventListener('submit', submitCourseForm);
}

function setupPrerequisitesCheckbox() {
    const hasPrerequisitesCheckbox = document.getElementById('hasPrerequisites');
    const prerequisitesContainer = document.getElementById('prerequisitesContainer');

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
    const prerequisitesContainer = document.getElementById('prerequisitesContainer');
    const hasPrerequisitesCheckbox = document.getElementById('hasPrerequisites');
    const prerequisitesHelp = document.getElementById('prerequisitesHelp');

    // Clear existing options
    prerequisitesSelect.innerHTML = '';

    if (!courses || courses.length === 0) {
        // No courses available for prerequisites
        prerequisitesHelp.textContent = 'No courses available to set as prerequisites.';
        hasPrerequisitesCheckbox.disabled = true;
        return;
    }

    // Add options for available courses
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id;
        option.textContent = `${course.courseCode} - ${course.title}`;
        prerequisitesSelect.appendChild(option);
    });

    // Update help text
    prerequisitesHelp.textContent = 'Select one or more courses that must be completed before taking this course.';
}

function showConflictWarning(conflicts) {
    // Create a conflict warning dialog
    const modal = document.createElement('div');
    modal.className = 'modal conflict-warning-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header warning">
                <h3><i class="fas fa-exclamation-triangle"></i> Schedule Conflict Warning</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>This course has scheduling conflicts with existing courses:</p>
                <ul class="conflict-list">
                    ${conflicts.map(conflict => `
                        <li>
                            <strong>${conflict.course.courseCode} - ${conflict.course.title}</strong><br>
                            ${conflict.slot.day} ${conflict.slot.startTime}-${conflict.slot.endTime} in Room ${conflict.slot.room}
                        </li>
                    `).join('')}
                </ul>
                <p class="warning-message">Students will not be able to register for both courses due to the time conflict.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">Cancel</button>
                <button class="btn btn-warning proceed-btn">Create Anyway</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    return new Promise(resolve => {
        // Add event listeners
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const proceedBtn = modal.querySelector('.proceed-btn');

        closeBtn.onclick = cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        proceedBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };
    });
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
    courseData.availableSeats = courseData.totalSeats;

    function submitForm() {
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
                    if (data.hasConflicts) {
                        showToast('Course created with schedule conflicts', 'warning');
                    } else {
                        showToast('Course created successfully', 'success');
                    }

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

    // First check for conflicts, then decide whether to proceed
    fetch('/api/courses/check-conflicts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ schedule: courseData.schedule })
    })
        .then(response => response.json())
        .then(data => {
            if (data.conflicts && data.conflicts.length > 0) {
                // Show warning and proceed only if admin confirms
                showConflictWarning(data.conflicts).then(shouldProceed => {
                    if (shouldProceed) {
                        submitForm();
                    }
                });
            } else {
                // No conflicts, proceed normally
                submitForm();
            }
        })
        .catch(error => {
            console.error('Error checking conflicts:', error);
            // If conflict check fails, proceed anyway
            submitForm();
        });
}