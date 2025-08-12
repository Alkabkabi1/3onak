const pool = require('../config/database');
const ExcelJS = require('exceljs');

// جلب إحصائيات الشكاوى الحضورية
const getInPersonComplaintsStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى الحضورية:', { fromDate, toDate });
        
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
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // جلب البيانات حسب نوع الشكوى والقسم
        const [complaintsByTypeAndDepartment] = await pool.execute(`
            SELECT 
                ct.TypeName as ComplaintType,
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName, d.DepartmentID, d.DepartmentName
            ORDER BY ct.TypeName, d.DepartmentName
        `, params);
        
        // جلب إحصائيات عامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                COUNT(DISTINCT c.PatientID) as uniquePatients,
                COUNT(DISTINCT c.DepartmentID) as departmentsCount,
                COUNT(DISTINCT c.ComplaintTypeID) as complaintTypesCount
            FROM Complaints c
            ${whereClause}
        `, params);
        
        // جلب البيانات حسب نوع الشكوى فقط
        const [complaintsByType] = await pool.execute(`
            SELECT 
                ct.TypeName as ComplaintType,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            ${whereClause}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            ORDER BY complaintCount DESC
        `, params);
        
        // جلب البيانات حسب القسم فقط
        const [complaintsByDepartment] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM Complaints c
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            ORDER BY complaintCount DESC
        `, params);
        
        console.log('📈 الإحصائيات العامة:', generalStats[0]);
        console.log('📊 الشكاوى حسب النوع والقسم:', complaintsByTypeAndDepartment);
        console.log('🏷️ الشكاوى حسب النوع:', complaintsByType);
        console.log('🏥 الشكاوى حسب القسم:', complaintsByDepartment);
        
        // تحضير البيانات للرسم البياني
        const chartData = prepareChartData(complaintsByTypeAndDepartment, complaintsByType, complaintsByDepartment);
        
        res.json({
            success: true,
            data: {
                general: generalStats[0] || {
                    totalComplaints: 0,
                    uniquePatients: 0,
                    departmentsCount: 0,
                    complaintTypesCount: 0
                },
                byTypeAndDepartment: complaintsByTypeAndDepartment || [],
                byType: complaintsByType || [],
                byDepartment: complaintsByDepartment || [],
                chartData: chartData
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى الحضورية:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// تحضير البيانات للرسم البياني
function prepareChartData(complaintsByTypeAndDepartment, complaintsByType, complaintsByDepartment) {
    // تحديد الأقسام الفريدة
    const departments = [...new Set(complaintsByDepartment.map(item => item.DepartmentName))];
    
    // تحديد أنواع الشكاوى الفريدة
    const complaintTypes = [...new Set(complaintsByType.map(item => item.ComplaintType))];
    
    // إنشاء خريطة للبيانات
    const dataMap = new Map();
    
    complaintsByTypeAndDepartment.forEach(item => {
        const key = `${item.ComplaintType}-${item.DepartmentName}`;
        dataMap.set(key, item.complaintCount);
    });
    
    // تحضير البيانات للرسم البياني
    const datasets = complaintTypes.map(type => {
        const data = departments.map(dept => {
            const key = `${type}-${dept}`;
            return dataMap.get(key) || 0;
        });
        
        return {
            label: type,
            data: data,
            backgroundColor: getComplaintTypeColor(type),
            borderColor: getComplaintTypeBorderColor(type),
            borderWidth: 1,
            borderRadius: 3,
        };
    });
    
    return {
        labels: departments,
        datasets: datasets
    };
}

// الحصول على لون نوع الشكوى
function getComplaintTypeColor(type) {
    const colors = {
        'الخدمات الطبية والعلاجية': '#8E24AA', // Purple
        'الكوادر الصحية وسلوكهم': '#D32F2F', // Red
        'الصيدلية والدواء': '#1976D2', // Blue
        'المواعيد والتحويلات': '#9E9E9E', // Grey
        'الإجراءات الإدارية': '#FFEB3B', // Yellow
        'الخدمات الإلكترونية والتطبيقات': '#4CAF50', // Green
        'الاستقبال وخدمة العملاء': '#F57C00', // Orange
        'خدمات المرضى العامة': '#4FC3F7', // Light Blue
        'الدعم المنزلي والرعاية المستمرة': '#795548', // Brown
        'تجربة الزوار والمرافقين': '#E91E63', // Pink
        'خدمات الطوارئ والإسعاف': '#FF5722', // Deep Orange
        'خدمات التأهيل والعلاج الطبيعي': '#607D8B', // Blue Grey
        'الخصوصية وسرية المعلومات': '#9C27B0', // Purple
        'التثقيف والتوعية الصحية': '#00BCD4', // Cyan
        'بيئة المستشفى والبنية التحتية': '#8BC34A', // Light Green
        'السلامة ومكافحة العدوى': '#FF9800', // Orange
        'خدمات الدعم الفني والأنظمة': '#673AB7', // Deep Purple
        'القبول والتحويل الداخلي بين الأقسام': '#3F51B5', // Indigo
        'التقييم بعد المعالجة': '#009688', // Teal
        'ملاحظات المرضى الدوليين': '#FFC107' // Amber
    };
    
    return colors[type] || '#9E9E9E';
}

// الحصول على لون حدود نوع الشكوى
function getComplaintTypeBorderColor(type) {
    const colors = {
        'الخدمات الطبية والعلاجية': '#6A1B9A',
        'الكوادر الصحية وسلوكهم': '#C62828',
        'الصيدلية والدواء': '#1565C0',
        'المواعيد والتحويلات': '#757575',
        'الإجراءات الإدارية': '#FDD835',
        'الخدمات الإلكترونية والتطبيقات': '#388E3C',
        'الاستقبال وخدمة العملاء': '#EF6C00',
        'خدمات المرضى العامة': '#29B6F6',
        'الدعم المنزلي والرعاية المستمرة': '#5D4037',
        'تجربة الزوار والمرافقين': '#C2185B',
        'خدمات الطوارئ والإسعاف': '#D84315',
        'خدمات التأهيل والعلاج الطبيعي': '#455A64',
        'الخصوصية وسرية المعلومات': '#7B1FA2',
        'التثقيف والتوعية الصحية': '#00ACC1',
        'بيئة المستشفى والبنية التحتية': '#689F38',
        'السلامة ومكافحة العدوى': '#E65100',
        'خدمات الدعم الفني والأنظمة': '#512DA8',
        'القبول والتحويل الداخلي بين الأقسام': '#303F9F',
        'التقييم بعد المعالجة': '#00695C',
        'ملاحظات المرضى الدوليين': '#FF8F00'
    };
    
    return colors[type] || '#757575';
}

// تصدير بيانات الشكاوى الحضورية
const exportInPersonComplaintsData = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📤 تصدير بيانات الشكاوى الحضورية:', { fromDate, toDate });
        
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
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        const [reports] = await pool.execute(`
            SELECT
                c.ComplaintID as 'رقم الشكوى',
                DATE_FORMAT(c.ComplaintDate, '%Y-%m-%d') as 'تاريخ الشكوى',
                ct.TypeName as 'نوع الشكوى',
                cst.SubTypeName as 'النوع الفرعي',
                d.DepartmentName as 'القسم',
                c.ComplaintDetails as 'تفاصيل الشكوى',
                c.CurrentStatus as 'الحالة الحالية',
                COALESCE(p.FullName, 'غير محدد') as 'اسم المريض',
                COALESCE(p.NationalID_Iqama, 'غير محدد') as 'رقم الهوية/الإقامة',
                COALESCE(e.FullName, 'غير محدد') as 'اسم الموظف',
                COALESCE(e.Specialty, 'غير محدد') as 'التخصص المهني',
                COALESCE(c.ResolutionDetails, '') as 'تفاصيل الحل',
                DATE_FORMAT(c.ResolutionDate, '%Y-%m-%d') as 'تاريخ الحل'
            FROM Complaints c
            JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
            JOIN Departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        // إنشاء ملف Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('الشكاوى الحضورية');
        
        // إضافة العنوان
        worksheet.mergeCells('A1:M1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'تقرير الشكاوى الحضورية';
        titleCell.font = { bold: true, size: 16 };
        titleCell.alignment = { horizontal: 'center' };
        
        // إضافة معلومات الفترة الزمنية
        if (fromDate && toDate) {
            worksheet.mergeCells('A2:M2');
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
            worksheet.mergeCells('A4:M4');
            const noDataCell = worksheet.getCell('A4');
            noDataCell.value = 'لا توجد بيانات شكاوى حضورية في الفترة المحددة';
            noDataCell.alignment = { horizontal: 'center' };
            noDataCell.font = { italic: true };
        }
        
        // إعداد الاستجابة
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=inperson-complaints-${new Date().toISOString().split('T')[0]}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log('✅ تم تصدير ملف Excel بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات الشكاوى الحضورية:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تصدير البيانات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getInPersonComplaintsStats,
    exportInPersonComplaintsData
}; 