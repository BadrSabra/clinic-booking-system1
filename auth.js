/**
 * ملف auth.js المعدل - للاستخدام في admin.html فقط
 */

// ============================================================================
// نظام الجلسات فقط
// ============================================================================

const AuthSystem = {
    /**
     * التحقق من صحة الجلسة
     */
    validateSession: function() {
        try {
            const sessionData = localStorage.getItem('derma_session');
            
            if (!sessionData) {
                return false;
            }
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // التحقق من انتهاء مدة الجلسة (24 ساعة)
            if (now - session.loginTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('derma_session');
                return false;
            }
            
            // التحقق من وقت عدم النشاط (30 دقيقة)
            if (now - session.lastActivity > 30 * 60 * 1000) {
                localStorage.removeItem('derma_session');
                return false;
            }
            
            // تحديث وقت النشاط الأخير
            session.lastActivity = now;
            localStorage.setItem('derma_session', JSON.stringify(session));
            
            return true;
            
        } catch (error) {
            console.error('خطأ في التحقق من الجلسة:', error);
            return false;
        }
    },
    
    /**
     * الحصول على بيانات الجلسة
     */
    getSessionData: function() {
        try {
            const sessionData = localStorage.getItem('derma_session');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('خطأ في الحصول على بيانات الجلسة:', error);
            return null;
        }
    },
    
    /**
     * تسجيل الخروج
     */
    logout: function() {
        localStorage.removeItem('derma_session');
        window.location.href = 'login.html';
    },
    
    /**
     * تحديث نشاط المستخدم
     */
    updateUserActivity: function() {
        try {
            const sessionData = localStorage.getItem('derma_session');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.lastActivity = Date.now();
                localStorage.setItem('derma_session', JSON.stringify(session));
            }
        } catch (error) {
            console.error('خطأ في تحديث نشاط المستخدم:', error);
        }
    }
};

// ============================================================================
// تهيئة النظام في admin.html
// ============================================================================

if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // التحقق من الجلسة
        if (!AuthSystem.validateSession()) {
            alert('جلسة الدخول منتهية أو غير صالحة. سيتم توجيهك إلى صفحة الدخول.');
            window.location.href = 'login.html';
            return;
        }
        
        // إعداد مراقبة النشاط
        ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                AuthSystem.updateUserActivity();
            }, { passive: true });
        });
        
        // التحقق من النشاط بشكل دوري
        setInterval(() => {
            if (!AuthSystem.validateSession()) {
                window.location.href = 'login.html?reason=inactivity';
            }
        }, 60000);
        
        // عرض معلومات المستخدم
        const session = AuthSystem.getSessionData();
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
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    AuthSystem.logout();
                });
            }
        }
    });
}
