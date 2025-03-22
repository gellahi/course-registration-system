document.addEventListener('DOMContentLoaded', function () {
    // Add event listeners to report buttons
    document.getElementById('courseEnrollmentReportBtn').addEventListener('click', showCourseSelector);
    document.getElementById('availableCoursesReportBtn').addEventListener('click', generateAvailableCoursesReport);
    document.getElementById('prerequisiteIssuesReportBtn').addEventListener('click', generatePrerequisiteIssuesReport);
});

// Show course selector for enrollment report
function showCourseSelector() {
    // Fetch all courses for selection
    fetch('/api/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const courses = data.courses;

                // Create course selection form
                const courseSelector = document.createElement('div');
                courseSelector.className = 'course-selector';
                courseSelector.innerHTML = `
                <h3>Select a Course</h3>
                <select id="courseSelect" class="form-control">
                    <option value="">-- Select Course --</option>
                    ${courses.map(course => `
                        <option value="${course._id}">${course.courseCode} - ${course.title}</option>
                    `).join('')}
                </select>
                <div class="form-actions mt-3">
                    <button id="generateEnrollmentReportBtn" class="btn btn-primary">Generate Report</button>
                    <button id="cancelEnrollmentReportBtn" class="btn btn-outline">Cancel</button>
                </div>
            `;

                // Show selector
                const resultsContainer = document.getElementById('reportResults');
                resultsContainer.innerHTML = '';
                resultsContainer.appendChild(courseSelector);
                resultsContainer.style.display = 'block';

                // Add event listeners
                document.getElementById('generateEnrollmentReportBtn').addEventListener('click', function () {
                    const courseId = document.getElementById('courseSelect').value;
                    if (courseId) {
                        generateCourseEnrollmentReport(courseId);
                    } else {
                        showToast('Please select a course', 'warning');
                    }
                });

                document.getElementById('cancelEnrollmentReportBtn').addEventListener('click', function () {
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                });
            } else {
                showToast(data.error || 'Failed to load courses', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while loading courses', 'error');
        });
}

// Generate course enrollment report
function generateCourseEnrollmentReport(courseId) {
    const resultsContainer = document.getElementById('reportResults');

    // Show loading
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Generating report...</p>
        </div>
    `;

    // Fetch report data
    fetch(`/api/reports/course-enrollment/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const course = data.course;
                const students = data.students;

                // Create report content
                resultsContainer.innerHTML = `
                <div class="report-header">
                    <h2>Course Enrollment Report</h2>
                    <p class="report-subtitle">${course.courseCode} - ${course.title}</p>
                </div>
                
                <div class="report-summary">
                    <div class="summary-item">
                        <span class="summary-label">Total Seats:</span>
                        <span class="summary-value">${course.totalSeats}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Available Seats:</span>
                        <span class="summary-value">${course.availableSeats}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Enrolled Students:</span>
                        <span class="summary-value">${students.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Fill Rate:</span>
                        <span class="summary-value">${Math.round(((course.totalSeats - course.availableSeats) / course.totalSeats) * 100)}%</span>
                    </div>
                </div>
                
                <div class="report-content">
                    <h3>Enrolled Students</h3>
                    ${students.length > 0 ? `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Roll Number</th>
                                    <th>Name</th>
                                    <th>Registration Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${students.map(student => `
                                    <tr>
                                        <td>${student.rollNumber}</td>
                                        <td>${student.name}</td>
                                        <td>${new Date(student.registrationDate).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p class="empty-report">No students are currently enrolled in this course.</p>
                    `}
                </div>
                
                <div class="report-actions">
                    <button id="closeReportBtn" class="btn btn-outline">Close Report</button>
                    <button id="printReportBtn" class="btn btn-primary">Print Report</button>
                </div>
            `;

                // Add event listeners
                document.getElementById('closeReportBtn').addEventListener('click', function () {
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                });

                document.getElementById('printReportBtn').addEventListener('click', function () {
                    window.print();
                });
            } else {
                showToast(data.error || 'Failed to generate report', 'error');
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while generating report', 'error');
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        });
}

// Generate available courses report
function generateAvailableCoursesReport() {
    const resultsContainer = document.getElementById('reportResults');

    // Show loading
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Generating report...</p>
        </div>
    `;
    resultsContainer.style.display = 'block';

    // Fetch report data
    fetch('/api/reports/available-courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const courses = data.courses;

                // Create report content
                resultsContainer.innerHTML = `
                <div class="report-header">
                    <h2>Available Courses Report</h2>
                    <p class="report-subtitle">Courses with available seats</p>
                </div>
                
                <div class="report-content">
                    ${courses.length > 0 ? `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Course Code</th>
                                    <th>Title</th>
                                    <th>Department</th>
                                    <th>Level</th>
                                    <th>Available Seats</th>
                                    <th>Fill Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${courses.map(course => `
                                    <tr>
                                        <td>${course.courseCode}</td>
                                        <td>${course.title}</td>
                                        <td>${course.department}</td>
                                        <td>${course.level}</td>
                                        <td>${course.availableSeats} / ${course.totalSeats}</td>
                                        <td>
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${course.fillingPercentage}%"></div>
                                            </div>
                                            <div class="progress-text">${course.fillingPercentage}%</div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p class="empty-report">No courses with available seats were found.</p>
                    `}
                </div>
                
                <div class="report-actions">
                    <button id="closeReportBtn" class="btn btn-outline">Close Report</button>
                    <button id="printReportBtn" class="btn btn-primary">Print Report</button>
                </div>
            `;

                // Add event listeners
                document.getElementById('closeReportBtn').addEventListener('click', function () {
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                });

                document.getElementById('printReportBtn').addEventListener('click', function () {
                    window.print();
                });
            } else {
                showToast(data.error || 'Failed to generate report', 'error');
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while generating report', 'error');
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        });
}

// Generate prerequisite issues report
function generatePrerequisiteIssuesReport() {
    const resultsContainer = document.getElementById('reportResults');

    // Show loading
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Generating report...</p>
        </div>
    `;
    resultsContainer.style.display = 'block';

    // Fetch report data
    fetch('/api/reports/prerequisite-issues', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const issues = data.issues;

                // Create report content
                resultsContainer.innerHTML = `
                <div class="report-header">
                    <h2>Prerequisite Issues Report</h2>
                    <p class="report-subtitle">Students enrolled in courses without meeting prerequisites</p>
                </div>
                
                <div class="report-summary">
                    <div class="summary-item">
                        <span class="summary-label">Total Issues:</span>
                        <span class="summary-value">${data.issueCount}</span>
                    </div>
                </div>
                
                <div class="report-content">
                    ${issues.length > 0 ? `
                        <div class="issues-list">
                            ${issues.map(issue => `
                                <div class="issue-card">
                                    <div class="issue-header">
                                        <h3>Student: ${issue.student.name} (${issue.student.rollNumber})</h3>
                                        <p>Course: ${issue.course.courseCode} - ${issue.course.title}</p>
                                    </div>
                                    <div class="issue-details">
                                        <h4>Missing Prerequisites:</h4>
                                        <ul>
                                            ${issue.unmetPrerequisites.map(prereq => `
                                                <li>${prereq.courseCode} - ${prereq.title}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="empty-report">No prerequisite issues were found.</p>
                    `}
                </div>
                
                <div class="report-actions">
                    <button id="closeReportBtn" class="btn btn-outline">Close Report</button>
                    <button id="printReportBtn" class="btn btn-primary">Print Report</button>
                </div>
            `;

                // Add event listeners
                document.getElementById('closeReportBtn').addEventListener('click', function () {
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                });

                document.getElementById('printReportBtn').addEventListener('click', function () {
                    window.print();
                });
            } else {
                showToast(data.error || 'Failed to generate report', 'error');
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while generating report', 'error');
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        });
}