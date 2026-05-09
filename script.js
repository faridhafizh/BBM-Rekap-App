document.addEventListener("DOMContentLoaded", () => {
  // Get all DOM elements
  const elements = {
    monthSelect: document.getElementById("monthSelect"),
    mainFormCard: document.getElementById("mainFormCard"),
    generateCard: document.getElementById("generateCard"),
    inputId: document.getElementById("inputId"),
    btnSearch: document.getElementById("btnSearch"),
    menuType: document.getElementById("menuType"),
    inputSection: document.getElementById("inputSection"),
    unconditionalSection: document.getElementById("unconditionalSection"),
    tanggalRev: document.getElementById("tanggalRev"),
    kmRev: document.getElementById("kmRev"),
    hargaRev: document.getElementById("hargaRev"),
    keteranganInput: document.getElementById("keteranganInput"),
    statusApprov: document.getElementById("statusApprov"),
    btnSave: document.getElementById("btnSave"),
    saveMessage: document.getElementById("saveMessage"),
    btnGenerate: document.getElementById("btnGenerate"),
    resultText: document.getElementById("resultText"),
    btnCopy: document.getElementById("btnCopy"),
    resultWrapper: document.getElementById("resultWrapper"),
    loader: document.getElementById("loader"),
    tipeBadge: document.getElementById("tipeBadge"),
    // Template elements
    btnToggleTemplate: document.getElementById("btnToggleTemplate"),
    templateSection: document.getElementById("templateSection"),
    templateInput: document.getElementById("templateInput"),
    templateUnconditional: document.getElementById("templateUnconditional"),
    btnSaveTemplate: document.getElementById("btnSaveTemplate"),
    btnResetTemplate: document.getElementById("btnResetTemplate"),
    templateMessage: document.getElementById("templateMessage"),
    // Validation error elements
    inputIdError: document.getElementById("inputIdError"),
    tanggalRevError: document.getElementById("tanggalRevError"),
    kmRevError: document.getElementById("kmRevError"),
    hargaRevError: document.getElementById("hargaRevError"),
    keteranganInputError: document.getElementById("keteranganInputError"),
    // Analytics elements
    analyticsCard: document.getElementById("analyticsCard"),
    btnLoadAnalytics: document.getElementById("btnLoadAnalytics"),
    analyticsContent: document.getElementById("analyticsContent"),
    btnExportCSV: document.getElementById("btnExportCSV"),
    btnExportJSON: document.getElementById("btnExportJSON")
  };

  const API_URL = APP_CONFIG.apiUrl;

  // Check if Validator is available
  if (typeof Validator === 'undefined') {
    console.error('Validator class not found. Make sure validation.js is loaded.');
    showMessage('❌ Error: Validation module not loaded', false, true);
    return;
  }

  // Initialize Analytics
  const analytics = new Analytics();
  if (typeof Analytics === 'undefined') {
    console.error('Analytics class not found. Make sure analytics.js is loaded.');
  }

  // Initialize Offline Manager
  const offlineManager = new OfflineManager();
  if (typeof OfflineManager === 'undefined') {
    console.error('OfflineManager class not found. Make sure offline.js is loaded.');
  }

  // Default templates
  const DEFAULT_TEMPLATE_INPUT =
    "{id} >> {tanggal}, KM menjadi {km}, harga menjadi {harga}";
  const DEFAULT_TEMPLATE_UNCONDITIONAL = "{id} >> {status}";
  const STORAGE_KEY_INPUT = "bbm_template_input";
  const STORAGE_KEY_UNCONDITIONAL = "bbm_template_unconditional";

  const tipeBadge = elements.tipeBadge;

  // Validation helper functions
  function showValidationError(fieldElement, errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'flex';
    }
    if (fieldElement) {
      fieldElement.classList.add('validation-error-input');
      fieldElement.classList.remove('validation-success-input');
    }
  }

  function hideValidationError(fieldElement, errorElement) {
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    if (fieldElement) {
      fieldElement.classList.remove('validation-error-input');
      fieldElement.classList.add('validation-success-input');
    }
  }

  function clearAllValidationErrors() {
    Object.keys(elements).forEach(key => {
      if (key.endsWith('Error')) {
        const errorElement = elements[key];
        if (errorElement) errorElement.style.display = 'none';
      }
    });
    
    // Remove validation classes from inputs
    ['inputId', 'tanggalRev', 'kmRev', 'hargaRev', 'keteranganInput'].forEach(fieldId => {
      const field = elements[fieldId];
      if (field) {
        field.classList.remove('validation-error-input', 'validation-success-input');
      }
    });
  }

  // Real-time validation
  elements.inputId.addEventListener('input', () => {
    const value = elements.inputId.value.trim();
    if (value) {
      const validation = Validator.validateID(value);
      if (validation.valid) {
        hideValidationError(elements.inputId, elements.inputIdError);
      } else {
        showValidationError(elements.inputId, elements.inputIdError, validation.message);
      }
    } else {
      hideValidationError(elements.inputId, elements.inputIdError);
    }
  });

  elements.tanggalRev.addEventListener('input', () => {
    const value = elements.tanggalRev.value.trim();
    if (value) {
      const validation = Validator.validateDate(value);
      if (validation.valid) {
        hideValidationError(elements.tanggalRev, elements.tanggalRevError);
      } else {
        showValidationError(elements.tanggalRev, elements.tanggalRevError, validation.message);
      }
    } else {
      hideValidationError(elements.tanggalRev, elements.tanggalRevError);
    }
  });

  elements.kmRev.addEventListener('input', () => {
    const value = elements.kmRev.value.trim();
    if (value) {
      const validation = Validator.validateKM(value);
      if (validation.valid) {
        hideValidationError(elements.kmRev, elements.kmRevError);
      } else {
        showValidationError(elements.kmRev, elements.kmRevError, validation.message);
      }
    } else {
      hideValidationError(elements.kmRev, elements.kmRevError);
    }
  });

  elements.hargaRev.addEventListener('input', () => {
    const value = elements.hargaRev.value.trim();
    if (value) {
      const validation = Validator.validateHarga(value);
      if (validation.valid) {
        hideValidationError(elements.hargaRev, elements.hargaRevError);
      } else {
        showValidationError(elements.hargaRev, elements.hargaRevError, validation.message);
      }
    } else {
      hideValidationError(elements.hargaRev, elements.hargaRevError);
    }
  });

  elements.keteranganInput.addEventListener('input', () => {
    const value = elements.keteranganInput.value.trim();
    if (value) {
      const validation = Validator.validateKeterangan(value);
      if (validation.valid) {
        hideValidationError(elements.keteranganInput, elements.keteranganInputError);
      } else {
        showValidationError(elements.keteranganInput, elements.keteranganInputError, validation.message);
      }
    } else {
      hideValidationError(elements.keteranganInput, elements.keteranganInputError);
    }
  });

  // Load saved templates
  function loadTemplates() {
    elements.templateInput.value =
      localStorage.getItem(STORAGE_KEY_INPUT) || DEFAULT_TEMPLATE_INPUT;
    elements.templateUnconditional.value =
      localStorage.getItem(STORAGE_KEY_UNCONDITIONAL) ||
      DEFAULT_TEMPLATE_UNCONDITIONAL;
  }

  loadTemplates();

  // Toggle template section
  elements.btnToggleTemplate.addEventListener("click", () => {
    const isHidden = elements.templateSection.style.display === "none";
    elements.templateSection.style.display = isHidden ? "block" : "none";
    elements.btnToggleTemplate.classList.toggle("open", isHidden);
  });

  // Save template
  elements.btnSaveTemplate.addEventListener("click", () => {
    localStorage.setItem(
      STORAGE_KEY_INPUT,
      elements.templateInput.value.trim() || DEFAULT_TEMPLATE_INPUT,
    );
    localStorage.setItem(
      STORAGE_KEY_UNCONDITIONAL,
      elements.templateUnconditional.value.trim() || DEFAULT_TEMPLATE_UNCONDITIONAL,
    );
    showTemplateMessage("Template berhasil disimpan!", true);
  });

  // Reset template
  elements.btnResetTemplate.addEventListener("click", () => {
    elements.templateInput.value = DEFAULT_TEMPLATE_INPUT;
    elements.templateUnconditional.value = DEFAULT_TEMPLATE_UNCONDITIONAL;
    localStorage.removeItem(STORAGE_KEY_INPUT);
    localStorage.removeItem(STORAGE_KEY_UNCONDITIONAL);
    showTemplateMessage("Template direset ke default.", true);
  });

  // Apply template with data
  function applyTemplate(template, data) {
    return template
      .replace("{id}", data.id || "")
      .replace("{tanggal}", data.tanggal || "")
      .replace("{km}", data.km || "")
      .replace("{harga}", data.harga || "")
      .replace("{status}", data.status || "");
  }

  // format tanggal dari Google Sheets (ISO) ke format text
  function formatTanggal(val) {
    if (!val) return "";
    // Deteksi format ISO dari Google Sheets (misal: 2025-09-03T16:00:00.000Z)
    const d = new Date(val);
    if (!isNaN(d.getTime()) && String(val).includes("T")) {
      const bulan = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
    }
    // Kalau sudah string biasa, kembalikan apa adanya
    return String(val).trim();
  }

  // Auto-load sheets with offline fallback
  async function loadSheets() {
    showLoader("Memuat daftar sheet...");
    try {
      const operationData = {
        action: 'getSheets',
        apiUrl: API_URL
      };
      
      const result = await offlineManager.getDataWithFallback(operationData);
      
      if (result.status === 'success' || result.status === 'offline_cached') {
        const data = result.data || result;
        elements.monthSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>';
        data.forEach((sheet) => {
          const option = document.createElement("option");
          option.value = sheet;
          option.textContent = sheet;
          elements.monthSelect.appendChild(option);
        });
        
        const message = result.status === 'offline_cached' 
          ? '✅ Sheet dimuat dari cache offline'
          : '✅ Sheet berhasil dimuat';
        showMessage(message, true);
      } else {
        throw new Error(result.message || "Gagal memuat sheet dari server");
      }
    } catch (error) {
      console.error("Load sheets error:", error);
      const errorMsg = error.message.includes("Failed to fetch") 
        ? "❌ Gagal terhubung ke API. Periksa config.js dan koneksi internet."
        : `❌ Gagal memuat sheet: ${error.message}`;
      showMessage(errorMsg, false, true);
    } finally {
      hideLoader();
    }
  }

  loadSheets();

  // Handle Month Selection
  elements.monthSelect.addEventListener("change", () => {
    clearAllValidationErrors();
    if (elements.monthSelect.value) {
      elements.mainFormCard.style.display = "block";
      elements.analyticsCard.style.display = "block";
      elements.generateCard.style.display = "block";
      resetForm();
      // Reset analytics when changing sheet
      elements.analyticsContent.style.display = "none";
    } else {
      elements.mainFormCard.style.display = "none";
      elements.analyticsCard.style.display = "none";
      elements.generateCard.style.display = "none";
    }
  });

  // Handle Menu Type change
  elements.menuType.addEventListener("change", async () => {
    clearAllValidationErrors();
    elements.inputSection.style.display = "none";
    elements.unconditionalSection.style.display = "none";
    tipeBadge.style.display = "none";

    const val = elements.menuType.value;

    if (val === "input") {
      elements.inputSection.style.display = "block";
      tipeBadge.style.display = "inline-flex";
      tipeBadge.className = "tipe-badge input";
      tipeBadge.textContent = "🧾 Menu Input";
    } else if (val === "unconditional") {
      elements.unconditionalSection.style.display = "block";
      tipeBadge.style.display = "inline-flex";
      tipeBadge.className = "tipe-badge uncond";
      tipeBadge.textContent = "✅ Unconditional";
    } else if (val === "noitem") {
      tipeBadge.style.display = "inline-flex";
      tipeBadge.className = "tipe-badge noitem";
      tipeBadge.textContent = "⚠️ No Item";

      // Validate ID before proceeding
      const sheet = elements.monthSelect.value;
      const id = elements.inputId.value.trim();
      
      if (!id) {
        showMessage("❌ Masukkan ID terlebih dahulu", false, true);
        elements.menuType.value = "";
        tipeBadge.style.display = "none";
        return;
      }

      const idValidation = Validator.validateID(id);
      if (!idValidation.valid) {
        showValidationError(elements.inputId, elements.inputIdError, idValidation.message);
        showMessage("❌ ID tidak valid", false, true);
        elements.menuType.value = "";
        tipeBadge.style.display = "none";
        return;
      }

      // Check if ID exists in sheet
      if (elements.btnSave.disabled) {
        showMessage("❌ Cari ID terlebih dahulu sebelum memilih No Item.", false, true);
        elements.menuType.value = "";
        tipeBadge.style.display = "none";
        return;
      }

      // Auto-save langsung
      showLoader("Menyimpan status No Item...");
      showMessage("", false);
      try {
        const payload = {
          action: "save",
          sheetName: sheet,
          id: idValidation.sanitized,
          tipe: "unconditional",
          tanggal: "",
          km: "",
          harga: "",
          keterangan: "",
          status: "No Item",
        };

        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.status === "success") {
          showMessage("⚠️ No Item berhasil disimpan!", true);
          resetForm();
        } else {
          throw new Error(result.message || "Gagal menyimpan No Item");
        }
      } catch (error) {
        console.error("No Item save error:", error);
        const errorMsg = error.message.includes("Failed to fetch")
          ? "❌ Gagal terhubung ke server. Periksa koneksi internet."
          : `❌ ${error.message}`;
        showMessage(errorMsg, false, true);
        elements.menuType.value = "";
        tipeBadge.style.display = "none";
      } finally {
        hideLoader();
      }
    }
  });

  // Search ID with offline fallback
  elements.btnSearch.addEventListener("click", async () => {
    const sheet = elements.monthSelect.value;
    const id = elements.inputId.value.trim();

    // Validate input
    if (!id) {
      showValidationError(elements.inputId, elements.inputIdError, "ID wajib diisi");
      return;
    }

    const idValidation = Validator.validateID(id);
    if (!idValidation.valid) {
      showValidationError(elements.inputId, elements.inputIdError, idValidation.message);
      return;
    }

    const sheetValidation = Validator.validateSheetName(sheet);
    if (!sheetValidation.valid) {
      showMessage("❌ Pilih sheet terlebih dahulu", false, true);
      return;
    }

    showLoader("Mencari ID...");
    clearAllValidationErrors();
    showMessage("", false);
    elements.btnSave.disabled = true;

    try {
      const operationData = {
        action: 'search',
        sheetName: sheetValidation.sanitized,
        id: idValidation.sanitized,
        apiUrl: API_URL
      };
      
      const result = await offlineManager.getDataWithFallback(operationData);

      if (result.status === 'success' || result.status === 'offline_cached') {
        const data = result.data || result;
        if (data) {
          elements.menuType.value = data.tipe || "";
          elements.menuType.dispatchEvent(new Event("change"));

          if (data.tipe === "input") {
            elements.tanggalRev.value = data.tanggal || "";
            elements.kmRev.value = data.km || "";
            elements.hargaRev.value = data.harga || "";
            elements.keteranganInput.value = data.keterangan || "";
          } else if (data.tipe === "unconditional") {
            elements.statusApprov.value = data.status || "";
          }

          elements.btnSave.disabled = false;
          const message = result.status === 'offline_cached'
            ? "✅ ID ditemukan dari cache offline!"
            : "✅ ID ditemukan! Silakan edit jika perlu.";
          showMessage(message, true);
        } else {
          resetFormFields();
          elements.menuType.value = "";
          elements.menuType.dispatchEvent(new Event("change"));
          elements.btnSave.disabled = true;
          showMessage(
            "❌ ID tidak ditemukan di sheet. Pastikan ID sudah ada di spreadsheet.",
            false,
            true,
          );
        }
      } else {
        throw new Error(result.message || "Gagal mencari ID");
      }
    } catch (error) {
      console.error("Search ID error:", error);
      const errorMsg = error.message.includes("Failed to fetch")
        ? "❌ Gagal terhubung ke server. Periksa koneksi internet atau config.js."
        : `❌ Gagal mencari ID: ${error.message}`;
      showMessage(errorMsg, false, true);
      elements.btnSave.disabled = true;
    } finally {
      hideLoader();
    }
  });

  // Save Record with offline support
  elements.btnSave.addEventListener("click", async () => {
    const sheet = elements.monthSelect.value;
    const id = elements.inputId.value.trim();
    const type = elements.menuType.value;

    // Validate all form data
    const formData = {
      sheetName: sheet,
      id: id,
      tipe: type,
      tanggal: elements.tanggalRev.value.trim(),
      km: elements.kmRev.value.trim(),
      harga: elements.hargaRev.value.trim(),
      keterangan: elements.keteranganInput.value.trim(),
      status: elements.statusApprov.value
    };

    const validation = Validator.validateFormData(formData);
    
    if (!validation.valid) {
      // Show specific validation errors
      validation.errors.forEach(error => {
        const fieldElement = elements[error.field];
        const errorElement = elements[error.field + 'Error'];
        if (fieldElement && errorElement) {
          showValidationError(fieldElement, errorElement, error.message);
        }
      });
      
      // Show general error message
      showMessage("❌ Perbaiki error yang ditandai sebelum menyimpan", false, true);
      return;
    }

    const sanitized = validation.sanitized;

    showLoader("Menyimpan data...");
    try {
      const operationData = {
        apiUrl: API_URL,
        payload: {
          action: "save",
          sheetName: sanitized.sheetName,
          id: sanitized.id,
          tipe: sanitized.tipe,
          tanggal: sanitized.tanggal,
          km: sanitized.km,
          harga: sanitized.harga,
          keterangan: sanitized.keterangan,
          status: sanitized.status
        }
      };

      const result = await offlineManager.saveOffline(operationData);
      
      if (result.status === 'success') {
        showMessage(result.message, true);
        resetForm();
      } else if (result.status === 'offline_pending') {
        showMessage(result.message, true);
        resetForm();
        // Show offline notification if not already visible
        if (!offlineManager.isOnline) {
          offlineManager.showOfflineNotification();
        }
      } else {
        throw new Error(result.message || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Save error:", error);
      const errorMsg = error.message.includes("Failed to fetch")
        ? "❌ Gagal terhubung ke server. Periksa koneksi internet."
        : `❌ Gagal menyimpan data: ${error.message}`;
      showMessage(errorMsg, false, true);
    } finally {
      hideLoader();
    }
  });

  // Generate Message with offline fallback
  elements.btnGenerate.addEventListener("click", async () => {
    const sheet = elements.monthSelect.value;
    const tmplInput = elements.templateInput.value.trim() || DEFAULT_TEMPLATE_INPUT;
    const tmplUnconditional =
      elements.templateUnconditional.value.trim() || DEFAULT_TEMPLATE_UNCONDITIONAL;

    // Validate sheet selection
    const sheetValidation = Validator.validateSheetName(sheet);
    if (!sheetValidation.valid) {
      showMessage("❌ Pilih sheet terlebih dahulu", false, true);
      return;
    }

    showLoader("Menghasilkan pesan rekap...");
    elements.resultText.value = "";
    elements.btnCopy.style.display = "none";
    elements.resultWrapper.style.display = "none";

    try {
      const operationData = {
        action: 'getAll',
        sheetName: sheetValidation.sanitized,
        apiUrl: API_URL
      };
      
      const result = await offlineManager.getDataWithFallback(operationData);

      if (result.status === 'success' || result.status === 'offline_cached') {
        const records = result.data || result;
        let generatedMessage = "";

        records.forEach((r) => {
          if (r.tipe === "input") {
            // Build dinamis — hanya sertakan field yang benar-benar ada isinya
            const tanggal = formatTanggal(r.tanggal);
            const km = r.km ? String(r.km).trim() : "";
            const harga = r.harga ? String(r.harga).trim() : "";

            const parts = [];
            if (tanggal) parts.push(`tanggal ${tanggal}`);
            if (km) parts.push(`KM menjadi ${km}`);
            if (harga) parts.push(`harga menjadi ${harga}`);

            if (parts.length > 0) {
              generatedMessage += `${r.id} » ${parts.join(", ")}\n`;
            }
          } else if (r.tipe === "unconditional") {
            if (r.status && r.status !== "unverified") {
              generatedMessage += applyTemplate(tmplUnconditional, r) + "\n";
            }
          }
        });

        elements.resultWrapper.style.display = "block";
        if (generatedMessage.trim() === "") {
          elements.resultText.value =
            "Tidak ada data yang perlu direkap untuk bulan ini.";
          elements.btnCopy.style.display = "none";
        } else {
          elements.resultText.value = generatedMessage.trim();
          elements.btnCopy.style.display = "block";
        }
        
        const message = result.status === 'offline_cached'
          ? '✅ Pesan rekap dibuat dari cache offline'
          : '✅ Pesan rekap berhasil dibuat';
        showMessage(message, true);
      } else {
        throw new Error(result.message || "Gagal mengambil data");
      }
    } catch (error) {
      console.error("Generate error:", error);
      const errorMsg = error.message.includes("Failed to fetch")
        ? "❌ Gagal terhubung ke server. Periksa koneksi internet."
        : `❌ Gagal menghasilkan pesan: ${error.message}`;
      showMessage(errorMsg, false, true);
    } finally {
      hideLoader();
    }
  });

  // Copy to clipboard
  elements.btnCopy.addEventListener("click", () => {
    elements.resultText.select();
    elements.resultText.setSelectionRange(0, 99999);
    
    try {
      document.execCommand("copy");
      const originalText = elements.btnCopy.textContent;
      elements.btnCopy.textContent = "Berhasil di-copy!";
      setTimeout(() => {
        elements.btnCopy.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);
      showMessage("❌ Gagal menyalin ke clipboard", false, true);
    }
  });

  // Helper functions
  function showLoader(message = "Memproses...") {
    const loaderText = document.querySelector(".loader-text");
    if (loaderText) {
      loaderText.textContent = message;
    }
    elements.loader.style.display = "flex";
  }

  function hideLoader() {
    elements.loader.style.display = "none";
  }

  function resetFormFields() {
    elements.tanggalRev.value = "";
    elements.kmRev.value = "";
    elements.hargaRev.value = "";
    elements.keteranganInput.value = "";
    elements.statusApprov.value = "";
  }

  function resetForm() {
    elements.inputId.value = "";
    elements.menuType.value = "";
    elements.inputSection.style.display = "none";
    elements.unconditionalSection.style.display = "none";
    tipeBadge.style.display = "none";
    resetFormFields();
    elements.btnSave.disabled = true;
    clearAllValidationErrors();
    setTimeout(() => {
      showMessage("", false);
    }, 3000);
  }

  function showMessage(msg, isSuccess, isError = false) {
    if (!msg) {
      elements.saveMessage.style.display = "none";
      elements.saveMessage.className = "app-message";
      return;
    }
    elements.saveMessage.style.display = "flex";
    elements.saveMessage.textContent = msg;
    elements.saveMessage.className =
      "app-message " + (isError ? "error" : isSuccess ? "success" : "");
  }

  function showTemplateMessage(msg, isSuccess) {
    elements.templateMessage.style.display = "flex";
    elements.templateMessage.textContent = msg;
    elements.templateMessage.className =
      "app-message " + (isSuccess ? "success" : "error");
    setTimeout(() => {
      elements.templateMessage.style.display = "none";
      elements.templateMessage.className = "app-message";
    }, 3000);
  }

  // Security: Add CSRF protection
  function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Add rate limiting for API calls
  let lastApiCall = 0;
  const API_RATE_LIMIT = 1000; // 1 second between calls

  async function rateLimitedFetch(url, options = {}) {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall < API_RATE_LIMIT) {
      const delay = API_RATE_LIMIT - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    lastApiCall = Date.now();
    return fetch(url, options);
  }

  // Update all fetch calls to use rateLimitedFetch
  const originalFetch = window.fetch;
  window.fetch = rateLimitedFetch;

  // Add error boundary for unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showMessage('❌ Terjadi kesalahan yang tidak diharapkan', false, true);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showMessage('❌ Terjadi kesalahan jaringan', false, true);
  });

  // Analytics event handlers with offline support
  elements.btnLoadAnalytics.addEventListener("click", async () => {
    const sheet = elements.monthSelect.value;
    
    if (!sheet) {
      showMessage("❌ Pilih sheet terlebih dahulu", false, true);
      return;
    }

    showLoader("Memuat analytics...");
    elements.btnLoadAnalytics.disabled = true;
    
    try {
      const operationData = {
        action: 'getAll',
        sheetName: sheet,
        apiUrl: API_URL
      };
      
      const result = await offlineManager.getDataWithFallback(operationData);
      const data = result.data || result;
      
      const stats = analytics.calculateStats(data);
      
      // Update UI with statistics
      analytics.updateUI(stats);
      
      // Draw status chart
      analytics.drawStatusChart(stats.statusBreakdown);
      
      // Show analytics content
      elements.analyticsContent.style.display = "block";
      
      // Generate insights
      const report = analytics.generateSummaryReport(stats, sheet);
      console.log("Analytics Report:", report);
      
      const message = result.status === 'offline_cached'
        ? `✅ Analytics dimuat dari cache: ${stats.total} record`
        : `✅ Analytics berhasil dimuat: ${stats.total} record`;
      showMessage(message, true);
    } catch (error) {
      console.error("Analytics error:", error);
      const errorMsg = error.message.includes("Failed to fetch")
        ? "❌ Gagal terhubung ke server. Periksa koneksi internet."
        : `❌ Gagal memuat analytics: ${error.message}`;
      showMessage(errorMsg, false, true);
    } finally {
      hideLoader();
      elements.btnLoadAnalytics.disabled = false;
    }
  });

  elements.btnExportCSV.addEventListener("click", () => {
    const sheet = elements.monthSelect.value;
    if (sheet && analytics.currentData.length > 0) {
      analytics.exportToCSV(analytics.currentData, sheet);
      showMessage("✅ Data berhasil diekspor ke CSV", true);
    } else {
      showMessage("❌ Tidak ada data untuk diekspor", false, true);
    }
  });

  elements.btnExportJSON.addEventListener("click", () => {
    const sheet = elements.monthSelect.value;
    if (sheet && analytics.currentData.length > 0) {
      analytics.exportToJSON(analytics.currentData, sheet);
      showMessage("✅ Data berhasil diekspor ke JSON", true);
    } else {
      showMessage("❌ Tidak ada data untuk diekspor", false, true);
    }
  });

  // Add input event listeners for Enter key support
  elements.inputId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elements.btnSearch.click();
    }
  });

  ['tanggalRev', 'kmRev', 'hargaRev', 'keteranganInput'].forEach(fieldId => {
    elements[fieldId].addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !elements.btnSave.disabled) {
        elements.btnSave.click();
      }
    });
  });

});
