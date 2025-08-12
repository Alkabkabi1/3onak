# نظام إدارة الطلبات العامة - عونك

## 📋 نظرة عامة

نظام إدارة الطلبات العامة هو تطبيق ويب متكامل لإدارة وتتبع الطلبات العامة في المستشفى. يوفر النظام واجهة سهلة الاستخدام لعرض الإحصائيات والتحليلات وإدارة الطلبات.

## 🚀 المميزات

### 📊 لوحة التحكم (Dashboard)
- عرض إحصائيات الطلبات العامة
- رسوم بيانية تفاعلية
- تحليل الأداء والاقتراحات
- تصدير التقارير بصيغة Excel

### 🔧 إدارة الطلبات
- إضافة طلبات جديدة
- تحديث حالة الطلبات
- تتبع الطلبات المتأخرة
- إدارة الموظفين المسؤولين

### 🌐 دعم متعدد اللغات
- العربية والإنجليزية
- واجهة مستخدم محسنة للغتين

## 🛠️ المتطلبات التقنية

- Node.js (v14 أو أحدث)
- MySQL (v8.0 أو أحدث)
- متصفح ويب حديث

## 📦 التثبيت والتشغيل

### 1. تثبيت التبعيات

```bash
cd backend
npm install
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
mysql -u root -p
CREATE DATABASE aounak_db;
USE aounak_db;

# تشغيل ملفات SQL (إذا كانت موجودة)
source setup_misconduct.sql;
```

### 3. تشغيل الباك إند

```bash
cd backend
npm start
```

الباك إند سيعمل على: `http://localhost:3001`

### 4. تشغيل الفرونت إند

افتح ملف `DashBoard/general-requests.html` في المتصفح أو استخدم خادم محلي:

```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Node.js
npx http-server -p 8000
```

## 📁 هيكل المشروع

```
3aon/
├── backend/
│   ├── controllers/
│   │   └── generalRequestController.js    # منطق الطلبات العامة
│   ├── routes/
│   │   └── generalRequestRoutes.js        # مسارات API
│   ├── config/
│   │   └── database.js                    # إعداد قاعدة البيانات
│   └── app.js                            # الخادم الرئيسي
├── DashBoard/
│   ├── general-requests.html             # واجهة الطلبات العامة
│   ├── general-requests.js               # منطق الواجهة
│   └── general-requests.css              # التصميم
└── README.md
```

## 🔌 API Endpoints

### الطلبات العامة

| الطريقة | المسار | الوصف |
|---------|--------|--------|
| GET | `/api/general-requests/stats` | جلب إحصائيات الطلبات |
| GET | `/api/general-requests/request-types` | جلب أنواع الطلبات |
| GET | `/api/general-requests/export-data` | تصدير البيانات |
| GET | `/api/general-requests/analysis` | تحليل الأداء |
| POST | `/api/general-requests/add` | إضافة طلب جديد |
| PUT | `/api/general-requests/:id/status` | تحديث حالة الطلب |

## 📊 قاعدة البيانات

### جدول GeneralRequests

```sql
CREATE TABLE GeneralRequests (
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
);
```

## 🎨 المميزات البصرية

- تصميم متجاوب (Responsive Design)
- ألوان متناسقة ومريحة للعين
- رسوم بيانية تفاعلية باستخدام Chart.js
- دعم كامل للغة العربية (RTL)
- أيقونات Font Awesome

## 🔧 التخصيص

### تغيير الألوان
يمكن تعديل الألوان في ملف `general-requests.css`:

```css
/* ألوان الطلبات المنفذة */
.fulfilled-color {
    background-color: #4CAF50;
}

/* ألوان الطلبات غير المنفذة */
.unfulfilled-color {
    background-color: #F44336;
}
```

### إضافة أنواع طلبات جديدة
يمكن إضافة أنواع طلبات جديدة من خلال واجهة إضافة الطلبات أو مباشرة في قاعدة البيانات.

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من تشغيل MySQL
   - تحقق من إعدادات الاتصال في `config/database.js`

2. **خطأ في CORS**
   - تأكد من إعدادات CORS في `app.js`
   - تحقق من عنوان URL في الفرونت إند

3. **خطأ في تحميل البيانات**
   - تحقق من تشغيل الباك إند على المنفذ 3001
   - راجع وحدة تحكم المتصفح للأخطاء

## 📞 الدعم

للمساعدة والدعم التقني، يرجى التواصل مع فريق التطوير.

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**تم التطوير بواسطة فريق عونك** 🏥 

# نظام إدارة الشكاوى الطبية - عُونَك

## نظام متابعة الشكاوى للمرضى

### الوصف
نظام يمكن المرضى من متابعة شكاواهم المقدمة مسبقاً من خلال التحقق من هويتهم وعرض جميع الشكاوى المرتبطة بهم.

### المميزات الجديدة
1. **صفحة متابعة الشكاوى** (`/Complaints-followup/followup.html`)
   - التحقق من هوية المريض
   - التأكد من صحة الاسم ورقم الهوية

2. **عرض الشكاوى** (`/Complaints-followup/all-complaints.html`)
   - عرض جميع شكاوى المريض
   - تصفية الشكاوى حسب التاريخ والقسم والنوع
   - تصدير النتائج
   - عرض تفاصيل كل شكوى

### كيفية الاستخدام

#### للمرضى
1. زيارة صفحة متابعة الشكاوى
2. إدخال الاسم الكامل كما هو مسجل في النظام
3. إدخال رقم الهوية أو الإقامة
4. الضغط على "عرض الشكاوى"
5. سيتم التحقق من البيانات والانتقال لصفحة الشكاوى

#### التقنيات المستخدمة
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **API Endpoints**:
  - `GET /api/complaints/verify-patient/:nationalId` - التحقق من هوية المريض
  - `GET /api/complaints/patient/:nationalId` - جلب شكاوى المريض

### الملفات المحدثة
- `Complaints-followup/followup.js` - إضافة التحقق من هوية المريض
- `Complaints-followup/all-complaints.js` - تحسين معالجة الأخطاء
- `backend/controllers/complaintController.js` - إضافة دالة التحقق من الهوية
- `backend/routes/complaintRoutes.js` - إضافة route جديد

### ملاحظات مهمة
- يجب أن يكون اسم المريض مطابق للاسم المسجل في قاعدة البيانات
- النظام يتحقق من وجود المريض أولاً ثم من وجود شكاوى مسجلة
- في حالة عدم وجود شكاوى، سيتم إعلام المريض بذلك
- النظام يدعم اللغتين العربية والإنجليزية

### متطلبات التشغيل
1. تشغيل خادم قاعدة البيانات MySQL
2. تشغيل خادم Node.js على المنفذ 3001
3. التأكد من وجود جدول Patients في قاعدة البيانات 