// ini hanya dokumentasi dari code.gs di appscript, agar bisa di simpan di repositori github.

// Kolom sheet: [ID, Tanggal, KM, Harga, Keterangan, Timestamp]
// Index:            [ 0,       1,  2,     3,          4,         5]

function getSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().map(s => s.getName());
}

function searchRecord(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan");

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() == String(id).trim()) {
      return {
        row: i + 1,
        id:        data[i][0],
        tanggal:   data[i][1],
        km:        data[i][2],
        harga:     data[i][3],
        status:    data[i][4],  // Keterangan = status approval
        timestamp: data[i][5],
        // tipe tidak ada di sheet, tebak dari isi status
        tipe: (data[i][4] && ["Butuh approved 2","Butuh approved 3","Butuh di input","unverified"].includes(String(data[i][4]).trim()))
              ? "unconditional" : "input"
      };
    }
  }
  return null;
}

function getAllRecords(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan");

  var data = sheet.getDataRange().getValues();
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var statusVal = String(data[i][4]).trim();
    var tipe = (["Butuh approved 2","Butuh approved 3","Butuh di input","unverified"].includes(statusVal))
               ? "unconditional" : "input";
    records.push({
      id:      data[i][0],
      tanggal: data[i][1],
      km:      data[i][2],
      harga:   data[i][3],
      status:  statusVal,
      tipe:    tipe
    });
  }
  return records;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action !== "save") {
      return respond({status:"error", message:"Unknown action"});
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheetName);
    if (!sheet) throw new Error("Sheet tidak ditemukan: " + data.sheetName);

    var id       = String(data.id).trim();
    var tipe     = data.tipe     || "";
    var tanggal  = data.tanggal  || "";
    var km       = data.km       || "";
    var harga    = data.harga    || "";
    var status   = data.status   || "";
    var timestamp = new Date();

    // Cari baris berdasarkan ID (kolom A = index 0)
    var dataRange = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() == id) {
        foundRow = i + 1; // row number (1-based)
        break;
      }
    }

    if (foundRow !== -1) {
      // === UPDATE baris yang sudah ada ===
      // Hanya tulis kolom yang relevan, jangan overwrite kolom lain
      if (tipe === "input") {
        if (tanggal) sheet.getRange(foundRow, 2).setValue(tanggal); // Kolom B
        if (km)      sheet.getRange(foundRow, 3).setValue(km);      // Kolom C
        if (harga)   sheet.getRange(foundRow, 4).setValue(harga);   // Kolom D
      } else if (tipe === "unconditional") {
        sheet.getRange(foundRow, 5).setValue(status); // Kolom E (Keterangan)
      }
      sheet.getRange(foundRow, 6).setValue(timestamp); // Kolom F (Timestamp)
    } else {
      // ID tidak ada di sheet → tolak, jangan buat baris baru
      return respond({status:"error", message:"ID '" + id + "' tidak ditemukan di sheet. Pastikan ID sudah ada di spreadsheet terlebih dahulu."});
    }

    return respond({status:"success", message:"Data berhasil diperbarui!"});

  } catch(err) {
    return respond({status:"error", message: err.message});
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "getSheets") return respond({status:"success", data: getSheets()});
    if (action === "search")    return respond({status:"success", data: searchRecord(e.parameter.sheetName, e.parameter.id)});
    if (action === "getAll")    return respond({status:"success", data: getAllRecords(e.parameter.sheetName)});
    return respond({status:"success", message:"API is running."});
  } catch(err) {
    return respond({status:"error", message: err.message});
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}