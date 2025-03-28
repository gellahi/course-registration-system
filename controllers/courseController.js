const Course = require('../models/course');
const User = require('../models/user');

// Add this function at the top of the file
function checkForScheduleConflicts(schedule, excludeCourseId = null) {
    return new Promise(async (resolve) => {
        try {
            const conflictingCourses = [];

            // For each schedule slot, find potential conflicts
            if (schedule && Array.isArray(schedule)) {
                for (const slot of schedule) {
                    // Find courses with the same day and room
                    const coursesWithSameSlot = await Course.find({
                        _id: { $ne: excludeCourseId }, // Exclude current course if editing
                        'schedule.day': slot.day,
                        'schedule.room': slot.room
                    }).select('_id courseCode title schedule');

                    // Check for time overlaps
                    for (const existingCourse of coursesWithSameSlot) {
                        for (const existingSlot of existingCourse.schedule) {
                            if (existingSlot.day === slot.day && existingSlot.room === slot.room) {
                                const slotStart = convertTimeToMinutes(slot.startTime);
                                const slotEnd = convertTimeToMinutes(slot.endTime);
                                const existingStart = convertTimeToMinutes(existingSlot.startTime);
                                const existingEnd = convertTimeToMinutes(existingSlot.endTime);

                                // Check for overlap
                                if ((slotStart >= existingStart && slotStart < existingEnd) ||
                                    (slotEnd > existingStart && slotEnd <= existingEnd) ||
                                    (slotStart <= existingStart && slotEnd >= existingEnd)) {

                                    conflictingCourses.push({
                                        course: existingCourse,
                                        slot: existingSlot,
                                        conflictsWith: slot
                                    });
                                }
                            }
                        }
                    }
                }
            }

            resolve(conflictingCourses);
        } catch (error) {
            console.error('Error checking schedule conflicts:', error);
            resolve([]);
        }
    });
}

function convertTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        // Build filter object based on query params
        const filter = {};
        const { department, level, day, minSeats } = req.query;

        if (department) {
            filter.department = department;
        }

        if (level) {
            filter.level = level;
        }

        if (day) {
            filter.schedule = { $elemMatch: { day } };
        }

        if (minSeats) {
            filter.availableSeats = { $gte: parseInt(minSeats) };
        }

        const courses = await Course.find(filter).populate('prerequisites');

        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('prerequisites');

        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
    try {
        const {
            courseCode,
            title,
            department,
            level,
            description,
            creditHours,
            totalSeats,
            availableSeats,
            schedule,
            prerequisites
        } = req.body;

        // Validate required fields
        if (!courseCode || !title || !department || !level || !creditHours || !totalSeats) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Validate course code format
        if (!/^[A-Z]{2,4}-\d{3,4}$/.test(courseCode)) {
            return res.status(400).json({
                success: false,
                error: 'Course code should be in format DEPT-XXX (e.g., CS-101)'
            });
        }

        // Validate numeric values
        if (parseInt(level) <= 0 || parseInt(creditHours) <= 0 || parseInt(totalSeats) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Level, credit hours, and total seats must be positive numbers'
            });
        }

        // Validate schedule entries
        if (schedule && Array.isArray(schedule)) {
            for (const slot of schedule) {
                if (!slot.day || !slot.startTime || !slot.endTime || !slot.room) {
                    return res.status(400).json({
                        success: false,
                        error: 'Each schedule entry must have day, start time, end time, and room'
                    });
                }
            }
        }

        // Check for duplicate course code
        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                error: 'A course with this course code already exists'
            });
        }

        // Check for schedule conflicts - but don't block creation
        const conflicts = await checkForScheduleConflicts(schedule);

        // Create and save the new course
        const newCourse = new Course({
            courseCode,
            title,
            department,
            level: parseInt(level),
            description,
            creditHours: parseInt(creditHours),
            totalSeats: parseInt(totalSeats),
            availableSeats: availableSeats ? parseInt(availableSeats) : parseInt(totalSeats),
            schedule,
            prerequisites: prerequisites || []
        });

        const createdCourse = await newCourse.save();
        console.log(`New course created: ${createdCourse.courseCode} - ${createdCourse.title}`);
        res.status(201).json({
            success: true,
            course: createdCourse,
            hasConflicts: conflicts.length > 0,
            conflicts: conflicts
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        // Check for schedule conflicts if schedule is being updated
        const conflicts = req.body.schedule ?
            await checkForScheduleConflicts(req.body.schedule, req.params.id) : [];


        // Calculate the difference between old and new total seats
        const oldTotalSeats = course.totalSeats;
        const newTotalSeats = req.body.totalSeats ? parseInt(req.body.totalSeats) : oldTotalSeats;
        const seatsDifference = newTotalSeats - oldTotalSeats;

        // Adjust available seats accordingly
        if (seatsDifference !== 0) {
            const newAvailableSeats = course.availableSeats + seatsDifference;

            // Make sure availableSeats doesn't go negative
            req.body.availableSeats = Math.max(0, newAvailableSeats);

            console.log(`Adjusting seats: old total=${oldTotalSeats}, new total=${newTotalSeats}, old available=${course.availableSeats}, new available=${req.body.availableSeats}`);
        }

        // Update course fields
        Object.keys(req.body).forEach(key => {
            course[key] = req.body[key];
        });

        const updatedCourse = await course.save();
        res.json({
            success: true,
            course: updatedCourse,
            hasConflicts: conflicts.length > 0,
            conflicts: conflicts
        });        // Add this function to handle conflict warnings
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

        // Modify the submitCourseForm function
        function submitCourseForm(e) {
            e.preventDefault();

            // Existing form data preparation code...

            // Modify the fetch call to handle conflicts
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
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Check Conflicts
// @route   POST /api/courses/check-conflicts
// @access  Private/Admin
exports.checkConflicts = async (req, res) => {
    try {
        const { schedule, courseId } = req.body;

        const conflicts = await checkForScheduleConflicts(schedule, courseId);

        res.json({
            success: true,
            hasConflicts: conflicts.length > 0,
            conflicts: conflicts
        });
    } catch (error) {
        console.error('Error checking conflicts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
    try {
        console.log(`Attempting to delete course with ID: ${req.params.id}`);
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        console.log(`Found course to delete: ${course.courseCode} - ${course.title}`);

        // Begin transaction to ensure all operations succeed or fail together
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find all registrations for this course
            const registrations = await Registration.find({ course: req.params.id }).session(session);
            console.log(`Found ${registrations.length} registrations to remove`);

            // Delete all registrations and update user records
            for (const registration of registrations) {
                // Remove registration from user's registeredCourses
                await User.findByIdAndUpdate(
                    registration.student,
                    { $pull: { registeredCourses: registration._id } },
                    { session }
                );

                console.log(`Removed registration ${registration._id} from user ${registration.student}`);

                // Delete the registration
                await Registration.findByIdAndDelete(registration._id).session(session);
            }

            // Remove this course from all courses that have it as a prerequisite
            const updateResult = await Course.updateMany(
                { prerequisites: req.params.id },
                { $pull: { prerequisites: req.params.id } },
                { session }
            );
            console.log(`Removed course as prerequisite from ${updateResult.modifiedCount || 0} other courses`);

            // Finally delete the course
            await Course.findByIdAndDelete(req.params.id).session(session);

            // Commit the transaction
            await session.commitTransaction();
            console.log('Course deletion transaction committed successfully');

            res.json({ success: true, message: 'Course and all related registrations removed' });
        } catch (error) {
            // If an error occurred, abort the transaction
            await session.abortTransaction();
            console.error('Course deletion transaction aborted:', error);
            throw error;
        } finally {
            // End the session
            session.endSession();
        }
    } catch (error) {
        console.error('Error in course deletion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


// @desc    Subscribe to course notifications
// @route   POST /api/courses/:id/subscribe
// @access  Private
exports.subscribeToCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        // Check if user is already subscribed
        if (course.subscribers.includes(req.user._id)) {
            return res.status(400).json({ success: false, error: 'Already subscribed to this course' });
        }

        // Add user to subscribers
        course.subscribers.push(req.user._id);
        await course.save();

        res.json({ success: true, message: 'Subscribed to course successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get course count
// @route   GET /api/courses/count
// @access  Private
exports.getCourseCount = async (req, res) => {
    try {
        // Add console.log to verify the function is being called
        console.log('Getting course count...');

        const count = await Course.countDocuments();
        console.log('Course count:', count);

        res.json({ success: true, count });
    } catch (error) {
        console.error('Error in getCourseCount:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};