const pool = require('../config/database');

// إنشاء جدول الطلبات العامة إذا لم يكن موجوداً
const createGeneralRequestsTable = async () => {
    try {
        console.log('🔧 التحقق من وجود جدول الطلبات العامة...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS GeneralRequests (
                RequestID INT AUTO_INCREMENT PRIMARY KEY,
                RequestType VARCHAR(100) NOT NULL,
                RequestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                RequestDetails TEXT,
                IsFulfilled TINYINT(1) DEFAULT 0,
                FulfillmentDate DATETIME NULL,
                ResponsibleEmployeeID INT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (ResponsibleEmployeeID) REFERENCES Employees(EmployeeID) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await pool.execute(createTableQuery);
        console.log('✅ جدول الطلبات العامة جاهز');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول الطلبات العامة:', error);
    }
};

// استدعاء إنشاء الجدول عند بدء التشغيل
createGeneralRequestsTable();

// جلب إحصائيات الطلبات العامة من قاعدة البيانات الفعلية
const getGeneralRequestStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى الفعلية من قاعدة البيانات:', { fromDate, toDate });
        
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
        
        // إحصائيات عامة للشكاوى
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalRequests,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledRequests,
                SUM(CASE WHEN c.CurrentStatus NOT IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as unfulfilledRequests,
                ROUND((SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM Complaints c
            INNER JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
        `, params);
        
        // إحصائيات حسب نوع الشكوى
        const [typeStats] = await pool.execute(`
            SELECT 
                ct.TypeName as RequestType,
                COUNT(*) as requestCount,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledCount,
                SUM(CASE WHEN c.CurrentStatus NOT IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as unfulfilledCount,
                ROUND((SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM Complaints c
            INNER JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            HAVING requestCount > 0
            ORDER BY requestCount DESC
        `, params);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentName as RequestType,
                COUNT(*) as requestCount,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledCount,
                SUM(CASE WHEN c.CurrentStatus NOT IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as unfulfilledCount,
                ROUND((SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM Complaints c
            INNER JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING requestCount > 0
            ORDER BY requestCount DESC
        `, params);
        
        // معالجة النتائج الفارغة
        const generalStats = stats[0] || {
            totalRequests: 0,
            fulfilledRequests: 0,
            unfulfilledRequests: 0,
            fulfillmentRate: 0
        };
        
        console.log('📈 الإحصائيات العامة:', generalStats);
        console.log('📊 الإحصائيات حسب النوع:', typeStats);
        console.log('🏥 الإحصائيات حسب القسم:', departmentStats);
        
        res.json({
            success: true,
            data: {
                general: generalStats,
                byType: typeStats || [],
                byDepartment: departmentStats || []
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب أنواع الطلبات المتاحة من قاعدة البيانات الفعلية
const getAvailableRequestTypes = async (req, res) => {
    try {
        console.log('📋 جلب أنواع الشكاوى المتاحة من قاعدة البيانات...');
        
        // جلب أنواع الشكاوى الموجودة في قاعدة البيانات
        const [requestTypes] = await pool.execute(`
            SELECT DISTINCT ct.TypeName as name, COUNT(c.ComplaintID) as count
            FROM ComplaintTypes ct
            LEFT JOIN Complaints c ON ct.ComplaintTypeID = c.ComplaintTypeID
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            HAVING count > 0
            ORDER BY count DESC
        `);
        
        console.log('📊 أنواع الشكاوى المتاحة:', requestTypes);
        
        res.json({
            success: true,
            data: requestTypes.map(type => ({
                name: type.name,
                count: type.count
            }))
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب أنواع الشكاوى:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب أنواع الشكاوى',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب بيانات الشكاوى للتصدير من قاعدة البيانات الفعلية
const getGeneralRequestsForExport = async (req, res) => {
    try {
        const { fromDate, toDate, includeEmployeeData } = req.query;
        
        console.log('📊 جلب بيانات الشكاوى للتصدير:', { fromDate, toDate, includeEmployeeData });
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        let selectClause = `
            c.ComplaintID as RequestID,
            ct.TypeName as RequestType,
            c.ComplaintDate as RequestDate,
            c.ComplaintDetails as RequestDetails,
            CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END as IsFulfilled,
            c.ResolutionDate as FulfillmentDate,
            CASE 
                WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 'منفذ'
                ELSE 'غير منفذ'
            END as Status
        `;
        
        if (includeEmployeeData === 'true') {
            selectClause += `, e.FullName as EmployeeName`;
        }
        
        const [requests] = await pool.execute(`
            SELECT ${selectClause}
            FROM Complaints c
            INNER JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        console.log('📈 عدد الشكاوى للتصدير:', requests.length);
        
        res.json({
            success: true,
            data: {
                requests: requests || []
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات التصدير:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب بيانات التصدير',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب التحليل والاقتراحات من قاعدة البيانات الفعلية
const getGeneralRequestAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب تحليل الشكاوى:', { fromDate, toDate });
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // تحليل الأداء العام
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalRequests,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledRequests,
                SUM(CASE WHEN c.CurrentStatus NOT IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as unfulfilledRequests,
                ROUND((SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM Complaints c
            ${whereClause}
        `, params);
        
        // أنواع الشكاوى الأكثر شيوعاً
        const [topRequestTypes] = await pool.execute(`
            SELECT 
                ct.TypeName as RequestType,
                COUNT(*) as requestCount,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledCount,
                ROUND((SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM Complaints c
            INNER JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            ORDER BY requestCount DESC
            LIMIT 5
        `, params);
        
        // متوسط وقت الاستجابة
        const [responseTimeStats] = await pool.execute(`
            SELECT 
                AVG(DATEDIFF(c.ResolutionDate, c.ComplaintDate)) as avgResponseDays
            FROM Complaints c
            WHERE c.CurrentStatus IN ('مغلقة', 'تم الحل') AND c.ResolutionDate IS NOT NULL
            ${whereClause ? whereClause.replace('c.ComplaintDate', 'c.ComplaintDate') : ''}
        `, params);
        
        // الشكاوى الأكثر تأخيراً
        const [delayedRequests] = await pool.execute(`
            SELECT 
                c.ComplaintID as RequestID,
                ct.TypeName as RequestType,
                c.ComplaintDetails as RequestDetails,
                c.ComplaintDate as RequestDate,
                DATEDIFF(CURRENT_DATE, c.ComplaintDate) as daysPending
            FROM Complaints c
            INNER JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            WHERE c.CurrentStatus != 'مغلقة'
            ${whereClause ? whereClause.replace('c.ComplaintDate', 'c.ComplaintDate') : ''}
            ORDER BY daysPending DESC
            LIMIT 10
        `, params);
        
        // اقتراحات التحسين
        const suggestions = [];
        
        if (performanceStats[0] && performanceStats[0].fulfillmentRate < 80) {
            suggestions.push({
                title: 'تحسين معدل الحل',
                description: `معدل حل الشكاوى ${performanceStats[0].fulfillmentRate}% أقل من المستهدف (80%). يجب تحسين سرعة الاستجابة للشكاوى.`,
                priority: 'عالية',
                type: 'أداء'
            });
        }
        
        if (topRequestTypes.length > 0) {
            const slowestType = topRequestTypes.find(type => type.fulfillmentRate < 70);
            if (slowestType) {
                suggestions.push({
                    title: `تحسين أداء ${slowestType.RequestType}`,
                    description: `نوع الشكوى ${slowestType.RequestType} لديه معدل حل ${slowestType.fulfillmentRate}% فقط. يجب مراجعة إجراءات العمل.`,
                    priority: 'متوسطة',
                    type: 'نوع شكوى محدد'
                });
            }
        }
        
        if (responseTimeStats[0] && responseTimeStats[0].avgResponseDays > 7) {
            suggestions.push({
                title: 'تسريع الاستجابة للشكاوى',
                description: `متوسط وقت الاستجابة ${responseTimeStats[0].avgResponseDays.toFixed(1)} أيام. يجب تقليل وقت الاستجابة.`,
                priority: 'عالية',
                type: 'وقت الاستجابة'
            });
        }
        
        if (delayedRequests.length > 0) {
            suggestions.push({
                title: 'معالجة الشكاوى المتأخرة',
                description: `يوجد ${delayedRequests.length} شكوى متأخرة يحتاج إلى معالجة عاجلة.`,
                priority: 'عالية',
                type: 'شكاوى متأخرة'
            });
        }
        
        res.json({
            success: true,
            data: {
                performance: performanceStats[0] || {},
                topRequestTypes: topRequestTypes || [],
                responseTime: responseTimeStats[0] || {},
                delayedRequests: delayedRequests || [],
                suggestions: suggestions
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب التحليل:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب التحليل',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// إضافة طلب جديد
const addGeneralRequest = async (req, res) => {
    try {
        const { RequestType, RequestDetails, ResponsibleEmployeeID } = req.body;
        
        console.log('📝 إضافة طلب جديد:', { RequestType, RequestDetails, ResponsibleEmployeeID });
        
        // التحقق من البيانات المطلوبة
        if (!RequestType || !RequestDetails) {
            return res.status(400).json({
                success: false,
                message: 'نوع الطلب وتفاصيل الطلب مطلوبان'
            });
        }
        
        // إضافة الطلب إلى قاعدة البيانات
        const [result] = await pool.execute(`
            INSERT INTO GeneralRequests (RequestType, RequestDetails, ResponsibleEmployeeID)
            VALUES (?, ?, ?)
        `, [RequestType, RequestDetails, ResponsibleEmployeeID || null]);
        
        console.log('✅ تم إضافة الطلب بنجاح، ID:', result.insertId);
        
        res.json({
            success: true,
            message: 'تم إضافة الطلب بنجاح',
            data: {
                RequestID: result.insertId,
                RequestType,
                RequestDetails,
                ResponsibleEmployeeID
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في إضافة الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة الطلب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// تحديث حالة الطلب
const updateRequestStatus = async (req, res) => {
    try {
        const { RequestID } = req.params;
        const { IsFulfilled, FulfillmentDate } = req.body;
        
        console.log('🔄 تحديث حالة الطلب:', { RequestID, IsFulfilled, FulfillmentDate });
        
        // التحقق من وجود الطلب
        const [existingRequest] = await pool.execute(
            'SELECT * FROM GeneralRequests WHERE RequestID = ?',
            [RequestID]
        );
        
        if (existingRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }
        
        // تحديث حالة الطلب
        const updateQuery = `
            UPDATE GeneralRequests 
            SET IsFulfilled = ?, FulfillmentDate = ?
            WHERE RequestID = ?
        `;
        
        await pool.execute(updateQuery, [
            IsFulfilled ? 1 : 0,
            IsFulfilled ? (FulfillmentDate || new Date()) : null,
            RequestID
        ]);
        
        console.log('✅ تم تحديث حالة الطلب بنجاح');
        
        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث حالة الطلب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// دالة لفحص البيانات الموجودة في جدول الشكاوى
const checkExistingData = async (req, res) => {
    try {
        console.log('🔍 فحص البيانات الموجودة في جدول الشكاوى...');
        
        // جلب جميع الشكاوى
        const [allRequests] = await pool.execute(`
            SELECT 
                c.ComplaintID as RequestID,
                ct.TypeName as RequestType,
                c.ComplaintDate as RequestDate,
                c.ComplaintDetails as RequestDetails,
                CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END as IsFulfilled,
                c.ResolutionDate as FulfillmentDate,
                c.EmployeeID as ResponsibleEmployeeID
            FROM Complaints c
            INNER JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            ORDER BY c.ComplaintDate DESC
        `);
        
        // جلب إحصائيات سريعة
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalRequests,
                SUM(CASE WHEN c.CurrentStatus IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as fulfilledRequests,
                SUM(CASE WHEN c.CurrentStatus NOT IN ('مغلقة', 'تم الحل') THEN 1 ELSE 0 END) as unfulfilledRequests
            FROM Complaints c
        `);
        
        // جلب أنواع الشكاوى المختلفة
        const [requestTypes] = await pool.execute(`
            SELECT 
                ct.TypeName as RequestType,
                COUNT(c.ComplaintID) as count
            FROM ComplaintTypes ct
            LEFT JOIN Complaints c ON ct.ComplaintTypeID = c.ComplaintTypeID
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            HAVING count > 0
            ORDER BY count DESC
        `);
        
        console.log('📊 البيانات الموجودة:', {
            totalRequests: stats[0].totalRequests,
            fulfilledRequests: stats[0].fulfilledRequests,
            unfulfilledRequests: stats[0].unfulfilledRequests,
            requestTypes: requestTypes.length,
            sampleRequests: allRequests.slice(0, 5) // أول 5 شكاوى
        });
        
        res.json({
            success: true,
            data: {
                summary: stats[0],
                requestTypes: requestTypes,
                recentRequests: allRequests.slice(0, 10), // آخر 10 شكاوى
                totalCount: allRequests.length
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في فحص البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في فحص البيانات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getGeneralRequestStats,
    getGeneralRequestsForExport,
    getGeneralRequestAnalysis,
    getAvailableRequestTypes,
    addGeneralRequest,
    updateRequestStatus,
    checkExistingData
}; 