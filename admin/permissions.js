function getCurrentLanguage() {
  return document.documentElement.lang || 'ar';
}


function showEditPanel(role) {
    const panelToShow = document.getElementById(`${role}-panel`);

    if (panelToShow) {
        // If the panel is currently visible, hide it.
        if (panelToShow.style.display === 'block') {
            panelToShow.style.display = 'none';
            // Hide success message if visible when closing the panel
            const successMsg = document.getElementById(`${role}-success-message`);
            if (successMsg) {
                successMsg.style.display = 'none';
            }
            return; // Exit the function after hiding
        }

        // If the panel is hidden, proceed to show it.
        // Hide any already open panels
        document.querySelectorAll('.edit-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        panelToShow.style.display = 'block';

        // Update checkbox states based on stored permissions
        for (const permId in permissionsState[role]) {
            const checkbox = document.getElementById(permId);
            if (checkbox) {
                checkbox.checked = permissionsState[role][permId];
            }
        }

        // Hide success message if visible when opening the panel
        const successMsg = document.getElementById(`${role}-success-message`);
        if (successMsg) {
            successMsg.style.display = 'none';
        }

        // Scroll to the panel
        panelToShow.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

function hideEditPanel(role) {
    const panelToHide = document.getElementById(`${role}-panel`);
    if (panelToHide) {
        const lang = getCurrentLanguage();
        const confirmMsg = lang === 'ar'
            ? 'هل أنت متأكد أنك تريد إلغاء التغييرات؟'
            : 'Are you sure you want to cancel changes?';

        if (confirm(confirmMsg)) {
            panelToHide.style.display = 'none';
            const successMsg = document.getElementById(`${role}-success-message`);
            if (successMsg) {
                successMsg.style.display = 'none';
            }
        }
    }
}



const permissionsState = {
    employee: {
        'employee-view-records': false,
        'employee-update-records': false,
        'employee-manage-appointments': false,
        'employee-view-calendar': false,
        'employee-add-patients': false,
        'employee-print-reports': false
    },
    manager: {
        'manager-full-access': false,
        'manager-user-management': false,
        'manager-roles-management': false,
        'manager-financial-reports': false,
        'manager-performance-reports': false,
        'manager-export-data': false,
        'manager-audit-logs': false,
        'manager-system-config': false,
        'manager-backup-restore': false
    }
};

function loadAllPermissions() {
    for (const role in permissionsState) {
        const storedPerms = localStorage.getItem(`permissions-${role}`);
        if (storedPerms) {
            permissionsState[role] = JSON.parse(storedPerms);
        }
    }
}
function savePermissions(role) {
    for (const permId in permissionsState[role]) {
        const checkbox = document.getElementById(permId);
        if (checkbox) {
            permissionsState[role][permId] = checkbox.checked;
        }
    }

    localStorage.setItem(`permissions-${role}`, JSON.stringify(permissionsState[role]));

    const successMsg = document.getElementById(`${role}-success-message`);
    if (successMsg) {
        const lang = getCurrentLanguage();
        const msg = successMsg.getAttribute(`data-${lang}`) || 'Changes saved successfully!';
        successMsg.textContent = msg;
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadAllPermissions();

    // Toggle All Checkbox functionality for Manager panel
    document.querySelectorAll('.toggle-all-checkbox').forEach(toggleCheckbox => {
        toggleCheckbox.addEventListener('change', (event) => {
            const group = event.target.dataset.group;
            const isChecked = event.target.checked;
            document.querySelectorAll(`#manager-panel .permission-item input[data-group="${group}"]`).forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    });
});


let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});

function goBack() {
  window.history.back();
}

