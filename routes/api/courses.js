const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/courseController');
const { protect, admin } = require('../../middleware/auth');

// Get all courses / create new course
router.route('/')
    .get(courseController.getCourses)
    .post(protect, admin, courseController.createCourse);

router.get('/count', courseController.getCourseCount);

router.post('/check-conflicts', protect, courseController.checkConflicts);

// Get, update, delete course by ID
router.route('/:id')
    .get(courseController.getCourseById)
    .put(protect, admin, courseController.updateCourse)
    .delete(protect, admin, courseController.deleteCourse);

// Subscribe to course notifications
router.post('/:id/subscribe', protect, courseController.subscribeToCourse);

module.exports = router;