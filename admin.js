/**
 * نظام إدارة لوحة التحكم - عيادة ديرما كير
 * الملف الرئيسي لإدارة النظام
 * 
 * @author Badr Aldien
 * @version 1.0.0
 */

// ============================================================================
// الفئة الرئيسية لإدارة لوحة التحكم
// ============================================================================

class DermaCareAdmin {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredBookings = [];
        this.filteredServices = [];
        this.filteredDoctors = [];
        
        this.initializeAdmin();
        this.loadDashboardData();
        this.setupEventListeners();
        this.setupModals();
        this.setupSearch();
        this.setupFilters();
    }

    // ------------------------------------------------------------------------
    // طرق التهيئة
    // ------------------------------------------------------------------------

    /**
     * تهيئة لوحة التحكم
     */
    initializeAdmin() {
        this.setupElements();
        this.checkAdminSession();
        this.setupAutoLogout();
    }

    /**
     * إعداد العناصر
     */
    setupElements() {
        // عناصر الإحصائيات
        this.totalBookingsEl = document.getElementById('totalBookings');
        this.confirmedBookingsEl = document.getElementById('confirmedBookings');
        this.pendingBookingsEl = document.getElementById('pendingBookings');
        this.cancelledBookingsEl = document.getElementById('cancelledBookings');
        
        // عناصر الجدول
        this.bookingsTable = document.getElementById('bookingsTable');
        this.totalResultsEl = document.getElementById('totalResults');
        this.paginationEl = document.getElementById('pagination');
        
        // عناصر الفلاتر
        this.filterStatus = document.getElementById('filterStatus');
        this.filterDate = document.getElementById('filterDate');
        this.filterSearch = document.getElementById('filterSearch');
        this.applyFiltersBtn = document.getElementById('applyFilters');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        
        // عناصر الإدارة
        this.servicesList = document.getElementById('servicesList');
        this.doctorsList = document.getElementById('doctorsList');
        this.searchServices = document.getElementById('searchServices');
        this.searchDoctors = document.getElementById('searchDoctors');
        
        // الأزرار
        this.exportBtn = document.getElementById('exportBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.addServiceBtn = document.getElementById('addServiceBtn');
        this.addDoctorBtn = document.getElementById('addDoctorBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // الإعدادات
        this.clinicName = document.getElementById('clinicName');
        this.clinicPhone = document.getElementById('clinicPhone');
        this.clinicEmail = document.getElementById('clinicEmail');
        this.clinicAddress = document.getElementById('clinicAddress');
        this.clinicHours = document.getElementById('clinicHours');
    }

    /**
     * تحقق من جلسة المدير
     */
    checkAdminSession() {
        const session = localStorage.getItem('admin_session');
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            if (now - sessionData.loginTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('admin_session');
                window.location.href = 'login.html';
                return;
            }
            
            // تحديث وقت النشاط
            sessionData.lastActivity = now;
            localStorage.setItem('admin_session', JSON.stringify(sessionData));
            
        } catch (error) {
            console.error('خطأ في التحقق من الجلسة:', error);
            localStorage.removeItem('admin_session');
            window.location.href = 'login.html';
        }
    }

    /**
     * إعداد تسجيل الخروج التلقائي
     */
    setupAutoLogout() {
        let activityTimer;
        
        const resetTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                if (confirm('انتهت جلستك بسبب عدم النشاط. هل تريد البقاء مسجلاً؟')) {
                    resetTimer();
                } else {
                    this.logout();
                }
            }, 30 * 60 * 1000); // 30 دقيقة
        };
        
        // إضافة أحداث النشاط
        ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });
        
        resetTimer();
    }

    // ------------------------------------------------------------------------
    // طرق تحميل البيانات
    // ------------------------------------------------------------------------

    /**
     * تحميل بيانات اللوحة
     */
    loadDashboardData() {
        this.loadBookings();
        this.loadServices();
        this.loadDoctors();
        this.loadSettings();
        this.updateStats();
    }

    /**
     * تحميل الحجوزات
     */
    loadBookings() {
        try {
            const bookings = JSON.parse(localStorage.getItem('derma_bookings')) || [];
            this.allBookings = bookings;
            this.filteredBookings = [...bookings];
            this.renderBookingsTable();
            
        } catch (error) {
            console.error('خطأ في تحميل الحجوزات:', error);
            this.allBookings = [];
            this.filteredBookings = [];
            this.showTableError('لا يمكن تحميل الحجوزات');
        }
    }

    /**
     * تحميل الخدمات
     */
    loadServices() {
        try {
            const services = JSON.parse(localStorage.getItem('derma_services')) || window.defaultServices || [];
            this.allServices = services;
            this.filteredServices = [...services];
            this.renderServicesList();
            
        } catch (error) {
            console.error('خطأ في تحميل الخدمات:', error);
            this.allServices = window.defaultServices || [];
            this.filteredServices = [...this.allServices];
        }
    }

    /**
     * تحميل الأطباء
     */
    loadDoctors() {
        try {
            const doctors = JSON.parse(localStorage.getItem('derma_doctors')) || window.defaultDoctors || [];
            this.allDoctors = doctors;
            this.filteredDoctors = [...doctors];
            this.renderDoctorsList();
            
        } catch (error) {
            console.error('خطأ في تحميل الأطباء:', error);
            this.allDoctors = window.defaultDoctors || [];
            this.filteredDoctors = [...this.allDoctors];
        }
    }

    /**
     * تحميل الإعدادات
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('derma_settings')) || {};
            
            if (this.clinicName) this.clinicName.value = settings.clinicName || 'عيادة ديرما كير';
            if (this.clinicPhone) this.clinicPhone.value = settings.clinicPhone || '+966 11 123 4567';
            if (this.clinicEmail) this.clinicEmail.value = settings.clinicEmail || 'info@dermacare.com';
            if (this.clinicAddress) this.clinicAddress.value = settings.clinicAddress || 'الرياض، حي الصحافة، شارع الملك فهد';
            if (this.clinicHours) this.clinicHours.value = settings.clinicHours || 'الأحد - الخميس: 9 صباحاً - 9 مساءً\nالجمعة - السبت: 4 مساءً - 10 مساءً';
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
        }
    }

    /**
     * تحديث الإحصائيات
     */
    updateStats() {
        if (!this.allBookings) return;
        
        const total = this.allBookings.length;
        const confirmed = this.allBookings.filter(b => b.status === 'confirmed').length;
        const pending = this.allBookings.filter(b => b.status === 'pending').length;
        const cancelled = this.allBookings.filter(b => b.status === 'cancelled').length;
        
        if (this.totalBookingsEl) this.totalBookingsEl.textContent = total;
        if (this.confirmedBookingsEl) this.confirmedBookingsEl.textContent = confirmed;
        if (this.pendingBookingsEl) this.pendingBookingsEl.textContent = pending;
        if (this.cancelledBookingsEl) this.cancelledBookingsEl.textContent = cancelled;
    }

    // ------------------------------------------------------------------------
    // طرق العرض
    // ------------------------------------------------------------------------

    /**
     * عرض جدول الحجوزات
     */
    renderBookingsTable() {
        if (!this.bookingsTable || !this.filteredBookings) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageBookings = this.filteredBookings.slice(startIndex, endIndex);
        
        if (pageBookings.length === 0) {
            this.showTableEmpty();
            return;
        }
        
        this.bookingsTable.innerHTML = pageBookings.map((booking, index) => {
            const service = this.allServices?.find(s => s.id === booking.serviceId);
            const doctor = this.allDoctors?.find(d => d.id === booking.doctorId);
            
            return `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td><strong>${booking.id || 'N/A'}</strong></td>
                    <td>${booking.fullName || 'غير معروف'}</td>
                    <td>${service?.name || 'غير معروف'}</td>
                    <td>${doctor?.name || 'غير معروف'}</td>
                    <td>${this.formatDate(booking.date)}</td>
                    <td>${booking.time || 'غير محدد'}</td>
                    <td>${booking.phone || 'غير محدد'}</td>
                    <td>
                        <span class="status-badge status-${booking.status || 'pending'}">
                            ${this.getStatusText(booking.status)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="admin.viewBooking('${booking.id}')" title="عرض التفاصيل">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="admin.editBookingStatus('${booking.id}')" title="تغيير الحالة">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="admin.confirmDeleteBooking('${booking.id}')" title="حذف الحجز">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // تحديث معلومات النتائج
        if (this.totalResultsEl) {
            this.totalResultsEl.textContent = this.filteredBookings.length;
        }
        
        // عرض أزرار الترقيم
        this.renderPagination();
    }

    /**
     * عرض رسالة الجدول الفارغ
     */
    showTableEmpty() {
        if (!this.bookingsTable) return;
        
        this.bookingsTable.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h4>لا توجد حجوزات لعرضها</h4>
                        <p>لم يتم العثور على حجوزات تطابق معايير البحث</p>
                    </div>
                </td>
            </tr>
        `;
        
        if (this.totalResultsEl) {
            this.totalResultsEl.textContent = '0';
        }
        
        if (this.paginationEl) {
            this.paginationEl.innerHTML = '';
        }
    }

    /**
     * عرض رسالة خطأ في الجدول
     */
    showTableError(message) {
        if (!this.bookingsTable) return;
        
        this.bookingsTable.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>حدث خطأ</h4>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="admin.loadBookings()">
                            <i class="fas fa-sync-alt"></i> إعادة المحاولة
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * عرض أزرار الترقيم
     */
    renderPagination() {
        if (!this.paginationEl || !this.filteredBookings) return;
        
        const totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            this.paginationEl.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // زر الصفحة الأولى
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="admin.goToPage(1)" title="الصفحة الأولى">
                    <i class="fas fa-angle-double-right"></i>
                </button>
                <button class="pagination-btn" onclick="admin.goToPage(${this.currentPage - 1})" title="الصفحة السابقة">
                    <i class="fas fa-angle-right"></i>
                </button>
            `;
        }
        
        // أرقام الصفحات
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="admin.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // زر الصفحة التالية
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="admin.goToPage(${this.currentPage + 1})" title="الصفحة التالية">
                    <i class="fas fa-angle-left"></i>
                </button>
                <button class="pagination-btn" onclick="admin.goToPage(${totalPages})" title="الصفحة الأخيرة">
                    <i class="fas fa-angle-double-left"></i>
                </button>
            `;
        }
        
        this.paginationEl.innerHTML = paginationHTML;
    }

    /**
     * عرض قائمة الخدمات
     */
    renderServicesList() {
        if (!this.servicesList || !this.filteredServices) return;
        
        if (this.filteredServices.length === 0) {
            this.servicesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-concierge-bell"></i>
                    <h4>لا توجد خدمات</h4>
                    <p>قم بإضافة أول خدمة للنظام</p>
                </div>
            `;
            return;
        }
        
        this.servicesList.innerHTML = this.filteredServices.map(service => `
            <div class="item-card">
                <div class="item-header">
                    <h4 class="item-title">${service.name}</h4>
                    <div class="item-price">${service.price} ريال</div>
                </div>
                
                <p class="item-description">${service.description}</p>
                
                <div class="item-footer">
                    <div class="item-info">
                        <span><i class="fas fa-clock"></i> ${service.duration} دقيقة</span>
                        <span style="margin-right: 1rem;"><i class="fas fa-tag"></i> ${this.getCategoryText(service.category)}</span>
                    </div>
                    
                    <div class="item-actions">
                        <button class="edit" onclick="admin.editService(${service.id})" title="تعديل الخدمة">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete" onclick="admin.confirmDeleteService(${service.id})" title="حذف الخدمة">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * عرض قائمة الأطباء
     */
    renderDoctorsList() {
        if (!this.doctorsList || !this.filteredDoctors) return;
        
        if (this.filteredDoctors.length === 0) {
            this.doctorsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-md"></i>
                    <h4>لا توجد أطباء</h4>
                    <p>قم بإضافة أول طبيب للنظام</p>
                </div>
            `;
            return;
        }
        
        this.doctorsList.innerHTML = this.filteredDoctors.map(doctor => `
            <div class="item-card">
                <div class="item-header">
                    <h4 class="item-title">${doctor.name}</h4>
                    <div class="item-price">${doctor.experience} سنة خبرة</div>
                </div>
                
                <p class="item-description">${doctor.specialty}</p>
                
                <div class="item-footer">
                    <div class="item-info">
                        <span><i class="fas fa-stethoscope"></i> ${doctor.services?.length || 0} خدمة</span>
                    </div>
                    
                    <div class="item-actions">
                        <button class="edit" onclick="admin.editDoctor(${doctor.id})" title="تعديل بيانات الطبيب">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete" onclick="admin.confirmDeleteDoctor(${doctor.id})" title="حذف الطبيب">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * عرض تفاصيل الحجز
     */
    showBookingDetails(bookingId) {
        const booking = this.allBookings.find(b => b.id === bookingId);
        if (!booking) {
            this.showError('لم يتم العثور على الحجز');
            return;
        }
        
        const service = this.allServices?.find(s => s.id === booking.serviceId);
        const doctor = this.allDoctors?.find(d => d.id === booking.doctorId);
        
        const modalContent = document.getElementById('bookingDetailsContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="booking-details-grid">
                <div class="detail-group">
                    <h4>معلومات الحجز</h4>
                    <div class="detail-item">
                        <span class="detail-label">رقم الحجز:</span>
                        <span class="detail-value">${booking.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">تاريخ الحجز:</span>
                        <span class="detail-value">${this.formatDate(booking.createdAt)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">حالة الحجز:</span>
                        <span class="detail-value status-${booking.status}">
                            ${this.getStatusText(booking.status)}
                        </span>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h4>معلومات الموعد</h4>
                    <div class="detail-item">
                        <span class="detail-label">التاريخ:</span>
                        <span class="detail-value">${this.formatDate(booking.date)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">الوقت:</span>
                        <span class="detail-value">${booking.time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">الخدمة:</span>
                        <span class="detail-value">${service?.name || 'غير معروف'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">الطبيب:</span>
                        <span class="detail-value">${doctor?.name || 'غير معروف'}</span>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h4>معلومات المريض</h4>
                    <div class="detail-item">
                        <span class="detail-label">الاسم:</span>
                        <span class="detail-value">${booking.fullName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">الهاتف:</span>
                        <span class="detail-value">${booking.phone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">البريد الإلكتروني:</span>
                        <span class="detail-value">${booking.email}</span>
                    </div>
                    ${booking.notes ? `
                    <div class="detail-item">
                        <span class="detail-label">ملاحظات:</span>
                        <span class="detail-value">${booking.notes}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${booking.confirmationCode ? `
                <div class="detail-group">
                    <h4>معلومات إضافية</h4>
                    <div class="detail-item">
                        <span class="detail-label">رمز التأكيد:</span>
                        <span class="detail-value">${booking.confirmationCode}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">المبلغ:</span>
                        <span class="detail-value">${booking.totalPrice || service?.price || 0} ريال</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // حفظ معرف الحجار الحالي
        this.currentBookingId = bookingId;
        
        // عرض النافذة
        const modal = document.getElementById('bookingDetailsModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    // ------------------------------------------------------------------------
    // طرق الفلاتر والبحث
    // ------------------------------------------------------------------------

    /**
     * إعداد الفلاتر
     */
    setupFilters() {
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // البحث أثناء الكتابة
        if (this.filterSearch) {
            this.filterSearch.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => this.applyFilters(), 500);
            });
        }
    }

    /**
     * تطبيق الفلاتر
     */
    applyFilters() {
        if (!this.allBookings) return;
        
        let filtered = [...this.allBookings];
        
        // فلترة حسب الحالة
        const status = this.filterStatus?.value;
        if (status && status !== 'all') {
            filtered = filtered.filter(booking => booking.status === status);
        }
        
        // فلترة حسب التاريخ
        const date = this.filterDate?.value;
        if (date) {
            filtered = filtered.filter(booking => booking.date === date);
        }
        
        // فلترة حسب البحث
        const search = this.filterSearch?.value?.toLowerCase();
        if (search) {
            filtered = filtered.filter(booking => 
                (booking.fullName?.toLowerCase().includes(search)) ||
                (booking.phone?.includes(search)) ||
                (booking.email?.toLowerCase().includes(search)) ||
                (booking.id?.toLowerCase().includes(search))
            );
        }
        
        this.filteredBookings = filtered;
        this.currentPage = 1;
        this.renderBookingsTable();
    }

    /**
     * مسح الفلاتر
     */
    clearFilters() {
        if (this.filterStatus) this.filterStatus.value = 'all';
        if (this.filterDate) this.filterDate.value = '';
        if (this.filterSearch) this.filterSearch.value = '';
        
        this.filteredBookings = [...this.allBookings];
        this.currentPage = 1;
        this.renderBookingsTable();
    }

    /**
     * إعداد البحث
     */
    setupSearch() {
        // بحث الخدمات
        if (this.searchServices) {
            this.searchServices.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredServices = this.allServices.filter(service =>
                    service.name.toLowerCase().includes(searchTerm) ||
                    service.description.toLowerCase().includes(searchTerm)
                );
                this.renderServicesList();
            });
        }
        
        // بحث الأطباء
        if (this.searchDoctors) {
            this.searchDoctors.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredDoctors = this.allDoctors.filter(doctor =>
                    doctor.name.toLowerCase().includes(searchTerm) ||
                    doctor.specialty.toLowerCase().includes(searchTerm)
                );
                this.renderDoctorsList();
            });
        }
    }

    // ------------------------------------------------------------------------
    // طرق الإدارة
    // ------------------------------------------------------------------------

    /**
     * حفظ الإعدادات
     */
    saveSettings() {
        try {
            const settings = {
                clinicName: this.clinicName?.value || 'عيادة ديرما كير',
                clinicPhone: this.clinicPhone?.value || '+966 11 123 4567',
                clinicEmail: this.clinicEmail?.value || 'info@dermacare.com',
                clinicAddress: this.clinicAddress?.value || 'الرياض، حي الصحافة، شارع الملك فهد',
                clinicHours: this.clinicHours?.value || 'الأحد - الخميس: 9 صباحاً - 9 مساءً\nالجمعة - السبت: 4 مساءً - 10 مساءً',
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('derma_settings', JSON.stringify(settings));
            this.showSuccess('تم حفظ الإعدادات بنجاح');
            
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
            this.showError('حدث خطأ في حفظ الإعدادات');
        }
    }

    /**
     * تغيير حالة الحجز
     */
    changeBookingStatus(bookingId, newStatus) {
        try {
            const bookings = JSON.parse(localStorage.getItem('derma_bookings')) || [];
            const index = bookings.findIndex(b => b.id === bookingId);
            
            if (index === -1) {
                this.showError('لم يتم العثور على الحجز');
                return false;
            }
            
            bookings[index].status = newStatus;
            bookings[index].updatedAt = new Date().toISOString();
            
            localStorage.setItem('derma_bookings', JSON.stringify(bookings));
            
            // تحديث البيانات المحلية
            this.allBookings = bookings;
            this.filteredBookings = [...bookings];
            this.updateStats();
            this.renderBookingsTable();
            
            this.showSuccess(`تم تغيير حالة الحجز إلى "${this.getStatusText(newStatus)}"`);
            return true;
            
        } catch (error) {
            console.error('خطأ في تغيير حالة الحجز:', error);
            this.showError('حدث خطأ في تغيير حالة الحجز');
            return false;
        }
    }

    /**
     * حذف الحجز
     */
    deleteBooking(bookingId) {
        try {
            let bookings = JSON.parse(localStorage.getItem('derma_bookings')) || [];
            const initialLength = bookings.length;
            
            bookings = bookings.filter(b => b.id !== bookingId);
            
            if (bookings.length === initialLength) {
                this.showError('لم يتم العثور على الحجز');
                return false;
            }
            
            localStorage.setItem('derma_bookings', JSON.stringify(bookings));
            
            // تحديث البيانات المحلية
            this.allBookings = bookings;
            this.filteredBookings = [...bookings];
            this.updateStats();
            this.renderBookingsTable();
            
            this.showSuccess('تم حذف الحجز بنجاح');
            return true;
            
        } catch (error) {
            console.error('خطأ في حذف الحجز:', error);
            this.showError('حدث خطأ في حذف الحجز');
            return false;
        }
    }

    /**
     * إضافة خدمة جديدة
     */
    addService(serviceData) {
        try {
            let services = JSON.parse(localStorage.getItem('derma_services')) || [];
            
            // توليد معرف جديد
            const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
            
            const newService = {
                id: newId,
                ...serviceData,
                createdAt: new Date().toISOString(),
                isActive: true
            };
            
            services.push(newService);
            localStorage.setItem('derma_services', JSON.stringify(services));
            
            // تحديث البيانات المحلية
            this.allServices = services;
            this.filteredServices = [...services];
            this.renderServicesList();
            
            this.showSuccess('تم إضافة الخدمة بنجاح');
            return true;
            
        } catch (error) {
            console.error('خطأ في إضافة الخدمة:', error);
            this.showError('حدث خطأ في إضافة الخدمة');
            return false;
        }
    }

    /**
     * تحديث خدمة
     */
    updateService(serviceId, serviceData) {
        try {
            let services = JSON.parse(localStorage.getItem('derma_services')) || [];
            const index = services.findIndex(s => s.id === serviceId);
            
            if (index === -1) {
                this.showError('لم يتم العثور على الخدمة');
                return false;
            }
            
            services[index] = {
                ...services[index],
                ...serviceData,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('derma_services', JSON.stringify(services));
            
            // تحديث البيانات المحلية
            this.allServices = services;
            this.filteredServices = [...services];
            this.renderServicesList();
            
            this.showSuccess('تم تحديث الخدمة بنجاح');
            return true;
            
        } catch (error) {
            console.error('خطأ في تحديث الخدمة:', error);
            this.showError('حدث خطأ في تحديث الخدمة');
            return false;
        }
    }

    /**
     * حذف خدمة
     */
    deleteService(serviceId) {
        try {
            let services = JSON.parse(localStorage.getItem('derma_services')) || [];
            const initialLength = services.length;
            
            services = services.filter(s => s.id !== serviceId);
            
            if (services.length === initialLength) {
                this.showError('لم يتم العثور على الخدمة');
                return false;
            }
            
            localStorage.setItem('derma_services', JSON.stringify(services));
            
            // تحديث البيانات المحلية
            this.allServices = services;
            this.filteredServices = [...services];
            this.renderServicesList();
            
            this.showSuccess('تم حذف الخدمة بنجاح');
            return true;
            
        } catch (error) {
            console.error('خطأ في حذف الخدمة:', error);
            this.showError('حدث خطأ في حذف الخدمة');
            return false;
        }
    }

    // ------------------------------------------------------------------------
    // طرق النوافذ المنبثقة
    // ------------------------------------------------------------------------

    /**
     * إعداد النوافذ المنبثقة
     */
    setupModals() {
        this.setupServiceModal();
        this.setupDoctorModal();
        this.setupConfirmModal();
        this.setupBookingModal();
    }

    /**
     * إعداد نافذة الخدمة
     */
    setupServiceModal() {
        const modal = document.getElementById('serviceModal');
        const form = document.getElementById('serviceForm');
        const cancelBtn = document.getElementById('cancelServiceBtn');
        
        if (!modal || !form) return;
        
        // إغلاق النافذة
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                form.reset();
            });
        }
        
        // إرسال النموذج
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleServiceFormSubmit();
        });
    }

    /**
     * إعداد نافذة الطبيب
     */
    setupDoctorModal() {
        const modal = document.getElementById('doctorModal');
        const form = document.getElementById('doctorForm');
        const cancelBtn = document.getElementById('cancelDoctorBtn');
        
        if (!modal || !form) return;
        
        // إغلاق النافذة
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                form.reset();
            });
        }
        
        // إرسال النموذج
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDoctorFormSubmit();
        });
    }

    /**
     * إعداد نافذة التأكيد
     */
    setupConfirmModal() {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        if (!modal || !cancelBtn) return;
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    /**
     * إعداد نافذة الحجز
     */
    setupBookingModal() {
        const modal = document.getElementById('bookingDetailsModal');
        const closeBtn = document.getElementById('closeBookingModal');
        const confirmBtn = document.getElementById('confirmBookingBtn');
        const cancelBtn = document.getElementById('cancelBookingBtn');
        const rescheduleBtn = document.getElementById('rescheduleBookingBtn');
        
        if (!modal) return;
        
        // إغلاق النافذة
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        // تأكيد الحجز
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.currentBookingId) {
                    this.changeBookingStatus(this.currentBookingId, 'confirmed');
                    modal.classList.remove('active');
                }
            });
        }
        
        // إلغاء الحجز
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.currentBookingId) {
                    this.changeBookingStatus(this.currentBookingId, 'cancelled');
                    modal.classList.remove('active');
                }
            });
        }
        
        // إعادة جدولة (سيتم تطويرها لاحقاً)
        if (rescheduleBtn) {
            rescheduleBtn.addEventListener('click', () => {
                this.showError('ميزة إعادة الجدولة قيد التطوير');
            });
        }
    }

    // ------------------------------------------------------------------------
    // طرق معالجة النماذج
    // ------------------------------------------------------------------------

    /**
     * معالجة نموذج الخدمة
     */
    handleServiceFormSubmit() {
        const modal = document.getElementById('serviceModal');
        const form = document.getElementById('serviceForm');
        
        if (!form) return;
        
        const formData = {
            name: document.getElementById('serviceName').value.trim(),
            description: document.getElementById('serviceDescription').value.trim(),
            price: parseInt(document.getElementById('servicePrice').value),
            duration: parseInt(document.getElementById('serviceDuration').value),
            category: document.getElementById('serviceCategory').value,
            icon: document.getElementById('serviceIcon').value,
            features: ['جودة عالية', 'أسعار مناسبة', 'نتائج مضمونة'] // يمكن تطويرها لاحقاً
        };
        
        // التحقق من البيانات
        if (!formData.name || !formData.description || isNaN(formData.price) || isNaN(formData.duration)) {
            this.showError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
            return;
        }
        
        if (this.editingServiceId) {
            // تحديث خدمة موجودة
            this.updateService(this.editingServiceId, formData);
            this.editingServiceId = null;
        } else {
            // إضافة خدمة جديدة
            this.addService(formData);
        }
        
        // إغلاق النافذة وإعادة تعيين النموذج
        modal.classList.remove('active');
        form.reset();
    }

    /**
     * معالجة نموذج الطبيب
     */
    handleDoctorFormSubmit() {
        const modal = document.getElementById('doctorModal');
        const form = document.getElementById('doctorForm');
        
        if (!form) return;
        
        const servicesSelect = document.getElementById('doctorServices');
        const selectedServices = Array.from(servicesSelect.selectedOptions).map(option => 
            parseInt(option.value)
        );
        
        const formData = {
            name: document.getElementById('doctorName').value.trim(),
            specialty: document.getElementById('doctorSpecialty').value.trim(),
            experience: parseInt(document.getElementById('doctorExperience').value),
            bio: document.getElementById('doctorBio').value.trim(),
            services: selectedServices
        };
        
        // التحقق من البيانات
        if (!formData.name || !formData.specialty || isNaN(formData.experience)) {
            this.showError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
            return;
        }
        
        if (this.editingDoctorId) {
            // تحديث طبيب موجود
            this.updateDoctor(this.editingDoctorId, formData);
            this.editingDoctorId = null;
        } else {
            // إضافة طبيب جديد
            this.addDoctor(formData);
        }
        
        // إغلاق النافذة وإعادة تعيين النموذج
        modal.classList.remove('active');
        form.reset();
    }

    // ------------------------------------------------------------------------
    // طرق الأحداث
    // ------------------------------------------------------------------------

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // تحديث البيانات
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }
        
        // تصدير البيانات
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // إضافة خدمة
        if (this.addServiceBtn) {
            this.addServiceBtn.addEventListener('click', () => this.openServiceModal());
        }
        
        // إضافة طبيب
        if (this.addDoctorBtn) {
            this.addDoctorBtn.addEventListener('click', () => this.openDoctorModal());
        }
        
        // حفظ الإعدادات
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // تسجيل الخروج
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    /**
     * فتح نافذة الخدمة
     */
    openServiceModal(serviceId = null) {
        const modal = document.getElementById('serviceModal');
        const title = document.getElementById('serviceModalTitle');
        const form = document.getElementById('serviceForm');
        
        if (!modal || !title || !form) return;
        
        if (serviceId) {
            // تحرير خدمة موجودة
            const service = this.allServices.find(s => s.id === serviceId);
            if (!service) {
                this.showError('لم يتم العثور على الخدمة');
                return;
            }
            
            title.textContent = 'تعديل الخدمة';
            this.editingServiceId = serviceId;
            
            // تعبئة الحقول
            document.getElementById('serviceName').value = service.name;
            document.getElementById('serviceDescription').value = service.description;
            document.getElementById('servicePrice').value = service.price;
            document.getElementById('serviceDuration').value = service.duration;
            document.getElementById('serviceCategory').value = service.category;
            document.getElementById('serviceIcon').value = service.icon || 'fas fa-stethoscope';
            
        } else {
            // إضافة خدمة جديدة
            title.textContent = 'إضافة خدمة جديدة';
            this.editingServiceId = null;
            form.reset();
        }
        
        modal.classList.add('active');
    }

    /**
     * فتح نافذة الطبيب
     */
    openDoctorModal(doctorId = null) {
        const modal = document.getElementById('doctorModal');
        const title = document.getElementById('doctorModalTitle');
        const form = document.getElementById('doctorForm');
        const servicesSelect = document.getElementById('doctorServices');
        
        if (!modal || !title || !form || !servicesSelect) return;
        
        // تعبئة قائمة الخدمات
        this.populateDoctorServicesSelect();
        
        if (doctorId) {
            // تحرير طبيب موجود
            const doctor = this.allDoctors.find(d => d.id === doctorId);
            if (!doctor) {
                this.showError('لم يتم العثور على الطبيب');
                return;
            }
            
            title.textContent = 'تعديل بيانات الطبيب';
            this.editingDoctorId = doctorId;
            
            // تعبئة الحقول
            document.getElementById('doctorName').value = doctor.name;
            document.getElementById('doctorSpecialty').value = doctor.specialty;
            document.getElementById('doctorExperience').value = doctor.experience;
            document.getElementById('doctorBio').value = doctor.bio || '';
            
            // تعيين الخدمات المختارة
            Array.from(servicesSelect.options).forEach(option => {
                option.selected = doctor.services?.includes(parseInt(option.value)) || false;
            });
            
        } else {
            // إضافة طبيب جديد
            title.textContent = 'إضافة طبيب جديد';
            this.editingDoctorId = null;
            form.reset();
        }
        
        modal.classList.add('active');
    }

    /**
     * تعبئة قائمة خدمات الطبيب
     */
    populateDoctorServicesSelect() {
        const servicesSelect = document.getElementById('doctorServices');
        if (!servicesSelect || !this.allServices) return;
        
        servicesSelect.innerHTML = this.allServices.map(service => `
            <option value="${service.id}">${service.name}</option>
        `).join('');
    }

    // ------------------------------------------------------------------------
    // طرق التصدير
    // ------------------------------------------------------------------------

    /**
     * تصدير البيانات
     */
    exportData() {
        try {
            const data = {
                bookings: this.allBookings || [],
                services: this.allServices || [],
                doctors: this.allDoctors || [],
                settings: JSON.parse(localStorage.getItem('derma_settings')) || {},
                exportDate: new Date().toISOString(),
                exportVersion: '1.0.0'
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileName = `derma-care-backup-${new Date().toISOString().slice(0, 10)}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.click();
            
            this.showSuccess('تم تصدير البيانات بنجاح');
            
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showError('حدث خطأ في تصدير البيانات');
        }
    }

    // ------------------------------------------------------------------------
    // طرق مساعدة
    // ------------------------------------------------------------------------

    /**
     * تنسيق التاريخ
     */
    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * الحصول على نص الحالة
     */
    getStatusText(status) {
        const statusMap = {
            'pending': 'قيد الانتظار',
            'confirmed': 'مؤكد',
            'cancelled': 'ملغى',
            'completed': 'مكتمل'
        };
        
        return statusMap[status] || status || 'غير معروف';
    }

    /**
     * الحصول على نص الفئة
     */
    getCategoryText(category) {
        const categoryMap = {
            'laser': 'علاجات الليزر',
            'injections': 'الحقن التجميلية',
            'skin': 'علاجات البشرة',
            'hair': 'علاجات الشعر',
            'other': 'خدمات أخرى'
        };
        
        return categoryMap[category] || category || 'أخرى';
    }

    /**
     * الانتقال إلى صفحة
     */
    goToPage(page) {
        if (page < 1 || page > Math.ceil(this.filteredBookings.length / this.itemsPerPage)) {
            return;
        }
        
        this.currentPage = page;
        this.renderBookingsTable();
        
        // التمرير لأعلى الجدول
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * عرض رسالة نجاح
     */
    showSuccess(message) {
        // يمكن تطوير هذا لعرض إشعار أجمل
        alert(`✅ ${message}`);
    }

    /**
     * عرض رسالة خطأ
     */
    showError(message) {
        // يمكن تطوير هذا لعرض إشعار أجمل
        alert(`❌ ${message}`);
    }

    /**
     * عرض رسالة تأكيد
     */
    showConfirm(message, callback) {
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const actionBtn = document.getElementById('confirmActionBtn');
        
        if (!modal || !title || !confirmMessage || !actionBtn) {
            if (confirm(message)) {
                callback();
            }
            return;
        }
        
        title.textContent = 'تأكيد الإجراء';
        confirmMessage.textContent = message;
        
        const originalClick = actionBtn.onclick;
        actionBtn.onclick = () => {
            modal.classList.remove('active');
            callback();
        };
        
        modal.classList.add('active');
        
        // استعادة الحد الأصلي عند الإغلاق
        const closeHandler = () => {
            actionBtn.onclick = originalClick;
            modal.removeEventListener('click', closeHandler);
        };
        
        modal.addEventListener('click', closeHandler);
    }

    /**
     * تسجيل الخروج
     */
    logout() {
        if (confirm('هل تريد تسجيل الخروج من لوحة التحكم؟')) {
            localStorage.removeItem('admin_session');
            window.location.href = 'login.html';
        }
    }

    // ------------------------------------------------------------------------
    // واجهات عامة للاستخدام من HTML
    // ------------------------------------------------------------------------

    /**
     * عرض تفاصيل الحجز
     */
    viewBooking(bookingId) {
        this.showBookingDetails(bookingId);
    }

    /**
     * تحرير حالة الحجز
     */
    editBookingStatus(bookingId) {
        const booking = this.allBookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        const currentStatus = booking.status;
        const statusOptions = {
            'pending': 'قيد الانتظار',
            'confirmed': 'مؤكد',
            'cancelled': 'ملغى',
            'completed': 'مكتمل'
        };
        
        let optionsHTML = '';
        for (const [value, text] of Object.entries(statusOptions)) {
            const selected = value === currentStatus ? 'selected' : '';
            optionsHTML += `<option value="${value}" ${selected}>${text}</option>`;
        }
        
        const newStatus = prompt(
            `تغيير حالة الحجز ${bookingId}\nاختر الحالة الجديدة:`,
            currentStatus
        );
        
        if (newStatus && newStatus !== currentStatus && statusOptions[newStatus]) {
            this.changeBookingStatus(bookingId, newStatus);
        }
    }

    /**
     * تأكيد حذف الحجز
     */
    confirmDeleteBooking(bookingId) {
        this.showConfirm(
            'هل أنت متأكد من حذف هذا الحجز؟ هذا الإجراء لا يمكن التراجع عنه.',
            () => this.deleteBooking(bookingId)
        );
    }

    /**
     * تحرير خدمة
     */
    editService(serviceId) {
        this.openServiceModal(serviceId);
    }

    /**
     * تأكيد حذف خدمة
     */
    confirmDeleteService(serviceId) {
        this.showConfirm(
            'هل أنت متأكد من حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.',
            () => this.deleteService(serviceId)
        );
    }

    /**
     * تحرير طبيب
     */
    editDoctor(doctorId) {
        this.openDoctorModal(doctorId);
    }

    /**
     * تأكيد حذف طبيب
     */
    confirmDeleteDoctor(doctorId) {
        this.showConfirm(
            'هل أنت متأكد من حذف هذا الطبيب؟ هذا الإجراء لا يمكن التراجع عنه.',
            () => this.deleteDoctor(doctorId)
        );
    }
}

// ============================================================================
// تهيئة النظام عند تحميل الصفحة
// ============================================================================

let admin;

document.addEventListener('DOMContentLoaded', function() {
    try {
        admin = new DermaCareAdmin();
        window.admin = admin; // لجعل النظام متاحاً عالمياً
        
        console.log('✅ تم تحميل لوحة التحكم بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل لوحة التحكم:', error);
        
        // عرض رسالة خطأ
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
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
        errorDiv.innerHTML = `
            <strong>حدث خطأ في تحميل لوحة التحكم</strong><br>
            يرجى تحديث الصفحة أو التواصل مع الدعم الفني.
        `;
        document.body.appendChild(errorDiv);
    }
});

// ============================================================================
// وظائف إضافية (يمكن تطويرها لاحقاً)
// ============================================================================

// ملاحظة: الدوال التالية يمكن تطويرها في إصدارات لاحقة

DermaCareAdmin.prototype.addDoctor = function(doctorData) {
    console.log('إضافة طبيب جديد:', doctorData);
    // TODO: تنفيذ إضافة طبيب
    this.showError('ميزة إضافة الأطباء قيد التطوير');
};

DermaCareAdmin.prototype.updateDoctor = function(doctorId, doctorData) {
    console.log('تحديث طبيب:', doctorId, doctorData);
    // TODO: تنفيذ تحديث طبيب
    this.showError('ميزة تحديث الأطباء قيد التطوير');
};

DermaCareAdmin.prototype.deleteDoctor = function(doctorId) {
    console.log('حذف طبيب:', doctorId);
    // TODO: تنفيذ حذف طبيب
    this.showError('ميزة حذف الأطباء قيد التطوير');
};
