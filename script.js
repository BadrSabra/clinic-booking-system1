/**
 * نظام حجز مواعيد عيادة ديرما كير
 * الملف الرئيسي للواجهة الأمامية
 * 
 * @author Badr Aldien
 * @version 1.0.0
 */

// ============================================================================
// الفئة الرئيسية للتطبيق
// ============================================================================

class DermaCareClinic {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.bookingData = {};
        this.initializeApp();
    }

    // ------------------------------------------------------------------------
    // طرق التهيئة
    // ------------------------------------------------------------------------

    /**
     * تهيئة التطبيق
     */
    initializeApp() {
        this.setupNavigation();
        this.setupBookingSystem();
        this.loadServices();
        this.setupEventListeners();
        this.setupDatePicker();
        this.setupTimeSlots();
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
    }

    /**
     * إعداد التنقل
     */
    setupNavigation() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('navMenu');
        this.navToggle = document.getElementById('navToggle');
        
        // تحديث الروابط النشطة
        this.updateActiveNavLinks();
        
        // مراقبة التمرير لتحديث الروابط النشطة
        window.addEventListener('scroll', () => this.updateActiveNavLinks());
    }

    /**
     * إعداد نظام الحجز
     */
    setupBookingSystem() {
        this.bookingForm = document.getElementById('bookingForm');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');
        
        // عناصر الخطوات
        this.steps = document.querySelectorAll('.step');
        this.formSteps = document.querySelectorAll('.form-step');
        
        // عناصر الاختيار
        this.serviceSelect = document.getElementById('serviceSelect');
        this.doctorSelect = document.getElementById('doctorSelect');
        this.dateInput = document.getElementById('appointmentDate');
        this.timeSelect = document.getElementById('appointmentTime');
        
        // عناصر المعلومات
        this.fullNameInput = document.getElementById('fullName');
        this.phoneInput = document.getElementById('phone');
        this.emailInput = document.getElementById('email');
        this.notesInput = document.getElementById('notes');
        
        // عناصر التأكيد
        this.confirmationDetails = document.getElementById('confirmationDetails');
        this.termsCheckbox = document.getElementById('termsAgreement');
        
        // النافذة المنبثقة
        this.successModal = document.getElementById('successModal');
        this.successMessage = document.getElementById('successMessage');
        this.bookingInfo = document.getElementById('bookingInfo');
        this.printBtn = document.getElementById('printBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
    }

    /**
     * تحميل الخدمات
     */
    loadServices() {
        // محاولة تحميل الخدمات من localStorage
        let services = this.loadFromStorage('derma_services');
        let doctors = this.loadFromStorage('derma_doctors');
        
        // إذا لم توجد بيانات، استخدام البيانات الافتراضية
        if (!services || services.length === 0) {
            services = window.defaultServices || [];
            this.saveToStorage('derma_services', services);
        }
        
        if (!doctors || doctors.length === 0) {
            doctors = window.defaultDoctors || [];
            this.saveToStorage('derma_doctors', doctors);
        }
        
        this.services = services;
        this.doctors = doctors;
        
        this.renderServices();
        this.populateServiceSelect();
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // أحداث أزرار الحجز
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevStep());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextStep());
        if (this.submitBtn) this.submitBtn.addEventListener('click', (e) => this.submitBooking(e));
        
        // أحداث تغيير الخدمات والأطباء
        if (this.serviceSelect) {
            this.serviceSelect.addEventListener('change', (e) => this.onServiceChange(e));
        }
        
        if (this.doctorSelect) {
            this.doctorSelect.addEventListener('change', (e) => this.onDoctorChange(e));
        }
        
        // أحداث النافذة المنبثقة
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => this.printReceipt());
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeSuccessModal());
        }
        
        // إغلاق النافذة بالنقر خارجها
        if (this.successModal) {
            this.successModal.addEventListener('click', (e) => {
                if (e.target === this.successModal) {
                    this.closeSuccessModal();
                }
            });
        }
        
        // تحديث التأكيد عند تغيير الحقول
        const fieldsToWatch = [
            'serviceSelect', 'doctorSelect', 'appointmentDate',
            'appointmentTime', 'fullName', 'phone', 'email'
        ];
        
        fieldsToWatch.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.updateConfirmation());
                field.addEventListener('change', () => this.updateConfirmation());
            }
        });
    }

    /**
     * إعداد انتقاء التاريخ
     */
    setupDatePicker() {
        if (!this.dateInput) return;
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // تعيين الحد الأدنى (غداً)
        this.dateInput.min = tomorrow.toISOString().split('T')[0];
        
        // تعيين تاريخ افتراضي (بعد 3 أيام)
        const defaultDate = new Date(today);
        defaultDate.setDate(defaultDate.getDate() + 3);
        this.dateInput.value = defaultDate.toISOString().split('T')[0];
        
        // تحديث بيانات الحجز
        this.bookingData.date = this.dateInput.value;
    }

    /**
     * إعداد الأوقات المتاحة
     */
    setupTimeSlots() {
        if (!this.timeSelect) return;
        
        const timeSlots = this.generateTimeSlots();
        
        this.timeSelect.innerHTML = `
            <option value="">اختر الوقت المناسب</option>
            ${timeSlots.map(time => `
                <option value="${time}">${time}</option>
            `).join('')}
        `;
    }

    /**
     * إعداد القائمة المتنقلة للجوال
     */
    setupMobileMenu() {
        if (!this.navToggle || !this.navMenu) return;
        
        this.navToggle.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
            const icon = this.navToggle.querySelector('i');
            
            if (this.navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // إغلاق القائمة عند النقر على رابط
        const navLinks = this.navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.navMenu.classList.remove('active');
                const icon = this.navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    /**
     * إعداد التمرير السلس
     */
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#' || targetId === '#!') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    
                    // إغلاق القائمة المتنقلة إذا كانت مفتوحة
                    const navMenu = document.querySelector('.nav-menu');
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        const toggleBtn = document.querySelector('.nav-toggle i');
                        if (toggleBtn) {
                            toggleBtn.classList.remove('fa-times');
                            toggleBtn.classList.add('fa-bars');
                        }
                    }
                    
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * إعداد شريط التنقل المتحرك
     */
    setupNavbarScroll() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        });
    }

    // ------------------------------------------------------------------------
    // طرق عرض البيانات
    // ------------------------------------------------------------------------

    /**
     * عرض الخدمات
     */
    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid || !this.services) return;
        
        servicesGrid.innerHTML = this.services.map(service => `
            <div class="service-card">
                <div class="service-icon">
                    <i class="${service.icon || 'fas fa-stethoscope'}"></i>
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
                
                <button class="btn btn-primary" onclick="app.selectService(${service.id})">
                    <i class="fas fa-calendar-plus"></i> احجز الآن
                </button>
            </div>
        `).join('');
    }

    /**
     * تعبئة قائمة الخدمات
     */
    populateServiceSelect() {
        if (!this.serviceSelect || !this.services) return;
        
        this.serviceSelect.innerHTML = `
            <option value="">اختر الخدمة المطلوبة</option>
            ${this.services.map(service => `
                <option value="${service.id}" data-price="${service.price}">
                    ${service.name} - ${service.price} ريال
                </option>
            `).join('')}
        `;
    }

    /**
     * توليد الأوقات المتاحة
     */
    generateTimeSlots() {
        const slots = [];
        const startHour = 9; // 9 صباحاً
        const endHour = 21;  // 9 مساءً
        
        for (let hour = startHour; hour <= endHour; hour++) {
            // إضافة الوقت على الساعة
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            
            // إضافة الوقت ونصف الساعة (ما عدا الساعة الأخيرة)
            if (hour < endHour) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        
        return slots;
    }

    /**
     * تحديث الروابط النشطة في شريط التنقل
     */
    updateActiveNavLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && 
                scrollPosition < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === `#${currentSection}` || 
                (currentSection === '' && href === '#home')) {
                link.classList.add('active');
            }
        });
    }

    // ------------------------------------------------------------------------
    // طرق نظام الحجز
    // ------------------------------------------------------------------------

    /**
     * اختيار خدمة
     */
    selectService(serviceId) {
        if (this.serviceSelect) {
            this.serviceSelect.value = serviceId;
            this.onServiceChange({ target: this.serviceSelect });
        }
        
        // التمرير إلى قسم الحجز
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // الانتقال إلى الخطوة التالية بعد تأخير بسيط
        setTimeout(() => {
            this.nextStep();
        }, 300);
    }

    /**
     * عند تغيير الخدمة
     */
    onServiceChange(e) {
        const serviceId = parseInt(e.target.value);
        
        if (!serviceId || !this.doctors || !this.doctorSelect) {
            return;
        }
        
        // تصفية الأطباء الذين يقدمون هذه الخدمة
        const availableDoctors = this.doctors.filter(doctor => 
            doctor.services && doctor.services.includes(serviceId)
        );
        
        this.doctorSelect.innerHTML = `
            <option value="">اختر الطبيب</option>
            ${availableDoctors.map(doctor => `
                <option value="${doctor.id}">
                    ${doctor.name} - ${doctor.specialty}
                </option>
            `).join('')}
        `;
        
        // تحديث بيانات الحجز
        this.bookingData.serviceId = serviceId;
        
        // الحصول على بيانات الخدمة
        const selectedService = this.services.find(s => s.id === serviceId);
        if (selectedService) {
            this.bookingData.serviceName = selectedService.name;
            this.bookingData.servicePrice = selectedService.price;
        }
    }

    /**
     * عند تغيير الطبيب
     */
    onDoctorChange(e) {
        const doctorId = parseInt(e.target.value);
        
        if (!doctorId || !this.doctors) {
            return;
        }
        
        // تحديث بيانات الحجز
        this.bookingData.doctorId = doctorId;
        
        // الحصول على بيانات الطبيب
        const selectedDoctor = this.doctors.find(d => d.id === doctorId);
        if (selectedDoctor) {
            this.bookingData.doctorName = selectedDoctor.name;
            this.bookingData.doctorSpecialty = selectedDoctor.specialty;
        }
    }

    /**
     * التالي في الخطوات
     */
    nextStep() {
        if (this.currentStep >= this.totalSteps) return;
        
        // التحقق من صحة الخطوة الحالية
        if (!this.validateStep(this.currentStep)) {
            return;
        }
        
        // تحديث بيانات الحجز
        this.updateBookingData();
        
        // الانتقال للخطوة التالية
        this.changeStep(this.currentStep + 1);
    }

    /**
     * السابق في الخطوات
     */
    prevStep() {
        if (this.currentStep <= 1) return;
        
        // العودة للخطوة السابقة
        this.changeStep(this.currentStep - 1);
    }

    /**
     * تغيير الخطوة
     */
    changeStep(newStep) {
        // التحقق من النطاق الصحيح
        if (newStep < 1 || newStep > this.totalSteps) {
            console.error('رقم الخطوة غير صحيح:', newStep);
            return;
        }
        
        // تحديث حالة الخطوات المرئية
        this.steps.forEach(step => {
            const stepNumber = parseInt(step.getAttribute('data-step'));
            step.classList.toggle('active', stepNumber === newStep);
        });
        
        // تحديث نموذج الخطوات
        this.formSteps.forEach(step => {
            const stepNumber = parseInt(step.id.replace('step', ''));
            step.classList.toggle('active', stepNumber === newStep);
        });
        
        // تحديث الخطوة الحالية
        this.currentStep = newStep;
        
        // تحديث حالة الأزرار
        this.updateButtons();
        
        // إذا كانت الخطوة الأخيرة، تحديث تفاصيل التأكيد
        if (this.currentStep === this.totalSteps) {
            this.updateConfirmation();
        }
    }

    /**
     * تحديث حالة الأزرار
     */
    updateButtons() {
        if (!this.prevBtn || !this.nextBtn || !this.submitBtn) return;
        
        // زر السابق
        this.prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        
        // زر التالي
        this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'flex' : 'none';
        
        // زر التأكيد
        this.submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
    }

    /**
     * التحقق من صحة الخطوة
     */
    validateStep(step) {
        switch(step) {
            case 1: // اختيار الخدمة والطبيب
                return this.validateStep1();
                
            case 2: // اختيار التاريخ والوقت
                return this.validateStep2();
                
            case 3: // المعلومات الشخصية
                return this.validateStep3();
                
            case 4: // التأكيد والموافقة
                return this.validateStep4();
                
            default:
                return true;
        }
    }

    /**
     * التحقق من الخطوة 1
     */
    validateStep1() {
        if (!this.serviceSelect || !this.doctorSelect) return false;
        
        if (!this.serviceSelect.value) {
            this.showError('يرجى اختيار الخدمة المطلوبة');
            this.serviceSelect.focus();
            return false;
        }
        
        if (!this.doctorSelect.value) {
            this.showError('يرجى اختيار الطبيب');
            this.doctorSelect.focus();
            return false;
        }
        
        return true;
    }

    /**
     * التحقق من الخطوة 2
     */
    validateStep2() {
        if (!this.dateInput || !this.timeSelect) return false;
        
        if (!this.dateInput.value) {
            this.showError('يرجى اختيار تاريخ الموعد');
            this.dateInput.focus();
            return false;
        }
        
        if (!this.timeSelect.value) {
            this.showError('يرجى اختيار وقت الموعد');
            this.timeSelect.focus();
            return false;
        }
        
        return true;
    }

    /**
     * التحقق من الخطوة 3
     */
    validateStep3() {
        if (!this.fullNameInput || !this.phoneInput || !this.emailInput) {
            return false;
        }
        
        // التحقق من الاسم
        if (!this.fullNameInput.value.trim()) {
            this.showError('يرجى إدخال الاسم الكامل');
            this.fullNameInput.focus();
            return false;
        }
        
        // التحقق من رقم الهاتف
        const phone = this.phoneInput.value.trim();
        if (!phone) {
            this.showError('يرجى إدخال رقم الهاتف');
            this.phoneInput.focus();
            return false;
        }
        
        const phoneRegex = /^05\d{8}$/;
        if (!phoneRegex.test(phone)) {
            this.showError('يرجى إدخال رقم هاتف صحيح (يبدأ بـ 05 ويتكون من 10 أرقام)');
            this.phoneInput.focus();
            return false;
        }
        
        // التحقق من البريد الإلكتروني
        const email = this.emailInput.value.trim();
        if (!email) {
            this.showError('يرجى إدخال البريد الإلكتروني');
            this.emailInput.focus();
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('يرجى إدخال بريد إلكتروني صحيح');
            this.emailInput.focus();
            return false;
        }
        
        return true;
    }

    /**
     * التحقق من الخطوة 4
     */
    validateStep4() {
        if (!this.termsCheckbox) return false;
        
        if (!this.termsCheckbox.checked) {
            this.showError('يرجى الموافقة على الشروط والأحكام');
            this.termsCheckbox.focus();
            return false;
        }
        
        return true;
    }

    /**
     * تحديث بيانات الحجز
     */
    updateBookingData() {
        switch(this.currentStep) {
            case 1:
                this.bookingData.serviceId = parseInt(this.serviceSelect.value);
                this.bookingData.doctorId = parseInt(this.doctorSelect.value);
                break;
                
            case 2:
                this.bookingData.date = this.dateInput.value;
                this.bookingData.time = this.timeSelect.value;
                break;
                
            case 3:
                this.bookingData.fullName = this.fullNameInput.value.trim();
                this.bookingData.phone = this.phoneInput.value.trim();
                this.bookingData.email = this.emailInput.value.trim();
                this.bookingData.notes = this.notesInput.value.trim();
                break;
        }
    }

    /**
     * تحديث تفاصيل التأكيد
     */
    updateConfirmation() {
        if (!this.confirmationDetails) return;
        
        // جمع البيانات الحالية
        const serviceName = this.serviceSelect?.options[this.serviceSelect?.selectedIndex]?.text || 'لم يتم الاختيار';
        const doctorName = this.doctorSelect?.options[this.doctorSelect?.selectedIndex]?.text || 'لم يتم الاختيار';
        const date = this.dateInput?.value ? this.formatDate(this.dateInput.value) : 'لم يتم الاختيار';
        const time = this.timeSelect?.options[this.timeSelect?.selectedIndex]?.text || 'لم يتم الاختيار';
        const name = this.fullNameInput?.value || 'لم يتم الإدخال';
        const phone = this.phoneInput?.value || 'لم يتم الإدخال';
        const email = this.emailInput?.value || 'لم يتم الإدخال';
        
        this.confirmationDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">الخدمة:</span>
                <span class="detail-value">${serviceName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الطبيب:</span>
                <span class="detail-value">${doctorName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">التاريخ:</span>
                <span class="detail-value">${date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الوقت:</span>
                <span class="detail-value">${time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الاسم:</span>
                <span class="detail-value">${name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الهاتف:</span>
                <span class="detail-value">${phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">${email}</span>
            </div>
        `;
    }

    /**
     * تقديم الحجز
     */
    submitBooking(e) {
        if (e) e.preventDefault();
        
        // التحقق النهائي
        if (!this.validateStep(this.totalSteps)) {
            return;
        }
        
        // تحديث البيانات النهائية
        this.updateBookingData();
        
        // إنشاء رقم حجز فريد
        const bookingId = this.generateBookingId();
        const confirmationCode = this.generateConfirmationCode();
        
        // إعداد بيانات الحجز النهائية
        const booking = {
            id: bookingId,
            confirmationCode: confirmationCode,
            ...this.bookingData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            totalPrice: this.bookingData.servicePrice || 0
        };
        
        // حفظ الحجز
        this.saveBooking(booking);
        
        // عرض رسالة النجاح
        this.showSuccessModal(booking);
    }

    /**
     * حفظ الحجز
     */
    saveBooking(booking) {
        try {
            // تحميل الحجوزات الحالية
            let bookings = this.loadFromStorage('derma_bookings') || [];
            
            // إضافة الحجز الجديد
            bookings.unshift(booking);
            
            // حفظ في localStorage
            this.saveToStorage('derma_bookings', bookings);
            
            console.log('تم حفظ الحجز:', booking.id);
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ الحجز:', error);
            return false;
        }
    }

    /**
     * عرض نافذة النجاح
     */
    showSuccessModal(booking) {
        if (!this.successModal || !this.successMessage || !this.bookingInfo) {
            return;
        }
        
        // تحديث الرسالة
        this.successMessage.innerHTML = `
            تم تأكيد حجز موعدك بنجاح!<br>
            سنقوم بالتواصل معك على الرقم <strong>${booking.phone}</strong> لتأكيد التفاصيل.
        `;
        
        // تحديث معلومات الحجز
        this.bookingInfo.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">رقم الحجز:</span>
                <span class="detail-value">${booking.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">رمز التأكيد:</span>
                <span class="detail-value">${booking.confirmationCode}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">التاريخ:</span>
                <span class="detail-value">${this.formatDate(booking.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الوقت:</span>
                <span class="detail-value">${booking.time}</span>
            </div>
        `;
        
        // حفظ بيانات الحجار للطباعة
        this.currentBooking = booking;
        
        // عرض النافذة
        this.successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * إغلاق نافذة النجاح
     */
    closeSuccessModal() {
        if (!this.successModal) return;
        
        this.successModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // إعادة تعيين النموذج
        this.resetBookingForm();
    }

    /**
     * طباعة الوصل
     */
    printReceipt() {
        if (!this.currentBooking) {
            this.showError('لا توجد بيانات للطباعة');
            return;
        }
        
        const receiptContent = this.generateReceiptHTML(this.currentBooking);
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        
        // الانتظار قليلاً لتحميل المحتوى ثم الطباعة
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    /**
     * إعادة تعيين نموذج الحجز
     */
    resetBookingForm() {
        // إعادة تعيين النموذج
        if (this.bookingForm) {
            this.bookingForm.reset();
        }
        
        // إعادة تعيين البيانات
        this.bookingData = {};
        this.currentBooking = null;
        
        // العودة إلى الخطوة الأولى
        this.changeStep(1);
        
        // إعادة تعيين التاريخ
        this.setupDatePicker();
        
        // إعادة تعيين قائمة الأطباء
        if (this.doctorSelect) {
            this.doctorSelect.innerHTML = '<option value="">اختر الطبيب</option>';
        }
        
        // تحديث التأكيد
        this.updateConfirmation();
    }

    // ------------------------------------------------------------------------
    // طرق مساعدة
    // ------------------------------------------------------------------------

    /**
     * عرض رسالة خطأ
     */
    showError(message) {
        // يمكن استبدال هذا بمكون رسالة خطأ أجمل
        alert(`❌ ${message}`);
    }

    /**
     * عرض رسالة نجاح
     */
    showSuccess(message) {
        // يمكن استبدال هذا بمكون رسالة نجاح أجمل
        alert(`✅ ${message}`);
    }

    /**
     * تنسيق التاريخ
     */
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

    /**
     * توليد رقم حجز فريد
     */
    generateBookingId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `DC-${timestamp}-${random}`;
    }

    /**
     * توليد رمز تأكيد
     */
    generateConfirmationCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    /**
     * توليد HTML للوصل
     */
    generateReceiptHTML(booking) {
        const service = this.services.find(s => s.id === booking.serviceId);
        const doctor = this.doctors.find(d => d.id === booking.doctorId);
        
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>وصل الحجز - عيادة ديرما كير</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Cairo', Arial, sans-serif; 
                        padding: 20px; 
                        color: #333;
                        line-height: 1.6;
                    }
                    .receipt {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 2px solid #7C3AED;
                        border-radius: 15px;
                        padding: 30px;
                        background: white;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px dashed #ddd;
                    }
                    .header h1 { 
                        color: #7C3AED; 
                        margin-bottom: 10px;
                        font-size: 24px;
                    }
                    .header h2 {
                        color: #1E293B;
                        font-size: 20px;
                        margin-bottom: 5px;
                    }
                    .booking-info {
                        margin: 20px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #1E293B;
                    }
                    .info-value {
                        color: #7C3AED;
                        font-weight: 500;
                    }
                    .total {
                        background: #F8FAFC;
                        padding: 15px;
                        border-radius: 10px;
                        margin: 20px 0;
                        text-align: center;
                        border: 2px solid #10B981;
                    }
                    .total .amount {
                        font-size: 28px;
                        color: #10B981;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px dashed #ddd;
                        color: #64748B;
                        font-size: 14px;
                    }
                    .qr-code {
                        text-align: center;
                        margin: 20px 0;
                        padding: 20px;
                        background: #f8f8f8;
                        border-radius: 10px;
                    }
                    .note {
                        background: #FEF3C7;
                        padding: 15px;
                        border-radius: 10px;
                        margin: 20px 0;
                        border-right: 4px solid #F59E0B;
                        color: #92400E;
                    }
                    @media print {
                        body { padding: 0; }
                        .receipt { border: none; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>عيادة ديرما كير</h1>
                        <h2>وصل تأكيد الحجز</h2>
                        <p>شكراً لثقتكم بنا</p>
                    </div>
                    
                    <div class="booking-info">
                        <div class="info-row">
                            <span class="info-label">رقم الحجز:</span>
                            <span class="info-value">${booking.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">رمز التأكيد:</span>
                            <span class="info-value">${booking.confirmationCode}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الحجز:</span>
                            <span class="info-value">${this.formatDate(new Date().toISOString())}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الموعد:</span>
                            <span class="info-value">${this.formatDate(booking.date)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">وقت الموعد:</span>
                            <span class="info-value">${booking.time}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الخدمة:</span>
                            <span class="info-value">${service?.name || 'غير محدد'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">الطبيب:</span>
                            <span class="info-value">${doctor?.name || 'غير محدد'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">اسم المريض:</span>
                            <span class="info-value">${booking.fullName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">رقم الهاتف:</span>
                            <span class="info-value">${booking.phone}</span>
                        </div>
                    </div>
                    
                    <div class="total">
                        <div>المبلغ الإجمالي</div>
                        <div class="amount">${booking.totalPrice || 0} ريال</div>
                        <div>شامل ضريبة القيمة المضافة</div>
                    </div>
                    
                    <div class="note">
                        <strong>ملاحظة هامة:</strong><br>
                        يرجى الحضور قبل الموعد بـ 15 دقيقة<br>
                        إحضار بطاقة الهوية الوطنية<br>
                        في حالة الإلغاء يرجى التواصل قبل 24 ساعة
                    </div>
                    
                    <div class="qr-code">
                        <p>يمكنك مسح الكود للوصول إلى تفاصيل حجزك</p>
                        <div style="margin: 20px auto; width: 150px; height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
                            [رمز QR سيظهر هنا]
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>عيادة ديرما كير - الرياض، حي الصحافة</p>
                        <p>هاتف: +966 11 123 4567 | البريد: info@dermacare.com</p>
                        <p>ساعات العمل: الأحد - الخميس 9ص - 9م | الجمعة - السبت 4م - 10م</p>
                        <p class="no-print">يمكنك طباعة هذا الوصل كإثبات للحجز</p>
                    </div>
                </div>
                
                <script>
                    // طباعة تلقائية
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            window.print();
                        }, 1000);
                    });
                </script>
            </body>
            </html>
        `;
    }

    /**
     * حفظ في localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`خطأ في حفظ ${key}:`, error);
            return false;
        }
    }

    /**
     * تحميل من localStorage
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`خطأ في تحميل ${key}:`, error);
            return null;
        }
    }
}

// ============================================================================
// تهيئة التطبيق عند تحميل الصفحة
// ============================================================================

let app;

document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new DermaCareClinic();
        window.app = app; // لجعل التطبيق متاحاً عالمياً
        
        console.log('✅ تم تحميل نظام عيادة ديرما كير بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل النظام:', error);
        
        // عرض رسالة خطأ للمستخدم
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #EF4444;
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 9999;
            font-family: 'Cairo', sans-serif;
        `;
        errorMessage.innerHTML = `
            <strong>حدث خطأ في تحميل النظام</strong><br>
            يرجى تحديث الصفحة أو التواصل مع الدعم الفني.
        `;
        document.body.appendChild(errorMessage);
    }
});

// ============================================================================
// وظائف مساعدة عامة
// ============================================================================

/**
 * تأخير تنفيذ الدالة
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * تقييد تكرار تنفيذ الدالة
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================================================
// دعم المتصفحات القديمة
// ============================================================================

// دعم forEach على NodeList للمتصفحات القديمة
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// دعم closest للمتصفحات القديمة
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.msMatchesSelector || 
        Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
