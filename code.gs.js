// ini hanya dokumentasi dari code.gs di appscript, agar bisa di simpan di repositori github.

function getSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var names = [];
  for (var i = 0; i < sheets.length; i++) {
    names.push(sheets[i].getName());
  }
  return names;
}

function searchRecord(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan");
  
  var data = sheet.getDataRange().getValues();
  // Assume Header: Timestamp, ID, Tipe, Status, Tanggal, KM, Harga
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == id) {
      return {
        row: i + 1,
        timestamp: data[i][0],
        id: data[i][1],
        tipe: data[i][2],
        status: data[i][3],
        tanggal: data[i][4],
        km: data[i][5],
        harga: data[i][6]
      };
    }
  }
  return null; // Not found
}

function getAllRecords(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan");
  
  var data = sheet.getDataRange().getValues();
  var records = [];
  for (var i = 1; i < data.length; i++) {
    records.push({
      timestamp: data[i][0],
      id: data[i][1],
      tipe: data[i][2],
      status: data[i][3],
      tanggal: data[i][4],
      km: data[i][5],
      harga: data[i][6]
    });
  }
  return records;
}

function doPost(e) {
  try {
    var data;
    // Handle if content type is text/plain or application/json
    if (e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error("No data received");
    }
    
    var action = data.action;

    if (action === "save") {
      var sheetName = data.sheetName;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(["Timestamp", "ID", "Tipe Pengecekan", "Keterangan/Status", "Tanggal Revisi", "KM Revisi", "Harga Revisi"]);
      }

      var id = data.id;
      var tipe = data.tipe || "";
      var status = data.status || "";
      var tanggal = data.tanggal || "";
      var km = data.km || "";
      var harga = data.harga || "";
      var timestamp = new Date();

      var dataRange = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var i = 1; i < dataRange.length; i++) {
        if (dataRange[i][1] == id) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow !== -1) {
        // Update
        sheet.getRange(foundRow, 1, 1, 7).setValues([[timestamp, id, tipe, status, tanggal, km, harga]]);
      } else {
        // Check if header exists
        if (dataRange.length === 1 && dataRange[0].length === 1 && dataRange[0][0] === "") {
          sheet.getRange(1, 1, 1, 7).setValues([["Timestamp", "ID", "Tipe Pengecekan", "Keterangan/Status", "Tanggal Revisi", "KM Revisi", "Harga Revisi"]]);
        } else if (dataRange.length === 0 || dataRange[0][0] !== "Timestamp") {
            if (dataRange.length === 0) {
              sheet.appendRow(["Timestamp", "ID", "Tipe Pengecekan", "Keterangan/Status", "Tanggal Revisi", "KM Revisi", "Harga Revisi"]);
            }
        }
        sheet.appendRow([timestamp, id, tipe, status, tanggal, km, harga]);
      }

      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Data berhasil disimpan!"})).setMimeType(ContentService.MimeType.JSON);
    } else {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Unknown POST action"})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "getSheets") {
      return ContentService.createTextOutput(JSON.stringify({status: "success", data: getSheets()})).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "search") {
      return ContentService.createTextOutput(JSON.stringify({status: "success", data: searchRecord(e.parameter.sheetName, e.parameter.id)})).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "getAll") {
      return ContentService.createTextOutput(JSON.stringify({status: "success", data: getAllRecords(e.parameter.sheetName)})).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "BBM Connect Rekap API is running."})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.message})).setMimeType(ContentService.MimeType.JSON);
  }
}