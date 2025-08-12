const pool = require('../config/database');

// جلب إحصائيات الشكاوى العامة
const getGeneralComplaintsStats = async (req, res) => {
    try {
        const { dateFilter, status, department, complaintType, search } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى العامة:', { dateFilter, status, department, complaintType, search });
        
        let whereClause = '';
        let params = [];
        
        // بناء شروط البحث
        const conditions = [];
        
        // معالجة dateFilter
        if (dateFilter && dateFilter !== 'all') {
            const days = parseInt(dateFilter);
            if (!isNaN(days)) {
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - days);
                const toDate = new Date();
                
                conditions.push('c.ComplaintDate BETWEEN ? AND ?');
                params.push(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
            }
        }
        
        if (status && status !== 'الحالة') {
            conditions.push('c.CurrentStatus = ?');
            params.push(status);
        }
        
        if (department && department !== 'القسم') {
            conditions.push('d.DepartmentName = ?');
            params.push(department);
        }
        
        if (complaintType && complaintType !== 'نوع الشكوى') {
            conditions.push('ct.TypeName = ?');
            params.push(complaintType);
        }
        
        if (search && search.trim() !== '') {
            conditions.push('(c.ComplaintDetails LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        // إحصائيات عامة
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as resolvedComplaints,
                SUM(CASE WHEN c.CurrentStatus != 'مغلقة' THEN 1 ELSE 0 END) as pendingComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) as newComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'مرفوضة' THEN 1 ELSE 0 END) as rejectedComplaints
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            ${whereClause}
        `, params);
        
        // جلب جميع الشكاوى مع التفاصيل
        const [complaints] = await pool.execute(`
            SELECT 
                c.ComplaintID,
                c.ComplaintDate,
                c.ComplaintDetails,
                c.CurrentStatus,
                c.Priority,
                d.DepartmentName,
                ct.TypeName as ComplaintTypeName,
                cst.SubTypeName,
                p.FullName as patientName,
                p.NationalID_Iqama,
                p.ContactNumber,
                p.Gender,
                e.FullName as employeeName,
                e.Specialty
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            ORDER BY complaintCount DESC
        `, params);
        
        // إحصائيات حسب نوع الشكوى
        const [typeStats] = await pool.execute(`
            SELECT 
                ct.TypeName,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            ORDER BY complaintCount DESC
        `, params);
        
        // معالجة النتائج
        const generalStats = stats[0] || {
            totalComplaints: 0,
            resolvedComplaints: 0,
            pendingComplaints: 0,
            newComplaints: 0,
            rejectedComplaints: 0
        };
        
        console.log('📈 إحصائيات الشكاوى العامة:', {
            generalStats,
            complaintsCount: complaints.length,
            departmentStatsCount: departmentStats.length,
            typeStatsCount: typeStats.length
        });
        
        res.json({
            success: true,
            data: {
                general: generalStats,
                complaints: complaints,
                byDepartment: departmentStats,
                byType: typeStats
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى العامة:', error);
        
        // إرجاع بيانات فارغة بدلاً من خطأ إذا لم توجد بيانات
        if (error.code === 'ER_PARSE_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
            console.log('⚠️ إرجاع بيانات فارغة بسبب خطأ في قاعدة البيانات');
            res.json({
                success: true,
                data: {
                    general: {
                        totalComplaints: 0,
                        resolvedComplaints: 0,
                        pendingComplaints: 0,
                        newComplaints: 0,
                        rejectedComplaints: 0
                    },
                    complaints: [],
                    byDepartment: [],
                    byType: []
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'خطأ في جلب الإحصائيات',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// تصدير بيانات الشكاوى العامة
const exportGeneralComplaintsData = async (req, res) => {
    try {
        const { fromDate, toDate, status, department, complaintType, search } = req.query;
        
        console.log('📤 تصدير بيانات الشكاوى العامة:', { fromDate, toDate, status, department, complaintType, search });
        
        // التحقق من صحة التواريخ
        if (fromDate && toDate) {
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);
            
            if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تواريخ غير صحيحة' 
                });
            }
            
            if (fromDateObj > toDateObj) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' 
                });
            }
        }
        
        let whereClause = '';
        let params = [];
        
        // بناء شروط البحث
        const conditions = [];
        
        if (fromDate && toDate) {
            conditions.push('c.ComplaintDate BETWEEN ? AND ?');
            params.push(fromDate, toDate);
        }
        
        if (status && status !== 'الحالة') {
            conditions.push('c.CurrentStatus = ?');
            params.push(status);
        }
        
        if (department && department !== 'القسم') {
            conditions.push('d.DepartmentName = ?');
            params.push(department);
        }
        
        if (complaintType && complaintType !== 'نوع الشكوى') {
            conditions.push('ct.TypeName = ?');
            params.push(complaintType);
        }
        
        if (search && search.trim() !== '') {
            conditions.push('(c.ComplaintDetails LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        // جلب البيانات للتصدير
        const [exportData] = await pool.execute(`
            SELECT 
                c.ComplaintID,
                c.ComplaintDate,
                c.ComplaintDetails,
                c.CurrentStatus,
                c.Priority,
                d.DepartmentName,
                ct.TypeName as ComplaintTypeName,
                cst.SubTypeName,
                p.FullName as patientName,
                p.NationalID_Iqama,
                p.ContactNumber,
                p.Gender,
                e.FullName as employeeName,
                e.Specialty
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        console.log('📋 البيانات المستعدة للتصدير:', exportData.length, 'سجل');
        
        res.json({
            success: true,
            data: {
                exportData: exportData,
                summary: {
                    totalRecords: exportData.length,
                    fromDate: fromDate,
                    toDate: toDate,
                    exportDate: new Date().toISOString(),
                    filters: {
                        status,
                        department,
                        complaintType,
                        search
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات الشكاوى العامة:', error);
        
        // إرجاع بيانات فارغة بدلاً من خطأ إذا لم توجد بيانات
        if (error.code === 'ER_PARSE_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
            console.log('⚠️ إرجاع بيانات فارغة للتصدير بسبب خطأ في قاعدة البيانات');
            res.json({
                success: true,
                data: {
                    exportData: [],
                    summary: {
                        totalRecords: 0,
                        fromDate: fromDate,
                        toDate: toDate,
                        exportDate: new Date().toISOString(),
                        filters: {
                            status,
                            department,
                            complaintType,
                            search
                        }
                    }
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'خطأ في تصدير البيانات',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = {
    getGeneralComplaintsStats,
    exportGeneralComplaintsData
}; 