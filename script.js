// نظام حجز مواعيد العيادة - JavaScript
class ClinicBookingSystem {
    constructor() {
        this.initializeElements();
        this.initializeData();
        this.setupEventListeners();
        this.setupAdminListeners();
        this.loadInitialData();
    }

    // تهيئة العناصر
    initializeElements() {
        // عناصر الصفحة الرئيسية
        this.currentStep = 1;
        this.totalSteps = 4;
        this.bookingData = {};
        
        // تحديد العناصر
        this.steps = document.querySelectorAll('.step');
        this.formSteps = document.querySelectorAll('.form-step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.bookingForm = document.getElementById('bookingForm');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.navLinks = document.querySelector('.nav-links');
        
        // عناصر لوحة التحكم
        this.isAdminPage = document.body.classList.contains('admin-body');
        
        if (this.isAdminPage) {
            this.initializeAdminElements();
            this.checkAdminAuth();
        }
    }

    // التحقق من صلاحية دخول المدير
    checkAdminAuth() {
        const session = localStorage.getItem('admin_session');
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // التحقق من انتهاء الجلسة (24 ساعة)
            if (now - sessionData.loginTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('admin_session');
                window.location.href = 'login.html';
                return;
            }
            
            // تحديث وقت الجلسة
            sessionData.lastActivity = now;
            localStorage.setItem('admin_session', JSON.stringify(sessionData));
            
            // مراقبة النشاط
            this.setupActivityMonitor();
            
        } catch (e) {
            localStorage.removeItem('admin_session');
            window.location.href = 'login.html';
        }
    }

    // مراقبة النشاط
    setupActivityMonitor() {
        // تحديث النشاط كل 5 دقائق
        this.activityInterval = setInterval(() => {
            const session = localStorage.getItem('admin_session');
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    sessionData.lastActivity = new Date().getTime();
                    localStorage.setItem('admin_session', JSON.stringify(sessionData));
                } catch (e) {
                    clearInterval(this.activityInterval);
                }
            }
        }, 5 * 60 * 1000); // 5 دقائق

        // إضافة أحداث النشاط
        ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                const session = localStorage.getItem('admin_session');
                if (session) {
                    try {
                        const sessionData = JSON.parse(session);
                        sessionData.lastActivity = new Date().getTime();
                        localStorage.setItem('admin_session', JSON.stringify(sessionData));
                    } catch (e) {
                        // تجاهل الأخطاء
                    }
                }
            });
        });
    }

    // تهيئة عناصر لوحة التحكم
    initializeAdminElements() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.addServiceBtn = document.getElementById('addServiceBtn');
        this.addDoctorBtn = document.getElementById('addDoctorBtn');
        this.saveHoursBtn = document.getElementById('saveHoursBtn');
        this.filterStatus = document.getElementById('filterStatus');
        this.filterDate = document.getElementById('filterDate');
        this.applyFilters = document.getElementById('applyFilters');
        this.clearFilters = document.getElementById('clearFilters');
        
        // الجداول والقوائم
        this.bookingsTable = document.getElementById('bookingsTable');
        this.servicesList = document.getElementById('servicesList');
        this.doctorsList = document.getElementById('doctorsList');
        this.workingHours = document.getElementById('workingHours');
        
        // النماذج
        this.serviceModal = document.getElementById('serviceModal');
        this.doctorModal = document.getElementById('doctorModal');
        this.bookingModal = document.getElementById('bookingModal');
    }

    // تهيئة البيانات
    initializeData() {
        // بيانات الخدمات الافتراضية
        this.services = JSON.parse(localStorage.getItem('clinicServices')) || [
            {
                id: 1,
                name: "جلسة ليزر إزالة الشعر",
                description: "جلسة ليزر متقدمة لإزالة الشعر نهائياً باستخدام أحدث التقنيات",
                price: 500,
                duration: 60,
                category: "laser",
                features: ["مناسبة لجميع أنواع البشرة", "نتائج دائمة", "آمنة وفعالة"],
                isActive: true
            },
            {
                id: 2,
                name: "حقن البوتوكس",
                description: "حقن البوتوكس لتجديد الشباب وإزالة التجاعيد",
                price: 800,
                duration: 30,
                category: "injections",
                features: ["نتائج فورية", "إجراء سريع", "بدون ألم"],
                isActive: true
            },
            {
                id: 3,
                name: "حشو الفيلر",
                description: "علاج تجميلي لملء التجاعيد وتكبير الشفاه",
                price: 1200,
                duration: 45,
                category: "injections",
                features: ["نتائج طبيعية", "آمنة", "تأثير يدوم لفترات طويلة"],
                isActive: true
            }
        ];

        // بيانات الأطباء الافتراضية
        this.doctors = JSON.parse(localStorage.getItem('clinicDoctors')) || [
            {
                id: 1,
                name: "د. أحمد محمد",
                specialty: "جراحة التجميل",
                experience: 15,
                services: [1, 2, 3],
                isActive: true,
                schedule: {
                    "الأحد": ["09:00", "18:00"],
                    "الاثنين": ["09:00", "18:00"],
                    "الثلاثاء": ["09:00", "18:00"],
                    "الأربعاء": ["09:00", "18:00"],
                    "الخميس": ["09:00", "18:00"],
                    "الجمعة": ["16:00", "22:00"],
                    "السبت": ["16:00", "22:00"]
                }
            },
            {
                id: 2,
                name: "د. سارة عبدالله",
                specialty: "الأمراض الجلدية",
                experience: 10,
                services: [1, 3],
                isActive: true,
                schedule: {
                    "الأحد": ["10:00", "19:00"],
                    "الاثنين": ["10:00", "19:00"],
                    "الثلاثاء": ["10:00", "19:00"],
                    "الأربعاء": ["10:00", "19:00"],
                    "الخميس": ["10:00", "19:00"],
                    "الجمعة": ["17:00", "21:00"],
                    "السبت": ["17:00", "21:00"]
                }
            }
        ];

        // بيانات الحجوزات
        this.bookings = JSON.parse(localStorage.getItem('clinicBookings')) || [];

        // أوقات العمل الافتراضية
        this.workingHoursData = JSON.parse(localStorage.getItem('workingHours')) || {
            "الأحد": { start: "09:00", end: "18:00", isOpen: true },
            "الاثنين": { start: "09:00", end: "18:00", isOpen: true },
            "الثلاثاء": { start: "09:00", end: "18:00", isOpen: true },
            "الأربعاء": { start: "09:00", end: "18:00", isOpen: true },
            "الخميس": { start: "09:00", end: "18:00", isOpen: true },
            "الجمعة": { start: "16:00", end: "22:00", isOpen: true },
            "السبت": { start: "16:00", end: "22:00", isOpen: true }
        };

        // الأوقات المتاحة
        this.timeSlots = this.generateTimeSlots();
    }

    // توليد الأوقات المتاحة
    generateTimeSlots() {
        const slots = [];
        for (let hour = 9; hour <= 21; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    }

    // تحميل البيانات الأولية
    loadInitialData() {
        if (!this.isAdminPage) {
            this.loadServices();
            this.populateServiceSelect();
            this.populateTimeSlots();
            this.setupNavScroll();
            this.setupMobileMenu();
        } else {
            this.loadAdminData();
            this.renderWorkingHours();
        }
    }

    // ... (بقية الدوال تبقى كما هي مع إضافة دالة تسجيل الخروج)

    // تسجيل الخروج
    logout() {
        if (confirm('هل تريد تسجيل الخروج من لوحة التحكم؟')) {
            // تنظيف الجلسة
            localStorage.removeItem('admin_session');
            
            // إيقاف مراقبة النشاط
            if (this.activityInterval) {
                clearInterval(this.activityInterval);
            }
            
            // توجيه إلى صفحة تسجيل الدخول
            window.location.href = 'login.html';
        }
    }

    // ... (بقية الدوال كما هي)

    // حفظ بيانات الطبيب
    saveDoctor(doctorId) {
        const name = document.getElementById('doctorName').value.trim();
        const specialty = document.getElementById('doctorSpecialty').value.trim();
        const experience = parseInt(document.getElementById('doctorExperience').value);
        const servicesSelect = document.getElementById('doctorServices');
        
        // التحقق من البيانات
        if (!name || !specialty || isNaN(experience) || experience < 0) {
            this.showMessage('يرجى ملء جميع الحقول بشكل صحيح', 'error');
            return;
        }
        
        const services = Array.from(servicesSelect.selectedOptions).map(option => 
            parseInt(option.value)
        );
        
        if (doctorId) {
            // تعديل طبيب موجود
            const index = this.doctors.findIndex(d => d.id === doctorId);
            if (index !== -1) {
                this.doctors[index] = {
                    ...this.doctors[index],
                    name,
                    specialty,
                    experience,
                    services,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // إضافة طبيب جديد
            const newId = this.doctors.length > 0 ? Math.max(...this.doctors.map(d => d.id)) + 1 : 1;
            this.doctors.push({
                id: newId,
                name,
                specialty,
                experience,
                services,
                isActive: true,
                schedule: {
                    "الأحد": ["09:00", "18:00"],
                    "الاثنين": ["09:00", "18:00"],
                    "الثلاثاء": ["09:00", "18:00"],
                    "الأربعاء": ["09:00", "18:00"],
                    "الخميس": ["09:00", "18:00"],
                    "الجمعة": ["16:00", "22:00"],
                    "السبت": ["16:00", "22:00"]
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        // حفظ البيانات
        localStorage.setItem('clinicDoctors', JSON.stringify(this.doctors));
        
        // تحديث الواجهة
        this.renderDoctorsList();
        
        // إغلاق النافذة
        this.closeAllModals();
        
        // عرض رسالة النجاح
        this.showMessage('تم حفظ بيانات الطبيب بنجاح', 'success');
    }

    // ... (بقية الدوال تبقى كما هي)
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.bookingSystem = new ClinicBookingSystem();
});
