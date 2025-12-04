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
        }
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
                features: ["مناسبة لجميع أنواع البشرة", "نتائج دائمة", "آمنة وفعالة"]
            },
            {
                id: 2,
                name: "حقن البوتوكس",
                description: "حقن البوتوكس لتجديد الشباب وإزالة التجاعيد",
                price: 800,
                duration: 30,
                category: "injections",
                features: ["نتائج فورية", "إجراء سريع", "بدون ألم"]
            },
            {
                id: 3,
                name: "حشو الفيلر",
                description: "علاج تجميلي لملء التجاعيد وتكبير الشفاه",
                price: 1200,
                duration: 45,
                category: "injections",
                features: ["نتائج طبيعية", "آمنة", "تأثير يدوم لفترات طويلة"]
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
            "الأحد": { start: "09:00", end: "18:00" },
            "الاثنين": { start: "09:00", end: "18:00" },
            "الثلاثاء": { start: "09:00", end: "18:00" },
            "الأربعاء": { start: "09:00", end: "18:00" },
            "الخميس": { start: "09:00", end: "18:00" },
            "الجمعة": { start: "16:00", end: "22:00" },
            "السبت": { start: "16:00", end: "22:00" }
        };

        // الأوقات المتاحة
        this.timeSlots = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
            "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
            "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
        ];
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

    // إعداد المستمعين للأحداث
    setupEventListeners() {
        if (!this.isAdminPage) {
            // أحداث نموذج الحجز
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.nextStep());
            }
            
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.prevStep());
            }
            
            if (this.bookingForm) {
                this.bookingForm.addEventListener('submit', (e) => this.submitBooking(e));
            }
            
            // أحداث اختيار الخدمة والطبيب
            const serviceSelect = document.getElementById('serviceType');
            const doctorSelect = document.getElementById('doctor');
            
            if (serviceSelect) {
                serviceSelect.addEventListener('change', (e) => this.onServiceChange(e));
            }
            
            if (doctorSelect) {
                doctorSelect.addEventListener('change', (e) => this.onDoctorChange(e));
            }
            
            // حدث تغيير التاريخ
            const dateInput = document.getElementById('appointmentDate');
            if (dateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateInput.min = tomorrow.toISOString().split('T')[0];
            }
        }
    }

    // إعداد مستمعات لوحة التحكم
    setupAdminListeners() {
        if (!this.isAdminPage) return;

        // أحداث الأزرار
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportData());
        }

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.refreshData());
        }

        if (this.addServiceBtn) {
            this.addServiceBtn.addEventListener('click', () => this.openServiceModal());
        }

        if (this.addDoctorBtn) {
            this.addDoctorBtn.addEventListener('click', () => this.openDoctorModal());
        }

        if (this.saveHoursBtn) {
            this.saveHoursBtn.addEventListener('click', () => this.saveWorkingHours());
        }

        // أحداث الفلاتر
        if (this.applyFilters) {
            this.applyFilters.addEventListener('click', () => this.applyBookingsFilter());
        }

        if (this.clearFilters) {
            this.clearFilters.addEventListener('click', () => this.clearBookingsFilter());
        }

        // إغلاق النماذج
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // إغلاق النماذج بالأزرار
        const cancelButtons = [
            'cancelServiceBtn',
            'cancelDoctorBtn',
            'closeBookingModal'
        ];

        cancelButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.closeAllModals());
            }
        });
    }

    // ===== وظائف الصفحة الرئيسية =====

    // تحميل الخدمات
    loadServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        servicesGrid.innerHTML = this.services.map(service => `
            <div class="service-card">
                <div class="service-icon">
                    <i class="fas fa-stethoscope"></i>
                </div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                
                <ul class="service-features">
                    ${service.features ? service.features.map(feature => `
                        <li>${feature}</li>
                    `).join('') : ''}
                </ul>
                
                <div class="service-price">
                    ${service.price} ريال <span>للجلسة الواحدة</span>
                </div>
                
                <button class="btn btn-primary" onclick="bookingSystem.selectService(${service.id})">
                    <i class="fas fa-calendar-plus"></i> احجز الآن
                </button>
            </div>
        `).join('');
    }

    // تعبئة قائمة الخدمات
    populateServiceSelect() {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;

        serviceSelect.innerHTML = `
            <option value="">اختر الخدمة المطلوبة</option>
            ${this.services.map(service => `
                <option value="${service.id}">${service.name} - ${service.price} ريال</option>
            `).join('')}
        `;
    }

    // تعبئة الأوقات المتاحة
    populateTimeSlots() {
        const timeSelect = document.getElementById('appointmentTime');
        if (!timeSelect) return;

        timeSelect.innerHTML = `
            <option value="">اختر الوقت المناسب</option>
            ${this.timeSlots.map(time => `
                <option value="${time}">${time}</option>
            `).join('')}
        `;
    }

    // اختيار الخدمة
    selectService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            const serviceSelect = document.getElementById('serviceType');
            if (serviceSelect) {
                serviceSelect.value = serviceId;
                this.onServiceChange({ target: serviceSelect });
            }
            
            // التمرير إلى قسم الحجز
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // عند تغيير الخدمة
    onServiceChange(e) {
        const serviceId = parseInt(e.target.value);
        const doctorSelect = document.getElementById('doctor');
        
        if (!doctorSelect) return;
        
        if (serviceId) {
            // تصفية الأطباء الذين يقدمون هذه الخدمة
            const availableDoctors = this.doctors.filter(doctor => 
                doctor.services.includes(serviceId)
            );
            
            doctorSelect.innerHTML = `
                <option value="">اختر الطبيب</option>
                ${availableDoctors.map(doctor => `
                    <option value="${doctor.id}">${doctor.name} - ${doctor.specialty}</option>
                `).join('')}
            `;
        } else {
            doctorSelect.innerHTML = '<option value="">اختر الطبيب</option>';
        }
        
        this.bookingData.serviceId = serviceId;
    }

    // عند تغيير الطبيب
    onDoctorChange(e) {
        const doctorId = parseInt(e.target.value);
        this.bookingData.doctorId = doctorId;
    }

    // التالي في الخطوات
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            // التحقق من صحة الخطوة الحالية
            if (!this.validateStep(this.currentStep)) {
                return;
            }
            
            // تحديث البيانات
            this.updateBookingData();
            
            // الانتقال للخطوة التالية
            this.steps[this.currentStep - 1].classList.remove('active');
            this.formSteps[this.currentStep - 1].classList.remove('active');
            
            this.currentStep++;
            
            this.steps[this.currentStep - 1].classList.add('active');
            this.formSteps[this.currentStep - 1].classList.add('active');
            
            // تحديث الأزرار
            this.updateButtons();
            
            // إذا كانت الخطوة الأخيرة، عرض الملخص
            if (this.currentStep === this.totalSteps) {
                this.showConfirmation();
            }
        }
    }

    // السابق في الخطوات
    prevStep() {
        if (this.currentStep > 1) {
            this.steps[this.currentStep - 1].classList.remove('active');
            this.formSteps[this.currentStep - 1].classList.remove('active');
            
            this.currentStep--;
            
            this.steps[this.currentStep - 1].classList.add('active');
            this.formSteps[this.currentStep - 1].classList.add('active');
            
            this.updateButtons();
        }
    }

    // تحديث الأزرار
    updateButtons() {
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        }
        
        if (this.nextBtn) {
            this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'flex' : 'none';
        }
        
        if (this.submitBtn) {
            this.submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
        }
    }

    // التحقق من صحة الخطوة
    validateStep(step) {
        switch(step) {
            case 1:
                const service = document.getElementById('serviceType');
                const doctor = document.getElementById('doctor');
                
                if (!service.value || !doctor.value) {
                    this.showError('يرجى اختيار الخدمة والطبيب');
                    return false;
                }
                return true;
                
            case 2:
                const date = document.getElementById('appointmentDate');
                const time = document.getElementById('appointmentTime');
                
                if (!date.value || !time.value) {
                    this.showError('يرجى اختيار التاريخ والوقت');
                    return false;
                }
                return true;
                
            case 3:
                const name = document.getElementById('fullName');
                const phone = document.getElementById('phone');
                const email = document.getElementById('email');
                
                if (!name.value || !phone.value || !email.value) {
                    this.showError('يرجى ملء جميع الحقول المطلوبة');
                    return false;
                }
                
                // التحقق من صحة البريد الإلكتروني
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.value)) {
                    this.showError('يرجى إدخال بريد إلكتروني صحيح');
                    return false;
                }
                
                // التحقق من صحة رقم الهاتف
                const phoneRegex = /^05\d{8}$/;
                if (!phoneRegex.test(phone.value)) {
                    this.showError('يرجى إدخال رقم هاتف صحيح (يبدأ بـ 05 ويتكون من 10 أرقام)');
                    return false;
                }
                return true;
                
            case 4:
                const terms = document.getElementById('terms');
                if (!terms.checked) {
                    this.showError('يرجى الموافقة على الشروط والأحكام');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }

    // تحديث بيانات الحجز
    updateBookingData() {
        switch(this.currentStep) {
            case 1:
                this.bookingData.serviceId = parseInt(document.getElementById('serviceType').value);
                this.bookingData.doctorId = parseInt(document.getElementById('doctor').value);
                break;
                
            case 2:
                this.bookingData.date = document.getElementById('appointmentDate').value;
                this.bookingData.time = document.getElementById('appointmentTime').value;
                break;
                
            case 3:
                this.bookingData.name = document.getElementById('fullName').value;
                this.bookingData.phone = document.getElementById('phone').value;
                this.bookingData.email = document.getElementById('email').value;
                this.bookingData.notes = document.getElementById('notes').value;
                break;
        }
    }

    // عرض تأكيد الحجز
    showConfirmation() {
        const detailsContainer = document.getElementById('confirmationDetails');
        if (!detailsContainer) return;
        
        const service = this.services.find(s => s.id === this.bookingData.serviceId);
        const doctor = this.doctors.find(d => d.id === this.bookingData.doctorId);
        
        if (!service || !doctor) return;
        
        detailsContainer.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--primary);">تفاصيل الحجز</h3>
            <div class="detail-item">
                <span class="detail-label">الخدمة:</span>
                <span class="detail-value">${service.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الطبيب:</span>
                <span class="detail-value">${doctor.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">التاريخ:</span>
                <span class="detail-value">${this.formatDate(this.bookingData.date)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الوقت:</span>
                <span class="detail-value">${this.bookingData.time}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الاسم:</span>
                <span class="detail-value">${this.bookingData.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الهاتف:</span>
                <span class="detail-value">${this.bookingData.phone}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">${this.bookingData.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">السعر:</span>
                <span class="detail-value">${service.price} ريال</span>
            </div>
            ${this.bookingData.notes ? `
            <div class="detail-item">
                <span class="detail-label">ملاحظات:</span>
                <span class="detail-value">${this.bookingData.notes}</span>
            </div>
            ` : ''}
        `;
    }

    // تقديم الحجز
    submitBooking(e) {
        e.preventDefault();
        
        if (!this.validateStep(4)) {
            return;
        }
        
        // إنشاء رقم حجز فريد
        const bookingId = 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const service = this.services.find(s => s.id === this.bookingData.serviceId);
        const doctor = this.doctors.find(d => d.id === this.bookingData.doctorId);
        
        const booking = {
            id: bookingId,
            ...this.bookingData,
            serviceName: service.name,
            doctorName: doctor.name,
            price: service.price,
            status: 'pending',
            createdAt: new Date().toISOString(),
            confirmationCode: Math.random().toString(36).substr(2, 6).toUpperCase()
        };
        
        // حفظ الحجز
        this.bookings.unshift(booking);
        localStorage.setItem('clinicBookings', JSON.stringify(this.bookings));
        
        // عرض رسالة النجاح
        this.showSuccess(booking);
        
        // إعادة تعيين النموذج
        this.resetForm();
    }

    // عرض رسالة النجاح
    showSuccess(booking) {
        const modal = document.getElementById('successModal');
        const message = document.getElementById('successMessage');
        
        if (modal && message) {
            message.innerHTML = `
                تم تأكيد حجز موعدك بنجاح!<br>
                <strong>رقم الحجز:</strong> ${booking.id}<br>
                <strong>رمز التأكيد:</strong> ${booking.confirmationCode}<br><br>
                سيتم التواصل معك على الرقم ${booking.phone} لتأكيد التفاصيل.
            `;
            
            modal.classList.add('active');
            
            // إعداد حدث طباعة الوصل
            const printBtn = document.getElementById('printReceipt');
            if (printBtn) {
                printBtn.onclick = () => this.printReceipt(booking);
            }
            
            // إغلاق النافذة
            const closeBtn = document.getElementById('closeModal');
            if (closeBtn) {
                closeBtn.onclick = () => modal.classList.remove('active');
            }
        }
    }

    // طباعة الوصل
    printReceipt(booking) {
        const receiptContent = `
            <div style="font-family: 'Cairo', sans-serif; padding: 20px; text-align: right; direction: rtl;">
                <h2 style="color: #7C3AED; text-align: center;">عيادة ديرما كير</h2>
                <h3 style="text-align: center; color: #333;">وصل تأكيد الحجز</h3>
                <hr>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">رقم الحجز:</td>
                        <td style="padding: 5px;">${booking.id}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">رمز التأكيد:</td>
                        <td style="padding: 5px;">${booking.confirmationCode}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">التاريخ:</td>
                        <td style="padding: 5px;">${this.formatDate(booking.date)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">الوقت:</td>
                        <td style="padding: 5px;">${booking.time}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">الخدمة:</td>
                        <td style="padding: 5px;">${booking.serviceName}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">الطبيب:</td>
                        <td style="padding: 5px;">${booking.doctorName}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">اسم المريض:</td>
                        <td style="padding: 5px;">${booking.name}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px;">المبلغ:</td>
                        <td style="padding: 5px; color: #10B981; font-weight: bold;">${booking.price} ريال</td>
                    </tr>
                </table>
                <hr>
                <p style="text-align: center; color: #666; font-size: 12px;">
                    شكراً لاختياركم عيادة ديرما كير<br>
                    للاستفسار: 0111234567
                </p>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
    }

    // إعادة تعيين النموذج
    resetForm() {
        // إعادة تعيين الخطوات
        this.currentStep = 1;
        this.bookingData = {};
        
        // إعادة تعيين الخطوات المرئية
        this.steps.forEach(step => step.classList.remove('active'));
        this.formSteps.forEach(step => step.classList.remove('active'));
        
        this.steps[0].classList.add('active');
        this.formSteps[0].classList.add('active');
        
        // إعادة تعيين الأزرار
        this.updateButtons();
        
        // إعادة تعيين النموذج
        if (this.bookingForm) {
            this.bookingForm.reset();
        }
        
        // إعادة تعيين قائمة الأطباء
        const doctorSelect = document.getElementById('doctor');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">اختر الطبيب</option>';
        }
    }

    // ===== وظائف لوحة التحكم =====

    // تحميل بيانات لوحة التحكم
    loadAdminData() {
        this.updateStats();
        this.renderBookingsTable();
        this.renderServicesList();
        this.renderDoctorsList();
    }

    // تحديث الإحصائيات
    updateStats() {
        const total = this.bookings.length;
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;
        const pending = this.bookings.filter(b => b.status === 'pending').length;
        const cancelled = this.bookings.filter(b => b.status === 'cancelled').length;
        
        // تحديث الإحصائيات
        const stats = {
            totalBookings: total,
            confirmedBookings: confirmed,
            pendingBookings: pending,
            cancelledBookings: cancelled
        };
        
        Object.keys(stats).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = stats[id];
            }
        });
    }

    // عرض جدول الحجوزات
    renderBookingsTable(filteredBookings = null) {
        const bookings = filteredBookings || this.bookings;
        
        if (!this.bookingsTable) return;
        
        this.bookingsTable.innerHTML = bookings.map((booking, index) => {
            const service = this.services.find(s => s.id === booking.serviceId);
            const doctor = this.doctors.find(d => d.id === booking.doctorId);
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${booking.name}</td>
                    <td>${service ? service.name : 'غير معروف'}</td>
                    <td>${doctor ? doctor.name : 'غير معروف'}</td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${booking.time}</td>
                    <td>${booking.phone}</td>
                    <td>
                        <span class="status-badge status-${booking.status}">
                            ${this.getStatusText(booking.status)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-small" onclick="bookingSystem.viewBooking('${booking.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-small btn-warning" onclick="bookingSystem.editBooking('${booking.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="bookingSystem.deleteBooking('${booking.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // إذا لم تكن هناك حجوزات
        if (bookings.length === 0) {
            this.bookingsTable.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: var(--gray);">
                        <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        لا توجد حجوزات لعرضها
                    </td>
                </tr>
            `;
        }
    }

    // عرض قائمة الخدمات
    renderServicesList() {
        if (!this.servicesList) return;
        
        this.servicesList.innerHTML = this.services.map(service => `
            <div class="service-item">
                <div>
                    <h4>${service.name}</h4>
                    <p>${service.price} ريال - ${service.duration} دقيقة</p>
                </div>
                <div class="item-actions">
                    <button onclick="bookingSystem.editService(${service.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="bookingSystem.deleteService(${service.id})" title="حذف" style="color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // عرض قائمة الأطباء
    renderDoctorsList() {
        if (!this.doctorsList) return;
        
        this.doctorsList.innerHTML = this.doctors.map(doctor => `
            <div class="doctor-item">
                <div>
                    <h4>${doctor.name}</h4>
                    <p>${doctor.specialty} - ${doctor.experience} سنة خبرة</p>
                </div>
                <div class="item-actions">
                    <button onclick="bookingSystem.editDoctor(${doctor.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="bookingSystem.deleteDoctor(${doctor.id})" title="حذف" style="color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // عرض أوقات العمل
    renderWorkingHours() {
        if (!this.workingHours) return;
        
        const days = [
            { ar: "الأحد", en: "sunday" },
            { ar: "الاثنين", en: "monday" },
            { ar: "الثلاثاء", en: "tuesday" },
            { ar: "الأربعاء", en: "wednesday" },
            { ar: "الخميس", en: "thursday" },
            { ar: "الجمعة", en: "friday" },
            { ar: "السبت", en: "saturday" }
        ];
        
        this.workingHours.innerHTML = days.map(day => {
            const hours = this.workingHoursData[day.ar] || { start: "09:00", end: "18:00" };
            
            return `
                <div class="day-schedule">
                    <span style="font-weight: bold;">${day.ar}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="time" value="${hours.start}" id="start-${day.en}" class="time-input">
                        <span>إلى</span>
                        <input type="time" value="${hours.end}" id="end-${day.en}" class="time-input">
                    </div>
                </div>
            `;
        }).join('');
    }

    // تطبيق فلتر الحجوزات
    applyBookingsFilter() {
        const status = this.filterStatus ? this.filterStatus.value : 'all';
        const date = this.filterDate ? this.filterDate.value : '';
        
        let filtered = this.bookings;
        
        if (status !== 'all') {
            filtered = filtered.filter(booking => booking.status === status);
        }
        
        if (date) {
            filtered = filtered.filter(booking => booking.date === date);
        }
        
        this.renderBookingsTable(filtered);
    }

    // مسح فلاتر الحجوزات
    clearBookingsFilter() {
        if (this.filterStatus) this.filterStatus.value = 'all';
        if (this.filterDate) this.filterDate.value = '';
        this.renderBookingsTable();
    }

    // عرض تفاصيل الحجز
    viewBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking || !this.bookingModal) return;
        
        const service = this.services.find(s => s.id === booking.serviceId);
        const doctor = this.doctors.find(d => d.id === booking.doctorId);
        
        const details = document.getElementById('bookingDetails');
        if (details) {
            details.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">رقم الحجز:</span>
                    <span class="detail-value">${booking.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">اسم المريض:</span>
                    <span class="detail-value">${booking.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الخدمة:</span>
                    <span class="detail-value">${service ? service.name : 'غير معروف'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الطبيب:</span>
                    <span class="detail-value">${doctor ? doctor.name : 'غير معروف'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">التاريخ:</span>
                    <span class="detail-value">${this.formatDate(booking.date)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الوقت:</span>
                    <span class="detail-value">${booking.time}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الهاتف:</span>
                    <span class="detail-value">${booking.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">البريد الإلكتروني:</span>
                    <span class="detail-value">${booking.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الحالة:</span>
                    <span class="detail-value status-${booking.status}">
                        ${this.getStatusText(booking.status)}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">تاريخ الإنشاء:</span>
                    <span class="detail-value">${this.formatDateTime(booking.createdAt)}</span>
                </div>
                ${booking.notes ? `
                <div class="detail-item">
                    <span class="detail-label">ملاحظات:</span>
                    <span class="detail-value">${booking.notes}</span>
                </div>
                ` : ''}
            `;
        }
        
        this.bookingModal.classList.add('active');
        
        // إعداد أحداث الأزرار
        const confirmBtn = document.getElementById('confirmBookingBtn');
        const cancelBtn = document.getElementById('cancelBookingBtn');
        
        if (confirmBtn) {
            confirmBtn.onclick = () => this.changeBookingStatus(bookingId, 'confirmed');
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.changeBookingStatus(bookingId, 'cancelled');
        }
    }

    // فتح نافذة إضافة خدمة
    openServiceModal(serviceId = null) {
        if (!this.serviceModal) return;
        
        const title = document.getElementById('serviceModalTitle');
        const form = document.getElementById('serviceForm');
        
        if (title) {
            title.textContent = serviceId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة';
        }
        
        if (serviceId) {
            const service = this.services.find(s => s.id === serviceId);
            if (service) {
                document.getElementById('serviceName').value = service.name;
                document.getElementById('serviceDescription').value = service.description;
                document.getElementById('servicePrice').value = service.price;
                document.getElementById('serviceDuration').value = service.duration;
                document.getElementById('serviceCategory').value = service.category;
            }
        } else {
            form.reset();
        }
        
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveService(serviceId);
        };
        
        this.serviceModal.classList.add('active');
    }

    // حفظ الخدمة
    saveService(serviceId) {
        const name = document.getElementById('serviceName').value;
        const description = document.getElementById('serviceDescription').value;
        const price = parseInt(document.getElementById('servicePrice').value);
        const duration = parseInt(document.getElementById('serviceDuration').value);
        const category = document.getElementById('serviceCategory').value;
        
        if (serviceId) {
            // تعديل خدمة موجودة
            const index = this.services.findIndex(s => s.id === serviceId);
            if (index !== -1) {
                this.services[index] = {
                    ...this.services[index],
                    name,
                    description,
                    price,
                    duration,
                    category
                };
            }
        } else {
            // إضافة خدمة جديدة
            const newId = Math.max(...this.services.map(s => s.id)) + 1;
            this.services.push({
                id: newId,
                name,
                description,
                price,
                duration,
                category,
                features: ["جودة عالية", "أسعار مناسبة", "نتائج مضمونة"]
            });
        }
        
        localStorage.setItem('clinicServices', JSON.stringify(this.services));
        this.renderServicesList();
        this.closeAllModals();
        this.showMessage('تم حفظ الخدمة بنجاح', 'success');
    }

    // حذف الخدمة
    deleteService(serviceId) {
        if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
            this.services = this.services.filter(s => s.id !== serviceId);
            localStorage.setItem('clinicServices', JSON.stringify(this.services));
            this.renderServicesList();
            this.showMessage('تم حذف الخدمة بنجاح', 'success');
        }
    }

    // فتح نافذة إضافة طبيب
    openDoctorModal(doctorId = null) {
        if (!this.doctorModal) return;
        
        const title = document.getElementById('doctorModalTitle');
        const form = document.getElementById('doctorForm');
        const servicesSelect = document.getElementById('doctorServices');
        
        if (title) {
            title.textContent = doctorId ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد';
        }
        
        // تعبئة قائمة الخدمات
        if (servicesSelect) {
            servicesSelect.innerHTML = this.services.map(service => `
                <option value="${service.id}">${service.name}</option>
            `).join('');
        }
        
        if (doctorId) {
            const doctor = this.doctors.find(d => d.id === doctorId);
            if (doctor) {
                document.getElementById('doctorName').value = doctor.name;
                document.getElementById('doctorSpecialty').value = doctor.specialty;
                document.getElementById('doctorExperience').value = doctor.experience;
                
                if (servicesSelect) {
                    Array.from(servicesSelect.options).forEach(option => {
                        option.selected = doctor.services.includes(parseInt(option.value));
                    });
                }
            }
        } else {
            form.reset();
        }
        
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveDoctor(doctorId);
        };
        
        this.doctorModal.classList.add('active');
    }

    // حفظ بيانات الطبيب
    saveDoctor(doctorId) {
        const name = document.getElementById('doctorName').value;
        const specialty = document.getElementById('doctorSpecialty').value;
        const experience = parseInt(document.getElementById('doctorExperience').value);
        const servicesSelect = document.getElementById('doctorServices');
        
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
                    services
                };
            }
        } else {
            // إضافة طبيب جديد
            const newId = Math.max(...this.doctors.map(d => d.id)) + 1;
            this.doctors.push({
                id: newId,
                name,
                specialty,
                experience,
                services,
                schedule: {
                    "الأحد": ["09:00", "18:00"],
                    "الاثنين": ["09:00", "18:00"],
                    "الثلاثاء": ["09:00", "18:00"],
                    "الأربعاء": ["09:00", "18:00"],
                    "الخميس": ["09:00", "18:00"],
                    "الجمعة": ["16:00", "22:00"],
                    "السبت": ["16:00", "22:00"]
                }
            });
        }
        
        localStorage.setItem('clinicDoctors', JSON.stringify(this.doctors));
        this.renderDoctorsList();
        this.closeAllModals();
        this.showMessage('تم حفظ بيانات الطبيب بنجاح', 'success');
    }

    // حذف الطبيب
    deleteDoctor(doctorId) {
        if (confirm('هل أنت متأكد من حذف بيانات هذا الطبيب؟')) {
            this.doctors = this.doctors.filter(d => d.id !== doctorId);
            localStorage.setItem('clinicDoctors', JSON.stringify(this.doctors));
            this.renderDoctorsList();
            this.showMessage('تم حذف الطبيب بنجاح', 'success');
        }
    }

    // حفظ أوقات العمل
    saveWorkingHours() {
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        
        arabicDays.forEach((day, index) => {
            const startInput = document.getElementById(`start-${days[index]}`);
            const endInput = document.getElementById(`end-${days[index]}`);
            
            if (startInput && endInput) {
                this.workingHoursData[day] = {
                    start: startInput.value,
                    end: endInput.value
                };
            }
        });
        
        localStorage.setItem('workingHours', JSON.stringify(this.workingHoursData));
        this.showMessage('تم حفظ أوقات العمل بنجاح', 'success');
    }

    // تغيير حالة الحجز
    changeBookingStatus(bookingId, status) {
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            this.bookings[bookingIndex].status = status;
            localStorage.setItem('clinicBookings', JSON.stringify(this.bookings));
            this.renderBookingsTable();
            this.updateStats();
            this.closeAllModals();
            this.showMessage('تم تغيير حالة الحجز بنجاح', 'success');
        }
    }

    // تصدير البيانات
    exportData() {
        const data = {
            bookings: this.bookings,
            services: this.services,
            doctors: this.doctors,
            workingHours: this.workingHoursData,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `clinic-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // تسجيل الخروج
    logout() {
        if (confirm('هل تريد تسجيل الخروج من لوحة التحكم؟')) {
            window.location.href = 'index.html';
        }
    }

    // تحديث البيانات
    refreshData() {
        this.loadAdminData();
        this.showMessage('تم تحديث البيانات بنجاح', 'success');
    }

    // إغلاق جميع النوافذ المنبثقة
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
    }

    // ===== وظائف مساعدة =====

    // تنسيق التاريخ
    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // تنسيق التاريخ والوقت
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'غير محدد';
        
        const date = new Date(dateTimeString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // الحصول على نص الحالة
    getStatusText(status) {
        const statusTexts = {
            'pending': 'قيد الانتظار',
            'confirmed': 'مؤكد',
            'cancelled': 'ملغى',
            'completed': 'مكتمل'
        };
        
        return statusTexts[status] || 'غير معروف';
    }

    // عرض رسالة خطأ
    showError(message) {
        alert(`خطأ: ${message}`);
    }

    // عرض رسالة نجاح
    showMessage(message, type = 'success') {
        // يمكن استبدال هذا بنافذة منبثقة أجمل
        if (type === 'success') {
            alert(`✅ ${message}`);
        } else {
            alert(`❌ ${message}`);
        }
    }

    // إعداد القائمة المتنقلة للجوال
    setupMobileMenu() {
        if (this.mobileMenuBtn && this.navLinks) {
            this.mobileMenuBtn.addEventListener('click', () => {
                this.navLinks.classList.toggle('active');
                this.mobileMenuBtn.innerHTML = this.navLinks.classList.contains('active') 
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            });
            
            // إغلاق القائمة عند النقر على رابط
            const navLinks = this.navLinks.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.navLinks.classList.remove('active');
                    this.mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                });
            });
        }
    }

    // إعداد التنقل السلس
    setupNavScroll() {
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // التنقل السلس للروابط الداخلية
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.bookingSystem = new ClinicBookingSystem();
});
