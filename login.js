// login.js
class LoginSystem {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: '123456',
            canChangePassword: true
        };
        
        this.setupLogin();
    }
    
    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // تحقق إذا كان المستخدم مسجل دخول بالفعل
        this.checkLoginStatus();
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password) {
            
            // حفظ حالة تسجيل الدخول
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            
            // توجيه إلى لوحة التحكم
            window.location.href = 'admin.html';
        } else {
            this.showError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }
    
    checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const loginTime = localStorage.getItem('loginTime');
        
        if (isLoggedIn && loginTime) {
            // التحقق من انتهاء الجلسة (24 ساعة)
            const loginDate = new Date(loginTime);
            const currentDate = new Date();
            const hoursDiff = Math.abs(currentDate - loginDate) / 36e5;
            
            if (hoursDiff < 24) {
                // إذا كانت في صفحة login، توجيه إلى admin
                if (window.location.pathname.includes('login.html')) {
                    window.location.href = 'admin.html';
                }
            } else {
                // انتهت الجلسة
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loginTime');
            }
        }
    }
    
    showError(message) {
        // يمكن استبدال هذا بتنبيه أجمل
        alert(`خطأ: ${message}`);
        
        // أو إضافة رسالة خطأ في الواجهة
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        
        const form = document.getElementById('loginForm');
        const existingError = form.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }
        
        form.prepend(errorDiv);
        
        // إزالة الرسالة بعد 5 ثواني
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// تهيئة نظام تسجيل الدخول
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
});
