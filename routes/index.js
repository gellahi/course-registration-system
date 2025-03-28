const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/user');
const Course = require('../models/course');
const Registration = require('../models/registration');

// Home page
router.get('/', (req, res) => {
    res.render('index');
});

// Student login page
router.get('/student/login', (req, res) => {
    res.render('student/login');
});

// Admin login page
router.get('/admin/login', (req, res) => {
    res.render('admin/login');
});

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// STUDENT ROUTES
// Student dashboard
router.get('/student/dashboard', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'student') {
            return res.redirect('/student/login');
        }
        res.render('student/dashboard', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Student schedule
router.get('/student/schedule', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'student') {
            return res.redirect('/student/login');
        }
        res.render('student/schedule', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Student courses catalog
router.get('/student/courses', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'student') {
            return res.redirect('/student/login');
        }
        res.render('student/courses', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Student registrations
router.get('/student/registrations', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'student') {
            return res.redirect('/student/login');
        }
        res.render('student/registrations', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ADMIN ROUTES
// Admin dashboard
router.get('/admin/dashboard', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/dashboard', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin courses management
router.get('/admin/courses', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/courses', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin add course form
router.get('/admin/courses/create', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/courses/create', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin edit course form
router.get('/admin/courses/edit/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }

        // Fetch the course to pre-populate the form
        const course = await Course.findById(req.params.id).populate('prerequisites');

        if (!course) {
            return res.status(404).send('Course not found');
        }

        res.render('admin/courses/edit', { user, course });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin students management
router.get('/admin/students', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/students', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin add student form
router.get('/admin/students/create', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/students/create', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin registrations management
router.get('/admin/registrations', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/registrations', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin reports
router.get('/admin/reports', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/admin/login');
        }
        res.render('admin/reports', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;