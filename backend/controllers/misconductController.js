const pool = require('../config/database');
let ExcelJS;

// محاولة استيراد ExcelJS مع معالجة الخطأ
try {
    ExcelJS = require('exceljs');
} catch (error) {
    console.log('⚠️ مكتبة ExcelJS غير متوفرة، سيتم استخدام تصدير CSV كبديل');
    ExcelJS = null;
}

// التحقق من وجود نوع الشكوى "الكوادر الصحية وسلوكهم"
const checkMisconductType = async () => {
    try {
        const connection = await pool.getConnection();
        
        // التحقق من وجود نوع الشكوى
        const [complaintTypeResult] = await connection.execute(
            'SELECT ComplaintTypeID FROM ComplaintTypes WHERE TypeName = ?',
            ['الكوادر الصحية وسلوكهم']
        );
        
        if (complaintTypeResult.length === 0) {
            console.log('⚠️ نوع الشكوى "الكوادر الصحية وسلوكهم" غير موجود، سيتم إنشاؤه...');
            const [newTypeResult] = await connection.execute(
                'INSERT INTO ComplaintTypes (TypeName, Description) VALUES (?, ?)',
                ['الكوادر الصحية وسلوكهم', 'بلاغات تتعلق بسلوك الكوادر الصحية']
            );
            console.log('✅ تم إنشاء نوع الشكوى "الكوادر الصحية وسلوكهم" بنجاح');
        } else {
            console.log('✅ نوع الشكوى "الكوادر الصحية وسلوكهم" موجود بالفعل');
        }
        
        connection.release();
    } catch (error) {
        console.error('❌ خطأ في التحقق من نوع الشكوى:', error);
    }
};

// جلب إحصائيات بلاغات سوء التعامل
const getMisconductStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات بلاغات سوء التعامل:', { fromDate, toDate });
        
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
        
        let whereClause = 'WHERE c.ComplaintTypeID = (SELECT ComplaintTypeID FROM ComplaintTypes WHERE TypeName = "الكوادر الصحية وسلوكهم")';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // إحصائيات حسب القسم فقط
        let departmentStatsQuery = `
            SELECT 
                d.DepartmentName,
                COALESCE(COUNT(c.ComplaintID), 0) as reportCount
            FROM Departments d
            LEFT JOIN Complaints c ON d.DepartmentID = c.DepartmentID 
                AND c.ComplaintTypeID = (SELECT ComplaintTypeID FROM ComplaintTypes WHERE TypeName = "الكوادر الصحية وسلوكهم")
        `;
        
        if (fromDate && toDate) {
            departmentStatsQuery += ` AND c.ComplaintDate BETWEEN ? AND ?`;
        }
        
        departmentStatsQuery += `
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING reportCount > 0
            ORDER BY reportCount DESC, d.DepartmentName
        `;
        
        const [departmentStats] = await pool.execute(departmentStatsQuery, params);
        
        // إحصائيات عامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalReports,
                SUM(CASE WHEN c.CurrentStatus = 'تم الحل' THEN 1 ELSE 0 END) as resolvedReports,
                SUM(CASE WHEN c.CurrentStatus = 'قيد المراجعة' THEN 1 ELSE 0 END) as pendingReports,
                SUM(CASE WHEN c.CurrentStatus = 'مرفوض' THEN 1 ELSE 0 END) as rejectedReports
            FROM Complaints c
            ${whereClause}
        `, params);
        
        console.log('📈 الإحصائيات العامة لبلاغات سوء التعامل:', generalStats[0]);
        console.log('📊 الإحصائيات حسب القسم والتخصص:', departmentStats);
        
        res.json({
            success: true,
            data: {
                general: generalStats[0] || {
                    totalReports: 0,
                    resolvedReports: 0,
                    pendingReports: 0,
                    rejectedReports: 0
                },
                byDepartment: departmentStats || []
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات بلاغات سوء التعامل:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// تصدير بيانات بلاغات سوء التعامل
const exportMisconductData = async (req, res) => {
    try {
        const { fromDate, toDate, format = 'excel' } = req.query;
        
        console.log('📤 تصدير بيانات بلاغات سوء التعامل:', { fromDate, toDate, format });
        
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
        
        let whereClause = 'WHERE c.ComplaintTypeID = (SELECT ComplaintTypeID FROM ComplaintTypes WHERE TypeName = "الكوادر الصحية وسلوكهم")';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        const [reports] = await pool.execute(`
            SELECT
                c.ComplaintID as 'رقم البلاغ',
                DATE_FORMAT(c.ComplaintDate, '%Y-%m-%d') as 'تاريخ البلاغ',
                c.ComplaintDetails as 'تفاصيل البلاغ',
                c.CurrentStatus as 'الحالة الحالية',
                d.DepartmentName as 'القسم',
                COALESCE(cst.SubTypeName, 'غير محدد') as 'نوع سوء التعامل',
                COALESCE(p.FullName, 'غير محدد') as 'اسم المريض',
                COALESCE(p.NationalID_Iqama, 'غير محدد') as 'رقم الهوية/الإقامة',
                COALESCE(e.FullName, 'غير محدد') as 'اسم الموظف',
                COALESCE(e.Specialty, 'غير محدد') as 'التخصص المهني',
                COALESCE(c.ResolutionDetails, '') as 'تفاصيل الحل'
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        if (format === 'excel' && ExcelJS) {
            // تصدير كملف Excel
            await exportToExcel(res, reports, fromDate, toDate);
        } else {
            // تصدير كملف CSV
            await exportToCSV(res, reports, fromDate, toDate);
        }
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات بلاغات سوء التعامل:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تصدير البيانات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// تصدير إلى Excel
const exportToExcel = async (res, reports, fromDate, toDate) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('بلاغات سوء التعامل');
    
    // إضافة العنوان
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'تقرير بلاغات سوء التعامل';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    
    // إضافة معلومات الفترة الزمنية
    if (fromDate && toDate) {
        worksheet.mergeCells('A2:K2');
        const periodCell = worksheet.getCell('A2');
        periodCell.value = `الفترة الزمنية: من ${fromDate} إلى ${toDate}`;
        periodCell.font = { bold: true, size: 12 };
        periodCell.alignment = { horizontal: 'center' };
    }
    
    // إضافة العناوين
    if (reports.length > 0) {
        const headers = Object.keys(reports[0]);
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(4, index + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // إضافة البيانات
        reports.forEach((report, rowIndex) => {
            const dataRow = rowIndex + 5;
            Object.values(report).forEach((value, colIndex) => {
                const cell = worksheet.getCell(dataRow, colIndex + 1);
                cell.value = value;
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
        
        // ضبط عرض الأعمدة
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
    } else {
        // إذا لم توجد بيانات
        worksheet.mergeCells('A4:K4');
        const noDataCell = worksheet.getCell('A4');
        noDataCell.value = 'لا توجد بيانات بلاغات سوء التعامل في الفترة المحددة';
        noDataCell.alignment = { horizontal: 'center' };
        noDataCell.font = { italic: true };
    }
    
    // إعداد الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=misconduct-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
    console.log('✅ تم تصدير ملف Excel بنجاح');
};

// تصدير إلى CSV
const exportToCSV = async (res, reports, fromDate, toDate) => {
    let csvContent = '';
    
    // إضافة العنوان
    csvContent += 'تقرير بلاغات سوء التعامل\n';
    
    // إضافة معلومات الفترة الزمنية
    if (fromDate && toDate) {
        csvContent += `الفترة الزمنية: من ${fromDate} إلى ${toDate}\n`;
    }
    
    csvContent += '\n';
    
    if (reports.length > 0) {
        // إضافة العناوين
        const headers = Object.keys(reports[0]);
        csvContent += headers.join(',') + '\n';
        
        // إضافة البيانات
        reports.forEach(report => {
            const row = Object.values(report).map(value => {
                // تنظيف القيم للـ CSV
                const cleanValue = String(value || '').replace(/"/g, '""');
                return `"${cleanValue}"`;
            });
            csvContent += row.join(',') + '\n';
        });
    } else {
        csvContent += 'لا توجد بيانات بلاغات سوء التعامل في الفترة المحددة\n';
    }
    
    // إعداد الاستجابة
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=misconduct-reports-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.send(csvContent);
    
    console.log('✅ تم تصدير ملف CSV بنجاح');
};

// التحقق من نوع الشكوى عند بدء التشغيل
checkMisconductType();

module.exports = {
    getMisconductStats,
    exportMisconductData
}; 