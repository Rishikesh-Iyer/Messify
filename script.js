document.addEventListener('DOMContentLoaded', function() {
    
    const isAuthPage = document.getElementById('login-form') !== null;
    const isFeedbackPage = document.getElementById('feedback-form') !== null;

   
    if (isAuthPage) {
        
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
        
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (email && password) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', email);
                window.location.href = 'feedback.html';
            } else {
                alert('Please fill in all fields');
            }
        });
        
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            if (!name || !email || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            window.location.href = 'feedback.html';
        });
        
        
        document.querySelectorAll('.google-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userName', 'Google User');
                localStorage.setItem('userEmail', 'googleuser@example.com');
                window.location.href = 'feedback.html';
            });
        });
        
        // Check if user is already authenticated
        if (localStorage.getItem('isAuthenticated')) {
            window.location.href = 'feedback.html';
        }
    }

    // Feedback Page Functionality
    if (isFeedbackPage) {
        // Check authentication
        if (!localStorage.getItem('isAuthenticated')) {
            window.location.href = 'index.html';
            return;
        }

        // Set student name if available
        const userName = localStorage.getItem('userName');
        if (userName) {
            document.getElementById('student-name').value = userName;
        }

        // Form submission
        document.getElementById('feedback-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect all form data
            const formData = {
                regNumber: document.getElementById('reg-number').value,
                name: document.getElementById('student-name').value,
                blockRoom: document.getElementById('block-room').value,
                messName: document.getElementById('mess-name').value,
                messType: document.querySelector('input[name="mess-type"]:checked').value,
                categories: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value),
                suggestion: document.getElementById('suggestions').value,
                comments: document.getElementById('comments').value,
                proof: document.getElementById('proof').files[0]?.name || 'None'
            };
            
            console.log('Form submitted:', formData);
            alert('Thank you for your feedback!');
        });

        // Logout functionality
        document.getElementById('logout-btn').addEventListener('click', function() {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            window.location.href = 'index.html';
        });
        document.getElementById('feedback-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect all form data including ratings
            const formData = {
                // ... other form data ...
                ratings: {
                    quality: document.querySelector('input[name="quality"]:checked')?.value,
                    quantity: document.querySelector('input[name="quantity"]:checked')?.value,
                    hygiene: document.querySelector('input[name="hygiene"]:checked')?.value,
                    timing: document.querySelector('input[name="timing"]:checked')?.value,
                    overall: document.querySelector('input[name="overall"]:checked')?.value
                }
            };
            
            console.log('Form submitted with ratings:', formData);
            alert('Thank you for your feedback and ratings!');
        });
    }
});