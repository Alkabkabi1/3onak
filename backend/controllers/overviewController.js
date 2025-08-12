const pool = require('../config/database');

// جلب إحصائيات النظرة العامة
const getOverviewStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات النظرة العامة:', { fromDate, toDate });
        console.log('🔍 الطلب وصل إلى الباك إند بنجاح');
        
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
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // إحصائيات عامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'تم الحل' THEN 1 ELSE 0 END) as resolvedComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'قيد المراجعة' THEN 1 ELSE 0 END) as pendingComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) as newComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'مرفوض' THEN 1 ELSE 0 END) as rejectedComplaints
            FROM Complaints c
            ${whereClause}
        `, params);
        
        // الشكاوى المتكررة
        const [repeatedStats] = await pool.execute(`
            SELECT COUNT(*) as repeatedCount
            FROM (
                SELECT p.NationalID_Iqama, c.ComplaintTypeID, COUNT(*) as complaintCount
                FROM Complaints c
                JOIN Patients p ON c.PatientID = p.PatientID
                ${whereClause}
                GROUP BY p.NationalID_Iqama, c.ComplaintTypeID
                HAVING COUNT(*) > 1
            ) repeated
        `, params);
        
        // تفاصيل الشكاوى المتكررة مع الأقسام
        const [repeatedComplaintsDetails] = await pool.execute(`
            SELECT 
                ct.TypeName as ComplaintType,
                d.DepartmentName,
                COUNT(*) as ComplaintCount
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY ct.TypeName, d.DepartmentName
            HAVING COUNT(*) > 1
            ORDER BY ComplaintCount DESC
        `, params);
        
        // أكثر الشكاوى تكراراً حسب النوع
        const [topComplaints] = await pool.execute(`
            SELECT 
                ct.TypeName as complaintType,
                COUNT(*) as count
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            ORDER BY count DESC
            LIMIT 5
        `, params);
        
        // الشكاوى الحساسة (الشكاوى العالية الأولوية)
        let sensitiveWhereClause = whereClause;
        let sensitiveParams = [...params];
        
        if (sensitiveWhereClause) {
            sensitiveWhereClause += ' AND (c.Priority = ? OR c.CurrentStatus != ?)';
            sensitiveParams.push('عالية', 'مغلقة');
        } else {
            sensitiveWhereClause = 'WHERE c.Priority = ? OR c.CurrentStatus != ?';
            sensitiveParams.push('عالية', 'مغلقة');
        }
        
        const [sensitiveComplaints] = await pool.execute(`
            SELECT 
                c.ComplaintID,
                c.ComplaintDetails,
                c.ComplaintDate,
                c.CurrentStatus,
                d.DepartmentName,
                ct.TypeName as complaintType,
                p.FullName as patientName
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            ${sensitiveWhereClause}
            ORDER BY c.ComplaintDate DESC
            LIMIT 10
        `, sensitiveParams);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            ORDER BY complaintCount DESC
        `, params);
        
        // معالجة النتائج
        const general = generalStats[0] || {
            totalComplaints: 0,
            resolvedComplaints: 0,
            pendingComplaints: 0,
            newComplaints: 0,
            rejectedComplaints: 0
        };
        
        const repeated = repeatedStats[0] || { repeatedCount: 0 };
        
        // حساب نسبة الشفافية
        const transparencyRate = general.totalComplaints > 0 
            ? Math.round((general.resolvedComplaints / general.totalComplaints) * 100)
            : 0;
        
        console.log('📈 إحصائيات النظرة العامة:', {
            general,
            repeated,
            transparencyRate,
            topComplaintsCount: topComplaints.length,
            sensitiveComplaintsCount: sensitiveComplaints.length,
            departmentStatsCount: departmentStats.length
        });
        
        const responseData = {
            success: true,
            data: {
                transparencyRate: transparencyRate + '%',
                underReview: general.pendingComplaints,
                newComplaint: general.newComplaints,
                repeatedComplaints: repeated.repeatedCount,
                totalComplaints: general.totalComplaints,
                resolvedComplaints: general.resolvedComplaints,
                topComplaints: topComplaints,
                sensitiveComplaints: sensitiveComplaints,
                departmentStats: departmentStats,
                repeatedComplaintsDetails: repeatedComplaintsDetails
            }
        };
        
        console.log('📤 إرسال البيانات إلى الفرونت:', responseData);
        res.json(responseData);
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات النظرة العامة:', error);
        console.error('🔍 تفاصيل الخطأ:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        // إرجاع بيانات فارغة بدلاً من خطأ إذا لم توجد بيانات
        if (error.code === 'ER_PARSE_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
            console.log('⚠️ إرجاع بيانات فارغة بسبب خطأ في قاعدة البيانات');
            const emptyData = {
                success: true,
                data: {
                    transparencyRate: '0%',
                    underReview: 0,
                    newComplaint: 0,
                    repeatedComplaints: 0,
                    totalComplaints: 0,
                    topComplaints: [],
                    sensitiveComplaints: [],
                    departmentStats: [],
                    repeatedComplaintsDetails: []
                }
            };
            console.log('📤 إرسال بيانات فارغة:', emptyData);
            res.json(emptyData);
        } else {
            const errorResponse = {
                success: false, 
                message: 'خطأ في جلب الإحصائيات',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            };
            console.log('📤 إرسال رسالة خطأ:', errorResponse);
            res.status(500).json(errorResponse);
        }
    }
};

// تصدير بيانات النظرة العامة
const exportOverviewData = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📤 تصدير بيانات النظرة العامة:', { fromDate, toDate });
        
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
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // جلب جميع البيانات للتصدير
        const [exportData] = await pool.execute(`
            SELECT 
                c.ComplaintID,
                c.ComplaintDate,
                c.ComplaintDetails,
                c.CurrentStatus,
                c.Priority,
                d.DepartmentName,
                ct.TypeName as complaintType,
                cst.SubTypeName,
                p.FullName as patientName,
                p.NationalID_Iqama,
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
                    exportDate: new Date().toISOString()
                }
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات النظرة العامة:', error);
        
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
                        exportDate: new Date().toISOString()
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
    getOverviewStats,
    exportOverviewData
}; 