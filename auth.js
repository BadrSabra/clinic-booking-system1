/**
 * نظام المصادقة - عيادة ديرما كير
 * نظام تسجيل الدخول وإدارة الجلسات
 * 
 * @author Badr Aldien
 * @version 1.0.0
 */

// ============================================================================
// إعدادات النظام
// ============================================================================

const AuthConfig = {
    // بيانات تسجيل الدخول الافتراضية
    defaultCredentials: {
        username: 'admin',
        password: '123456',
        name: 'مدير النظام',
        role: 'administrator'
    },
    
    // إعدادات الأمان
    security: {
        maxAttempts: 5,                    // الحد الأقصى لمحاولات الدخول الخاطئة
        lockDuration: 15 * 60 * 1000,      // مدة القفل بالمللي ثانية (15 دقيقة)
        sessionDuration: 24 * 60 * 60 * 1000, // مدة الجلسة (24 ساعة)
        inactivityTimeout: 30 * 60 * 1000   // وقت عدم النشاط (30 دقيقة)
    },
    
    // مفتاح التخزين
    storageKeys: {
        session: 'derma_session',
        attempts: 'login_attempts',
        lock: 'login_lock',
        settings: 'derma_settings'
    }
};

// ============================================================================
// فئة نظام المصادقة الرئيسية
// ============================================================================

class AuthenticationSystem {
    constructor() {
        this.attempts = 0;
        this.lockUntil = 0;
        this.isSubmitting = false;
        
        this.initializeAuth();
        this.setupEventListeners();
        this.loadStoredData();
        this.updateUI();
    }
    
    // ------------------------------------------------------------------------
    // طرق التهيئة
    // ------------------------------------------------------------------------
    
    /**
     * تهيئة النظام
     */
    initializeAuth() {
        this.setupElements();
        this.checkForLock();
    }
    
    /**
     * إعداد العناصر
     */
    setupElements() {
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginButton = document.getElementById('loginButton');
        this.buttonText = document.getElementById('buttonText');
        this.buttonSpinner = document.getElementById('buttonSpinner');
        this.messageContainer = document.getElementById('messageContainer');
        this.attemptsCounter = document.getElementById('attemptsCounter');
        this.lockTimer = document.getElementById('lockTimer');
        this.remainingAttempts = document.getElementById('remainingAttempts');
        this.timerDisplay = document.getElementById('timerDisplay');
    }
    
    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // إدخال سريع للبيانات الافتراضية للاختبار
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') { // Ctrl + D
                e.preventDefault();
                this.fillDefaultCredentials();
            }
        });
    }
    
    /**
     * تحميل البيانات المخزنة
     */
    loadStoredData() {
        try {
            // تحميل عدد المحاولات
            const storedAttempts = localStorage.getItem(AuthConfig.storageKeys.attempts);
            this.attempts = storedAttempts ? parseInt(storedAttempts) : 0;
            
            // تحميل وقت القفل
            const storedLock = localStorage.getItem(AuthConfig.storageKeys.lock);
            this.lockUntil = storedLock ? parseInt(storedLock) : 0;
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات المخزنة:', error);
            this.resetSecurityData();
        }
    }
    
    /**
     * تحديث واجهة المستخدم
     */
    updateUI() {
        this.updateAttemptsCounter();
        this.updateLockTimer();
    }
    
    // ------------------------------------------------------------------------
    // طرق التحكم في النموذج
    // ------------------------------------------------------------------------
    
    /**
     * معالجة تسجيل الدخول
     */
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isSubmitting) return;
        
        // التحقق من القفل
        if (this.isLocked()) {
            this.showLockMessage();
            return;
        }
        
        // التحقق من الحقول
        if (!this.validateForm()) {
            return;
        }
        
        // بدء عملية التسجيل
        this.startLogin();
        
        try {
            // محاكاة تأخير الشبكة
            await this.simulateNetworkDelay();
            
            // محاولة تسجيل الدخول
            const success = this.attemptLogin();
            
            if (success) {
                await this.handleLoginSuccess();
            } else {
                this.handleLoginFailure();
            }
            
        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.endLogin();
        }
    }
    
    /**
     * التحقق من صحة النموذج
     */
    validateForm() {
        const username = this.usernameInput?.value.trim();
        const password = this.passwordInput?.value.trim();
        
        // التحقق من إدخال البيانات
        if (!username || !password) {
            this.showError('يرجى ملء جميع الحقول المطلوبة');
            return false;
        }
        
        // التحقق من طول البيانات
        if (username.length < 3) {
            this.showError('اسم المستخدم يجب أن يكون على الأقل 3 أحرف');
            this.usernameInput.focus();
            return false;
        }
        
        if (password.length < 6) {
            this.showError('كلمة المرور يجب أن تكون على الأقل 6 أحرف');
            this.passwordInput.focus();
            return false;
        }
        
        return true;
    }
    
    /**
     * بدء عملية تسجيل الدخول
     */
    startLogin() {
        this.isSubmitting = true;
        this.setButtonState(true, 'جاري التحقق...');
        this.clearMessages();
    }
    
    /**
     * إنهاء عملية تسجيل الدخول
     */
    endLogin() {
        this.isSubmitting = false;
        this.setButtonState(false, 'تسجيل الدخول');
    }
    
    /**
     * محاولة تسجيل الدخول
     */
    attemptLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        
        // التحقق من بيانات الدخول
        if (username === AuthConfig.defaultCredentials.username && 
            password === AuthConfig.defaultCredentials.password) {
            return true;
        }
        
        return false;
    }
    
    /**
     * معالجة تسجيل الدخول الناجح
     */
    async handleLoginSuccess() {
        // إعادة تعيين بيانات الأمان
        this.resetSecurityData();
        
        // إنشاء جلسة جديدة
        this.createSession();
        
        // عرض رسالة النجاح
        this.showSuccess('تم تسجيل الدخول بنجاح! يتم توجيهك الآن...');
        
        // تأخير بسيط قبل التوجيه
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // توجيه إلى لوحة التحكم
        window.location.href = 'admin.html';
    }
    
    /**
     * معالجة فشل تسجيل الدخول
     */
    handleLoginFailure() {
        // زيادة عدد المحاولات
        this.attempts++;
        this.saveAttempts();
        
        // التحقق من تجاوز الحد
        if (this.attempts >= AuthConfig.security.maxAttempts) {
            this.lockAccount();
            this.showLockMessage();
            return;
        }
        
        // حساب المحاولات المتبقية
        const remaining = AuthConfig.security.maxAttempts - this.attempts;
        
        // عرض رسالة الخطأ
        let errorMessage;
        if (remaining === 1) {
            errorMessage = 'بيانات الدخول غير صحيحة! لديك محاولة واحدة فقط قبل قفل الحساب.';
        } else {
            errorMessage = `بيانات الدخول غير صحيحة! لديك ${remaining} محاولات متبقية.`;
        }
        
        this.showError(errorMessage);
        this.updateAttemptsCounter();
        
        // اهتزاز الحقول
        this.shakeForm();
    }
    
    /**
     * معالجة أخطاء تسجيل الدخول
     */
    handleLoginError(error) {
        console.error('خطأ في تسجيل الدخول:', error);
        
        let errorMessage;
        
        if (error instanceof NetworkError) {
            errorMessage = 'خطأ في الاتصال بالشبكة. يرجى المحاولة مرة أخرى.';
        } else if (error instanceof TimeoutError) {
            errorMessage = 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
        } else {
            errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        }
        
        this.showError(errorMessage);
    }
    
    // ------------------------------------------------------------------------
    // طرق إدارة الجلسات
    // ------------------------------------------------------------------------
    
    /**
     * إنشاء جلسة جديدة
     */
    createSession() {
        const sessionData = {
            username: AuthConfig.defaultCredentials.username,
            name: AuthConfig.defaultCredentials.name,
            role: AuthConfig.defaultCredentials.role,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            userAgent: navigator.userAgent,
            ip: this.getClientIP()
        };
        
        localStorage.setItem(
            AuthConfig.storageKeys.session,
            JSON.stringify(sessionData)
        );
    }
    
    /**
     * الحصول على IP العميل (مثال)
     */
    getClientIP() {
        // في تطبيق حقيقي، يتم الحصول على IP من الخادم
        return 'local'; // للاستخدام المحلي فقط
    }
    
    // ------------------------------------------------------------------------
    // طرق إدارة الأمان
    // ------------------------------------------------------------------------
    
    /**
     * التحقق من وجود قفل
     */
    isLocked() {
        if (this.lockUntil === 0) return false;
        
        const now = Date.now();
        if (now < this.lockUntil) {
            return true;
        } else {
            // انتهاء القفل
            this.resetSecurityData();
            return false;
        }
    }
    
    /**
     * قفل الحساب
     */
    lockAccount() {
        const now = Date.now();
        this.lockUntil = now + AuthConfig.security.lockDuration;
        
        localStorage.setItem(
            AuthConfig.storageKeys.lock,
            this.lockUntil.toString()
        );
        
        // بدء عدّاد القفل
        this.startLockTimer();
    }
    
    /**
     * إعادة تعيين بيانات الأمان
     */
    resetSecurityData() {
        this.attempts = 0;
        this.lockUntil = 0;
        
        localStorage.removeItem(AuthConfig.storageKeys.attempts);
        localStorage.removeItem(AuthConfig.storageKeys.lock);
        
        this.updateUI();
    }
    
    /**
     * حفظ عدد المحاولات
     */
    saveAttempts() {
        localStorage.setItem(
            AuthConfig.storageKeys.attempts,
            this.attempts.toString()
        );
    }
    
    /**
     * التحقق من القفل عند التحميل
     */
    checkForLock() {
        if (this.isLocked()) {
            this.showLockMessage();
            this.startLockTimer();
        }
    }
    
    // ------------------------------------------------------------------------
    // طرق العدّادات والمؤقتات
    // ------------------------------------------------------------------------
    
    /**
     * بدء عدّاد القفل
     */
    startLockTimer() {
        if (!this.lockTimer || !this.timerDisplay) return;
        
        this.lockTimer.style.display = 'block';
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, this.lockUntil - now);
            
            if (remaining === 0) {
                // انتهاء القفل
                this.lockTimer.style.display = 'none';
                this.clearMessages();
                this.showSuccess('تم فتح الحساب. يمكنك المحاولة مرة أخرى.');
                return;
            }
            
            // تحويل الوقت إلى دقائق وثواني
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            // تحديث العرض
            this.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // الاستمرار في العد
            setTimeout(updateTimer, 1000);
        };
        
        updateTimer();
    }
    
    // ------------------------------------------------------------------------
    // طرق واجهة المستخدم
    // ------------------------------------------------------------------------
    
    /**
     * تحديث عدّاد المحاولات
     */
    updateAttemptsCounter() {
        if (!this.attemptsCounter || !this.remainingAttempts) return;
        
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
        if (this.lockTimer) {
            this.lockTimer.style.display = 'block';
        }
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
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.endsWith('/') ||
        window.location.pathname === '') {
        
        // التحقق إذا كان المستخدم مسجل الدخول بالفعل
        if (AuthenticationSystem.validateSession()) {
            window.location.href = 'admin.html';
            return;
        }
        
        // تهيئة نظام المصادقة
        new AuthenticationSystem();
    }
    
    // التحقق من الجلسة في الصفحات المحمية
    if (window.location.pathname.includes('admin.html')) {
        if (!AuthenticationSystem.validateSession()) {
            window.location.href = 'login.html';
            return;
        }
        
        // إعداد مراقبة النشاط
        AuthenticationSystem.setupActivityMonitoring();
        
        // عرض معلومات المستخدم
        const session = AuthenticationSystem.getSessionData();
        if (session) {
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            
            if (userNameElement) {
                userNameElement.textContent = session.name;
            }
            if (userRoleElement) {
                userRoleElement.textContent = session.role;
            }
            
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
// التصديرات للاستخدام في الموديولات
// ============================================================================

// للاستخدام في بيئات الموديولات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthenticationSystem, AuthConfig };
}

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.AuthenticationSystem = AuthenticationSystem;
    window.AuthConfig = AuthConfig;
}
