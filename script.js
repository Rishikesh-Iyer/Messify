document.addEventListener('DOMContentLoaded', function() {
    const isAuthPage = document.getElementById('login-form') !== null;
    const isFeedbackPage = document.getElementById('feedback-form') !== null;

    // Auth Page Functionality
    if (isAuthPage) {
        // Tab switching
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        
        loginTab.addEventListener('click', function() {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        });
        
        signupTab.addEventListener('click', function() {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        });
        
        // Login Form Submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'feedback.html';
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
        
        // Signup Form Submission
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'feedback.html';
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
        
        // Google Auth (mock)
        document.querySelectorAll('.google-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                alert('Implementation is unfinished.');
            });
        });
    }

    // Feedback Page Functionality
    if (isFeedbackPage) {
        // Check authentication
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || {});
        
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Set student name if available
        if (user.name) {
            document.getElementById('student-name').value = user.name;
        }

        // Form submission
        document.getElementById('feedback-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect form data
            const formData = new FormData();
            formData.append('regNumber', document.getElementById('reg-number').value);
            formData.append('studentName', document.getElementById('student-name').value);
            formData.append('blockRoom', document.getElementById('block-room').value);
            formData.append('messName', document.getElementById('mess-name').value);
            formData.append('messType', document.querySelector('input[name="mess-type"]:checked').value);
            formData.append('qualityRating', document.querySelector('input[name="quality"]:checked').value);
            formData.append('quantityRating', document.querySelector('input[name="quantity"]:checked').value);
            formData.append('hygieneRating', document.querySelector('input[name="hygiene"]:checked').value);
            formData.append('timingRating', document.querySelector('input[name="timing"]:checked').value);
            formData.append('overallRating', document.querySelector('input[name="overall"]:checked').value);
            formData.append('suggestion', document.getElementById('suggestions').value);
            formData.append('comments', document.getElementById('comments').value);
            
            const proofFile = document.getElementById('proof').files[0];
            if (proofFile) {
                formData.append('proof', proofFile);
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Thank you for your feedback!');
                    document.getElementById('feedback-form').reset();
                } else {
                    alert(data.error || 'Failed to submit feedback');
                }
            } catch (error) {
                console.error('Feedback submission error:', error);
                alert('Failed to submit feedback. Please try again.');
            }
        });

        // Logout functionality
        document.getElementById('logout-btn').addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
});