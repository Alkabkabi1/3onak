const pool = require('../config/database');




// داش بورد الاكسبورت  + inperson complaints
// جلب إحصائيات الشكاوى حسب الفترة
const getComplaintStats = async (req, res) => {
  try {
    const { fromDate, toDate, includePatientData, includeEmployeeData } = req.query;
    
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
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalComplaints,
        SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closedComplaints,
        SUM(CASE WHEN c.CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) as inProgressComplaints,
        SUM(CASE WHEN c.CurrentStatus = 'مرفوضة' THEN 1 ELSE 0 END) as rejectedComplaints,
        SUM(CASE WHEN c.CurrentStatus = 'معلقة' THEN 1 ELSE 0 END) as pendingComplaints
      FROM Complaints c
      ${whereClause}
    `, params);
    
    console.log('Query result:', stats);
    
    // الشكاوى المتكررة (نفس المريض، نفس النوع)
    const [repeatedComplaints] = await pool.execute(`
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
    
    // إحصائيات حسب القسم
    const [departmentStats] = await pool.execute(`
      SELECT 
        d.DepartmentName,
        COUNT(c.ComplaintID) as complaintCount
      FROM Complaints c
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      ${whereClause}
      GROUP BY d.DepartmentID, d.DepartmentName
      ORDER BY complaintCount DESC
    `, params);
    
    // إحصائيات حسب نوع الشكوى
    const [typeStats] = await pool.execute(`
      SELECT 
        ct.TypeName,
        COUNT(c.ComplaintID) as complaintCount
      FROM Complaints c
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      ${whereClause}
      GROUP BY ct.ComplaintTypeID, ct.TypeName
      ORDER BY complaintCount DESC
    `, params);
    
    // معالجة النتائج الفارغة
    const generalStats = stats[0] || {
      totalComplaints: 0,
      closedComplaints: 0,
      inProgressComplaints: 0,
      rejectedComplaints: 0,
      pendingComplaints: 0
    };
    
    const repeatedStats = repeatedComplaints[0] || { repeatedCount: 0 };
    
    console.log('General stats:', generalStats);
    console.log('Repeated stats:', repeatedStats);
    
    res.json({
      success: true,
      data: {
        general: generalStats,
        repeated: repeatedStats,
        byDepartment: departmentStats || [],
        byType: typeStats || []
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الإحصائيات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// جلب بيانات الشكاوى للتصدير
const getComplaintsForExport = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      includePatientData, 
      includeEmployeeData,
      dataTypes 
    } = req.query;
    
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
    
    // إضافة فلترة حسب نوع البيانات المطلوبة
    if (dataTypes) {
      const dataTypesArray = dataTypes.split(',');
      
      if (dataTypesArray.includes('closed')) {
        whereClause += whereClause ? ' AND c.CurrentStatus = "مغلقة"' : 'WHERE c.CurrentStatus = "مغلقة"';
      } else if (dataTypesArray.includes('unanswered')) {
        whereClause += whereClause ? ' AND c.CurrentStatus = "معلقة"' : 'WHERE c.CurrentStatus = "معلقة"';
      } else if (dataTypesArray.includes('repeated')) {
        // الشكاوى المتكررة تحتاج معالجة خاصة
        whereClause += whereClause ? ' AND c.ComplaintID IN (SELECT c2.ComplaintID FROM Complaints c2 JOIN Patients p2 ON c2.PatientID = p2.PatientID GROUP BY p2.NationalID_Iqama, c2.ComplaintTypeID HAVING COUNT(*) > 1)' : 'WHERE c.ComplaintID IN (SELECT c2.ComplaintID FROM Complaints c2 JOIN Patients p2 ON c2.PatientID = p2.PatientID GROUP BY p2.NationalID_Iqama, c2.ComplaintTypeID HAVING COUNT(*) > 1)';
      }
    }
    
    // بناء الاستعلام حسب نوع البيانات المطلوبة
    let selectFields = `
      c.ComplaintID,
      c.ComplaintDate,
      c.ComplaintDetails,
      c.CurrentStatus,
      d.DepartmentName,
      ct.TypeName as ComplaintType,
      cst.SubTypeName,
      p.FullName as PatientName,
      p.NationalID_Iqama as NationalID
    `;
    
    if (includePatientData === 'true') {
      selectFields += `,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.Gender,
        p.ContactNumber
      `;
    }
    
    if (includeEmployeeData === 'true') {
      selectFields += `,
        e.FullName as EmployeeName,
        e.EmployeeID
      `;
    }
    
    const [complaints] = await pool.execute(`
      SELECT ${selectFields}
      FROM Complaints c
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
      JOIN Patients p ON c.PatientID = p.PatientID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      ${whereClause}
      ORDER BY c.ComplaintDate DESC
    `, params);
    
    console.log('Complaints found:', complaints.length);
    
    // جلب الردود إذا كانت مطلوبة
    let responses = [];
    if (dataTypes && (dataTypes.includes('responses') || dataTypes.includes('all'))) {
      const complaintIds = complaints.map(c => c.ComplaintID);
      if (complaintIds.length > 0) {
        const [responsesData] = await pool.execute(`
          SELECT 
            cr.ComplaintID,
            cr.ResponseText,
            cr.ResponseDate,
            cr.ResponseType,
            e.FullName as EmployeeName
          FROM ComplaintResponses cr
          LEFT JOIN Employees e ON cr.EmployeeID = e.EmployeeID
          WHERE cr.ComplaintID IN (${complaintIds.map(() => '?').join(',')})
          ORDER BY cr.ResponseDate DESC
        `, complaintIds);
        responses = responsesData;
      }
    }
    
    // جلب المرفقات إذا كانت مطلوبة
    let attachments = [];
    if (dataTypes && (dataTypes.includes('attachments') || dataTypes.includes('all'))) {
      const complaintIds = complaints.map(c => c.ComplaintID);
      if (complaintIds.length > 0) {
        const [attachmentsData] = await pool.execute(`
          SELECT 
            ca.ComplaintID,
            ca.FileName,
            ca.FileType,
            ca.FileSize,
            ca.FilePath
          FROM ComplaintAttachments ca
          WHERE ca.ComplaintID IN (${complaintIds.map(() => '?').join(',')})
        `, complaintIds);
        attachments = attachmentsData;
      }
    }
    
    res.json({
      success: true,
      data: {
        complaints: complaints || [],
        responses: responses || [],
        attachments: attachments || []
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب بيانات التصدير:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب بيانات التصدير',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// تحليل الشكاوى وإنتاج اقتراحات التحسين
const getAnalysisAndSuggestions = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
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
    
    // الأقسام الأكثر شكاوى
    const [topDepartments] = await pool.execute(`
      SELECT 
        d.DepartmentName,
        COUNT(c.ComplaintID) as complaintCount,
        ROUND(COUNT(c.ComplaintID) * 100.0 / (SELECT COUNT(*) FROM Complaints ${whereClause}), 2) as percentage
      FROM Complaints c
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      ${whereClause}
      GROUP BY d.DepartmentID, d.DepartmentName
      ORDER BY complaintCount DESC
      LIMIT 5
    `, params);
    
    // أنواع الشكاوى الأكثر شيوعاً
    const [topComplaintTypes] = await pool.execute(`
      SELECT 
        ct.TypeName,
        COUNT(c.ComplaintID) as complaintCount,
        ROUND(COUNT(c.ComplaintID) * 100.0 / (SELECT COUNT(*) FROM Complaints ${whereClause}), 2) as percentage
      FROM Complaints c
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      ${whereClause}
      GROUP BY ct.ComplaintTypeID, ct.TypeName
      ORDER BY complaintCount DESC
      LIMIT 5
    `, params);
    
    // متوسط وقت الاستجابة
    const [responseTime] = await pool.execute(`
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, c.ComplaintDate, cr.ResponseDate)) as avgResponseHours,
        MIN(TIMESTAMPDIFF(HOUR, c.ComplaintDate, cr.ResponseDate)) as minResponseHours,
        MAX(TIMESTAMPDIFF(HOUR, c.ComplaintDate, cr.ResponseDate)) as maxResponseHours
      FROM Complaints c
      JOIN ComplaintResponses cr ON c.ComplaintID = cr.ComplaintID
      ${whereClause}
    `, params);
    
    // اقتراحات التحسين
    const suggestions = [];
    
    if (topDepartments.length > 0) {
      const topDept = topDepartments[0];
      suggestions.push({
        type: 'department',
        title: 'تحسين الخدمة في قسم ' + topDept.DepartmentName,
        description: `هذا القسم يستقبل ${topDept.percentage}% من الشكاوى. يُنصح بمراجعة إجراءات العمل وتحسين الخدمة.`,
        priority: 'high'
      });
    }
    
    if (topComplaintTypes.length > 0) {
      const topType = topComplaintTypes[0];
      suggestions.push({
        type: 'complaint_type',
        title: 'معالجة مشكلة ' + topType.TypeName,
        description: `نوع الشكوى "${topType.TypeName}" يشكل ${topType.percentage}% من الشكاوى. يُنصح بمعالجة الأسباب الجذرية.`,
        priority: 'high'
      });
    }
    
    if (responseTime[0].avgResponseHours > 24) {
      suggestions.push({
        type: 'response_time',
        title: 'تحسين سرعة الاستجابة',
        description: `متوسط وقت الاستجابة ${Math.round(responseTime[0].avgResponseHours)} ساعة. يُنصح بتسريع إجراءات المعالجة.`,
        priority: 'medium'
      });
    }
    
    // معالجة النتائج الفارغة
    const responseTimeStats = responseTime[0] || {
      avgResponseHours: 0,
      minResponseHours: 0,
      maxResponseHours: 0
    };
    
    res.json({
      success: true,
      data: {
        topDepartments: topDepartments || [],
        topComplaintTypes: topComplaintTypes || [],
        responseTime: responseTimeStats,
        suggestions: suggestions || []
      }
    });
    
  } catch (error) {
    console.error('خطأ في تحليل الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تحليل البيانات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// جلب إحصائيات الشكاوى الحضورية
async function getInPersonComplaintsStats(req, res) {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى الحضورية:', { fromDate, toDate });
        
        // التحقق من صحة التواريخ
        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد تاريخ البداية والنهاية'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // جلب إحصائيات الشكاوى الحضورية حسب النوع والقسم
            const [rows] = await connection.execute(`
                SELECT 
                    ct.TypeName as complaintType,
                    d.DepartmentName as department,
                    COUNT(c.ComplaintID) as count
                FROM
                    Complaints c
                JOIN
                    ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
                JOIN
                    Departments d ON c.DepartmentID = d.DepartmentID
                WHERE
                    c.ComplaintDate BETWEEN ? AND ?
                GROUP BY
                    ct.TypeName, d.DepartmentName
                ORDER BY count DESC
            `, [fromDate, toDate]);

            console.log('📈 البيانات الخام من قاعدة البيانات:', rows);

            // تحويل البيانات إلى التنسيق المطلوب للواجهة الأمامية
            const chartData = {
                labels: [],
                datasets: [
                    {
                        label: 'عدد الشكاوى',
                        data: [],
                        backgroundColor: [],
                        borderColor: [],
                        borderWidth: 1
                    }
                ]
            };

            const summaryStats = {
                totalComplaints: 0,
                patientVisit: 0,
                doctorReport: 0,
                medicine: 0,
                misconduct: 0,
                explainStatus: 0,
                notReplied: 0,
                requestNote: 0,
                appointment: 0
            };

            const backgroundColors = [
                '#8E24AA', // Purple-700
                '#D81B60', // Pink-600
                '#00897B', // Teal-600
                '#FB8C00', // Orange-600
                '#43A047', // Green-600
                '#1E88E5', // Blue-600
                '#FDD835', // Yellow-600
                '#C0CA33', // Lime-600
                '#5E35B1'  // Deep Purple-700
            ];

            // تجميع البيانات حسب نوع الشكوى
            const complaintTypeStats = {};
            rows.forEach(row => {
                if (!complaintTypeStats[row.complaintType]) {
                    complaintTypeStats[row.complaintType] = 0;
                }
                complaintTypeStats[row.complaintType] += row.count;
                summaryStats.totalComplaints += row.count;
            });

            // تحويل البيانات إلى التنسيق المطلوب
            Object.keys(complaintTypeStats).forEach((complaintType, index) => {
                const count = complaintTypeStats[complaintType];
                
                chartData.labels.push(complaintType);
                chartData.datasets[0].data.push(count);
                chartData.datasets[0].backgroundColor.push(backgroundColors[index % backgroundColors.length]);
                chartData.datasets[0].borderColor.push(backgroundColors[index % backgroundColors.length]);

                // تحديث الإحصائيات المحددة بناءً على TypeName
                switch (complaintType) {
                    case 'الخدمات الطبية والعلاجية':
                        summaryStats.patientVisit += count;
                        break;
                    case 'الكوادر الصحية وسلوكهم':
                        summaryStats.doctorReport += count;
                        summaryStats.misconduct += count;
                        break;
                    case 'الصيدلية والدواء':
                        summaryStats.medicine += count;
                        break;
                    case 'المواعيد والتحويلات':
                        summaryStats.appointment += count;
                        break;
                    case 'الإجراءات الإدارية':
                        summaryStats.requestNote += count;
                        break;
                    case 'الخدمات الإلكترونية والتطبيقات':
                        summaryStats.notReplied += count;
                        break;
                    case 'الاستقبال وخدمة العملاء':
                        summaryStats.explainStatus += count;
                        break;
                }
            });

            console.log('✅ تم جلب البيانات بنجاح!');
            console.log('📊 البيانات المعالجة:', { chartData, summaryStats });

            res.json({
                success: true,
                data: { chartData, summaryStats }
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى الحضورية:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الشكاوى الحضورية',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// جلب بيانات الشكاوى الحضورية للتصدير
async function getInPersonComplaintsForExport(req, res) {
    try {
        const { fromDate, toDate } = req.query;

        console.log('📊 جلب بيانات الشكاوى الحضورية للتصدير:', { fromDate, toDate });

        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد تاريخ البداية والنهاية'
            });
        }

        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.execute(`
                SELECT
                    c.ComplaintID,
                    c.ComplaintDate,
                    c.ComplaintDetails,
                    c.CurrentStatus,
                    d.DepartmentName,
                    ct.TypeName as ComplaintType,
                    cst.SubTypeName,
                    p.FullName as PatientName,
                    p.NationalID_Iqama as NationalID,
                    e.FullName as EmployeeName
                FROM
                    Complaints c
                JOIN
                    ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
                JOIN
                    Departments d ON c.DepartmentID = d.DepartmentID
                LEFT JOIN
                    ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
                LEFT JOIN
                    Patients p ON c.PatientID = p.PatientID
                LEFT JOIN
                    Employees e ON c.EmployeeID = e.EmployeeID
                WHERE
                    c.ComplaintDate BETWEEN ? AND ?
                ORDER BY
                    c.ComplaintDate DESC
            `, [fromDate, toDate]);

            console.log('✅ تم جلب بيانات التصدير بنجاح!');
            console.log('📊 عدد السجلات المستلمة:', rows.length);
            console.log('📋 البيانات المستلمة للتصدير:', rows);

            // معالجة البيانات قبل الإرسال
            const processedRows = rows.map(row => ({
                ComplaintID: row.ComplaintID,
                ComplaintDate: row.ComplaintDate,
                ComplaintDetails: row.ComplaintDetails || 'غير محدد',
                CurrentStatus: row.CurrentStatus || 'غير محدد',
                DepartmentName: row.DepartmentName || 'غير محدد',
                ComplaintType: row.ComplaintType || 'غير محدد',
                SubTypeName: row.SubTypeName || 'غير محدد',
                PatientName: row.PatientName || 'غير محدد',
                NationalID: row.NationalID || 'غير محدد',
                EmployeeName: row.EmployeeName || 'غير محدد'
            }));

            console.log('📊 البيانات المعالجة للتصدير:', processedRows);

            res.json({
                success: true,
                data: processedRows,
                message: `تم جلب ${processedRows.length} سجل للتصدير`
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات الشكاوى الحضورية للتصدير:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الشكاوى الحضورية للتصدير',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = {
  getComplaintStats,
  getComplaintsForExport,
  getAnalysisAndSuggestions,
  getInPersonComplaintsStats,
  getInPersonComplaintsForExport
}; 