const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

// Add pre-remove middleware to clean up references when a registration is deleted
RegistrationSchema.pre('remove', async function (next) {
    try {
        // Remove this registration from the user's registeredCourses
        await mongoose.model('User').findByIdAndUpdate(
            this.student,
            { $pull: { registeredCourses: this._id } }
        );
        next();
    } catch (error) {
        next(error);
    }
});

// Add this middleware after the existing pre-remove middleware
RegistrationSchema.pre('find', function (next) {
    // Add a match condition to only find registrations where course exists
    this.populate({
        path: 'course',
        match: { _id: { $exists: true } }
    });
    next();
});

RegistrationSchema.pre('findOne', function (next) {
    // Add a match condition to only find registrations where course exists
    this.populate({
        path: 'course',
        match: { _id: { $exists: true } }
    });
    next();
});

module.exports = mongoose.model('Registration', RegistrationSchema);