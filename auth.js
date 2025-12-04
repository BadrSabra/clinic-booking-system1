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
        session: 'admin_session',
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
        if (!this.attemptsCounter || !
