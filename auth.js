this.remainingAttempts) return;
        
        if (this.attempts > 0) {
            this.attemptsCounter.style.display = 'block';
            const remaining = AuthConfig.security.maxAttempts - this.attempts;
            this.remainingAttempts.textContent = remaining;
        } else {
            this.attemptsCounter.style.display = 'none';
        }
    }
    
    /**
     * تحديث مؤقت القفل
     */
    updateLockTimer() {
        if (!this.lockTimer) return;
        
        if (this.isLocked()) {
            this.lockTimer.style.display = 'block';
        } else {
            this.lockTimer.style.display = 'none';
        }
    }
    
    /**
     * تعيين حالة الزر
     */
    setButtonState(isLoading, text) {
        if (this.loginButton) {
            this.loginButton.disabled = isLoading;
        }
        
        if (this.buttonText && this.buttonSpinner) {
            this.buttonText.textContent = text;
            this.buttonSpinner.style.display = isLoading ? 'block' : 'none';
        }
    }
    
    /**
     * عرض رسالة الخطأ
     */
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    /**
     * عرض رسالة النجاح
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    /**
     * عرض الرسائل
     */
    showMessage(message, type) {
        if (!this.messageContainer) return;
        
        // تنظيف الرسائل السابقة
        this.messageContainer.innerHTML = '';
        
        // إنشاء عنصر الرسالة
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <i class="message-icon ${type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}"></i>
                <span class="message-text">${message}</span>
            </div>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // إضافة الرسالة
        this.messageContainer.appendChild(messageElement);
        
        // إخفاء الرسالة بعد 5 ثوانٍ للأخطاء
        if (type === 'error') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }
    }
    
    /**
     * عرض رسالة القفل
     */
    showLockMessage() {
        const remainingTime = Math.ceil((this.lockUntil - Date.now()) / 60000); // بالدقائق
        const message = `الحساب مقفل مؤقتًا بسبب كثرة المحاولات الفاشلة. يرجى المحاولة مرة أخرى بعد ${remainingTime} دقيقة.`;
        this.showError(message);
        this.lockTimer.style.display = 'block';
    }
    
    /**
     * مسح الرسائل
     */
    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
    }
    
    /**
     * ملء بيانات الدخول الافتراضية للاختبار
     */
    fillDefaultCredentials() {
        if (this.usernameInput && this.passwordInput) {
            this.usernameInput.value = AuthConfig.defaultCredentials.username;
            this.passwordInput.value = AuthConfig.defaultCredentials.password;
            this.showSuccess('تم تعبئة بيانات الاختبار بنجاح');
        }
    }
    
    /**
     * اهتزاز النموذج
     */
    shakeForm() {
        if (this.loginForm) {
            this.loginForm.classList.add('shake');
            setTimeout(() => {
                this.loginForm.classList.remove('shake');
            }, 500);
        }
    }
    
    /**
     * محاكاة تأخير الشبكة
     */
    simulateNetworkDelay() {
        const delay = Math.random() * 500 + 500; // بين 500-1000 مللي ثانية
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // ------------------------------------------------------------------------
    // طرق التحقق من الجلسة
    // ------------------------------------------------------------------------
    
    /**
     * التحقق من صحة الجلسة
     */
    static validateSession() {
        try {
            const sessionData = localStorage.getItem(AuthConfig.storageKeys.session);
            
            if (!sessionData) {
                return false;
            }
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // التحقق من انتهاء مدة الجلسة
            if (now - session.loginTime > AuthConfig.security.sessionDuration) {
                localStorage.removeItem(AuthConfig.storageKeys.session);
                return false;
            }
            
            // التحقق من وقت عدم النشاط
            if (now - session.lastActivity > AuthConfig.security.inactivityTimeout) {
                localStorage.removeItem(AuthConfig.storageKeys.session);
                return false;
            }
            
            // تحديث وقت النشاط الأخير
            session.lastActivity = now;
            localStorage.setItem(AuthConfig.storageKeys.session, JSON.stringify(session));
            
            return true;
            
        } catch (error) {
            console.error('خطأ في التحقق من الجلسة:', error);
            return false;
        }
    }
    
    /**
     * الحصول على بيانات الجلسة
     */
    static getSessionData() {
        try {
            const sessionData = localStorage.getItem(AuthConfig.storageKeys.session);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('خطأ في الحصول على بيانات الجلسة:', error);
            return null;
        }
    }
    
    /**
     * تسجيل الخروج
     */
    static logout() {
        localStorage.removeItem(AuthConfig.storageKeys.session);
        window.location.href = 'login.html';
    }
    
    /**
     * توجيه المستخدم إذا لم يكن مسجل الدخول
     */
    static redirectIfNotLoggedIn() {
        if (!this.validateSession()) {
            window.location.href = 'login.html';
        }
    }
    
    /**
     * توجيه المستخدم إذا كان مسجل الدخول
     */
    static redirectIfLoggedIn() {
        if (this.validateSession()) {
            window.location.href = 'admin.html';
        }
    }
    
    /**
     * تحديث نشاط المستخدم
     */
    static updateUserActivity() {
        try {
            const sessionData = localStorage.getItem(AuthConfig.storageKeys.session);
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.lastActivity = Date.now();
                localStorage.setItem(AuthConfig.storageKeys.session, JSON.stringify(session));
            }
        } catch (error) {
            console.error('خطأ في تحديث نشاط المستخدم:', error);
        }
    }
    
    /**
     * إعداد مراقبة النشاط
     */
    static setupActivityMonitoring() {
        // تحديث النشاط عند التفاعل مع الصفحة
        ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateUserActivity();
            }, { passive: true });
        });
        
        // التحقق من النشاط بشكل دوري
        setInterval(() => {
            if (!this.validateSession()) {
                window.location.href = 'login.html?reason=inactivity';
            }
        }, 60000); // كل دقيقة
    }
}

// ============================================================================
// فئات الأخطاء المخصصة
// ============================================================================

class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}

// ============================================================================
// تهيئة النظام عند تحميل الصفحة
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // تهيئة نظام المصادقة في صفحة الدخول
    if (window.location.pathname.includes('login.html')) {
        new AuthenticationSystem();
        
        // التحقق إذا كان المستخدم مسجل الدخول بالفعل
        AuthenticationSystem.redirectIfLoggedIn();
    }
    
    // التحقق من الجلسة في الصفحات المحمية
    if (window.location.pathname.includes('admin.html')) {
        AuthenticationSystem.redirectIfNotLoggedIn();
        AuthenticationSystem.setupActivityMonitoring();
        
        // عرض معلومات المستخدم
        const session = AuthenticationSystem.getSessionData();
        if (session) {
            document.getElementById('userName').textContent = session.name;
            document.getElementById('userRole').textContent = session.role;
            
            // إضافة حدث تسجيل الخروج
            const logoutBtn = document.getElementById('logoutButton');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    AuthenticationSystem.logout();
                });
            }
        }
    }
});

// ============================================================================
// التصديرات
// ============================================================================

export { AuthenticationSystem, AuthConfig };
