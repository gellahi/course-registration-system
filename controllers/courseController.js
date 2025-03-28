const Course = require('../models/course');
const User = require('../models/user');

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
        res.status(201).json({ success: true, course: createdCourse });
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

        Object.keys(req.body).forEach(key => {
            course[key] = req.body[key];
        });

        const updatedCourse = await course.save();
        res.json({ success: true, course: updatedCourse });
    } catch (error) {
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