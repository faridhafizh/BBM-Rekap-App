document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const apiUrlInput = document.getElementById("apiUrl");
  const btnLoadSheets = document.getElementById("btnLoadSheets");
  const monthSelect = document.getElementById("monthSelect");

  const mainFormCard = document.getElementById("mainFormCard");
  const generateCard = document.getElementById("generateCard");

  const inputId = document.getElementById("inputId");
  const btnSearch = document.getElementById("btnSearch");
  const menuType = document.getElementById("menuType");

  const inputSection = document.getElementById("inputSection");
  const unconditionalSection = document.getElementById("unconditionalSection");

  // Input Fields
  const tanggalRev = document.getElementById("tanggalRev");
  const kmRev = document.getElementById("kmRev");
  const hargaRev = document.getElementById("hargaRev");
  const statusApprov = document.getElementById("statusApprov");

  const btnSave = document.getElementById("btnSave");
  const saveMessage = document.getElementById("saveMessage");

  const btnGenerate = document.getElementById("btnGenerate");
  const resultText = document.getElementById("resultText");
  const btnCopy = document.getElementById("btnCopy");

  const loader = document.getElementById("loader");

  // Local Storage for API URL
  const savedApiUrl = localStorage.getItem("bbm_api_url");
  if (savedApiUrl) {
    apiUrlInput.value = savedApiUrl;
  }

  // Load Sheets
  btnLoadSheets.addEventListener("click", async () => {
    const url = apiUrlInput.value.trim();
    if (!url) {
      alert("Masukkan API URL terlebih dahulu!");
      return;
    }
    localStorage.setItem("bbm_api_url", url);

    showLoader();
    try {
      const response = await fetch(`${url}?action=getSheets`);
      const data = await response.json();

      if (data.status === "success") {
        monthSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>';
        data.data.forEach((sheet) => {
          const option = document.createElement("option");
          option.value = sheet;
          option.textContent = sheet;
          monthSelect.appendChild(option);
        });
      } else {
        alert("Gagal memuat sheet: " + data.message);
      }
    } catch (error) {
      alert(
        "Terjadi kesalahan koneksi. Pastikan URL benar dan CORS diizinkan di Apps Script.",
      );
      console.error(error);
    } finally {
      hideLoader();
    }
  });

  // Handle Month Selection
  monthSelect.addEventListener("change", () => {
    if (monthSelect.value) {
      mainFormCard.style.display = "block";
      generateCard.style.display = "block";
      resetForm();
    } else {
      mainFormCard.style.display = "none";
      generateCard.style.display = "none";
    }
  });

  // Handle Menu Type change
  menuType.addEventListener("change", () => {
    inputSection.style.display = "none";
    unconditionalSection.style.display = "none";

    if (menuType.value === "input") {
      inputSection.style.display = "block";
    } else if (menuType.value === "unconditional") {
      unconditionalSection.style.display = "block";
    }
  });

  // Search ID
  btnSearch.addEventListener("click", async () => {
    const url = apiUrlInput.value.trim();
    const sheet = monthSelect.value;
    const id = inputId.value.trim();

    if (!id) {
      alert("Masukkan ID terlebih dahulu!");
      return;
    }

    showLoader();
    showMessage("", false);
    btnSave.disabled = true; // Kunci dulu selama proses pencarian

    try {
      const response = await fetch(
        `${url}?action=search&sheetName=${encodeURIComponent(sheet)}&id=${encodeURIComponent(id)}`,
      );
      const result = await response.json();

      if (result.status === "success" && result.data) {
        const d = result.data;
        menuType.value = d.tipe || "";
        menuType.dispatchEvent(new Event("change"));

        if (d.tipe === "input") {
          tanggalRev.value = d.tanggal || "";
          kmRev.value = d.km || "";
          hargaRev.value = d.harga || "";
        } else if (d.tipe === "unconditional") {
          statusApprov.value = d.status || "";
        }

        btnSave.disabled = false; // ✅ Buka kunci — ID ditemukan
        showMessage("✅ ID ditemukan! Silakan edit jika perlu.", true);
      } else {
        // ID tidak ditemukan
        resetFormFields();
        menuType.value = "";
        menuType.dispatchEvent(new Event("change"));
        btnSave.disabled = true; // 🔒 Tetap terkunci — ID tidak ada di sheet
        showMessage(
          "❌ ID tidak ditemukan di sheet. Pastikan ID sudah ada di spreadsheet.",
          false,
          true,
        );
      }
    } catch (error) {
      console.error(error);
      btnSave.disabled = true;
      showMessage(
        "❌ Gagal terhubung ke server. Periksa koneksi atau API URL.",
        false,
        true,
      );
    } finally {
      hideLoader();
    }
  });

  // Save Record
  btnSave.addEventListener("click", async () => {
    const url = apiUrlInput.value.trim();
    const sheet = monthSelect.value;
    const id = inputId.value.trim();
    const type = menuType.value;

    if (!id || !type) {
      showMessage("ID dan Tipe Pengecekan wajib diisi!", false, true);
      return;
    }

    const payload = {
      action: "save",
      sheetName: sheet,
      id: id,
      tipe: type,
      tanggal: "",
      km: "",
      harga: "",
      status: "",
    };

    if (type === "input") {
      payload.tanggal = tanggalRev.value.trim();
      payload.km = kmRev.value.trim();
      payload.harga = hargaRev.value.trim();
    } else if (type === "unconditional") {
      payload.status = statusApprov.value;
      if (!payload.status) {
        showMessage(
          "Pilih Status Saat Ini untuk menu unconditional!",
          false,
          true,
        );
        return;
      }
    }

    showLoader();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status === "success") {
        showMessage(result.message, true);
        resetForm();
      } else {
        showMessage(result.message, false, true);
      }
    } catch (error) {
      console.error(error);
      showMessage("Gagal menyimpan data.", false, true);
    } finally {
      hideLoader();
    }
  });

  // Generate Message
  btnGenerate.addEventListener("click", async () => {
    const url = apiUrlInput.value.trim();
    const sheet = monthSelect.value;

    showLoader();
    resultText.value = "";
    btnCopy.style.display = "none";

    try {
      const response = await fetch(
        `${url}?action=getAll&sheetName=${encodeURIComponent(sheet)}`,
      );
      const result = await response.json();

      if (result.status === "success") {
        const records = result.data;
        let generatedMessage = "";

        records.forEach((r) => {
          if (r.tipe === "input") {
            let updates = [];
            if (r.tanggal) updates.push(`tanggal ${r.tanggal}`);
            if (r.km) updates.push(`KM menjadi ${r.km}`);
            if (r.harga) updates.push(`harga menjadi ${r.harga}`);

            if (updates.length > 0) {
              generatedMessage += `${r.id} >> ${updates.join(", ")}\n`;
            }
          } else if (r.tipe === "unconditional") {
            if (r.status && r.status !== "unverified") {
              generatedMessage += `${r.id} >> ${r.status}\n`;
            }
          }
        });

        if (generatedMessage.trim() === "") {
          resultText.value =
            "Tidak ada data yang perlu direkap untuk bulan ini.";
        } else {
          resultText.value = generatedMessage.trim();
          btnCopy.style.display = "block";
        }
      } else {
        alert("Gagal mengambil data: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal men-generate pesan.");
    } finally {
      hideLoader();
    }
  });

  // Copy to clipboard
  btnCopy.addEventListener("click", () => {
    resultText.select();
    resultText.setSelectionRange(0, 99999);
    document.execCommand("copy");

    const originalText = btnCopy.textContent;
    btnCopy.textContent = "Berhasil di-copy!";
    setTimeout(() => {
      btnCopy.textContent = originalText;
    }, 2000);
  });

  // Helper functions
  function showLoader() {
    loader.style.display = "flex";
  }
  function hideLoader() {
    loader.style.display = "none";
  }

  function resetFormFields() {
    tanggalRev.value = "";
    kmRev.value = "";
    hargaRev.value = "";
    statusApprov.value = "";
  }

  function resetForm() {
    inputId.value = "";
    menuType.value = "";
    inputSection.style.display = "none";
    unconditionalSection.style.display = "none";
    resetFormFields();
    btnSave.disabled = true; // ← tambahkan ini
    setTimeout(() => {
      showMessage("", false);
    }, 3000);
  }

  function showMessage(msg, isSuccess, isError = false) {
    if (!msg) {
        saveMessage.style.display = 'none';
        saveMessage.className = 'message';
        return;
    }
    saveMessage.style.display = ''; // ← hapus inline style agar CSS class bisa bekerja
    saveMessage.textContent = msg;
    saveMessage.className = 'message ' + (isError ? 'error' : (isSuccess ? 'success' : ''));
}
});
