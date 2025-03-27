const Registration = require('../models/registration');
const Course = require('../models/course');

// @desc    Get current session info
// @route   GET /api/config/session
// @access  Private
exports.getCurrentSession = async (req, res) => {
    try {
        // This could come from a database in a real application
        // For now, we'll use the current date to determine the session
        const currentDate = new Date();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        let session;
        if (month >= 0 && month <= 4) {  // January to May
            session = `Spring ${year}`;
        } else if (month >= 5 && month <= 7) {  // June to August
            session = `Summer ${year}`;
        } else {  // September to December
            session = `Fall ${year}`;
        }

        res.json({
            success: true,
            session: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get deadlines
// @route   GET /api/config/deadlines
// @access  Private
exports.getDeadlines = async (req, res) => {
    try {
        // In a real application, these would come from a database
        const deadlines = [
            {
                id: 1,
                title: 'Registration Deadline',
                description: 'Last day to register for courses',
                date: '2023-05-15'
            },
            {
                id: 2,
                title: 'Drop/Add Period Ends',
                description: 'Last day to modify your course schedule',
                date: '2023-06-01'
            },
            {
                id: 3,
                title: 'Withdrawal Deadline',
                description: 'Last day to withdraw from courses',
                date: '2023-07-15'
            }
        ];

        // Sort deadlines by date (nearest first)
        deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Get only future deadlines
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const futureDeadlines = deadlines.filter(deadline =>
            new Date(deadline.date) >= currentDate
        );

        res.json({
            success: true,
            deadlines: futureDeadlines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get system alerts
// @route   GET /api/config/alerts
// @access  Private/Admin
exports.getSystemAlerts = async (req, res) => {
    try {
        const alerts = [];

        // Check for prerequisite issues
        const prerequisiteIssues = await Registration.countDocuments({
            status: 'approved',
            hasPrerequisiteIssue: true
        });

        if (prerequisiteIssues > 0) {
            alerts.push({
                id: 1,
                type: 'warning',
                title: 'Prerequisite Issues Detected',
                description: `${prerequisiteIssues} students are registered for courses without completing prerequisites.`,
                link: '/admin/reports',
                linkText: 'View Report'
            });
        }

        // Check for courses with low available seats
        const lowSeatsCourses = await Course.countDocuments({
            availableSeats: { $lte: 5, $gt: 0 }
        });

        if (lowSeatsCourses > 0) {
            alerts.push({
                id: 2,
                type: 'warning',
                title: 'Courses With Low Seats',
                description: `${lowSeatsCourses} courses have 5 or fewer seats available.`,
                link: '/admin/courses',
                linkText: 'Manage Courses'
            });
        }

        // Check for pending registrations
        const pendingRegistrations = await Registration.countDocuments({
            status: 'pending'
        });

        if (pendingRegistrations > 0) {
            alerts.push({
                id: 3,
                type: 'info',
                title: 'Pending Registrations',
                description: `${pendingRegistrations} course registrations need your approval.`,
                link: '/admin/registrations',
                linkText: 'View Registrations'
            });
        }

        // Add information about current registration period
        const currentDate = new Date();
        const registrationEndDate = new Date(currentDate);
        registrationEndDate.setDate(registrationEndDate.getDate() + 30); // 30 days from now

        alerts.push({
            id: 4,
            type: 'info',
            title: 'Registration Period Active',
            description: `The course registration period is open until ${registrationEndDate.toLocaleDateString()}.`
        });

        res.json({
            success: true,
            alerts: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};