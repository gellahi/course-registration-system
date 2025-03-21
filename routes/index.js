const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/user');

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

// Student dashboard - protected route
router.get('/student/dashboard', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect('/student/login');
        }
        res.render('student/dashboard', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Admin dashboard - protected route
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

module.exports = router;