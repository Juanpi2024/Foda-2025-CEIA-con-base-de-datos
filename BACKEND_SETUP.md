# Configuración del Backend (Google Apps Script)

Para que la aplicación guarde los datos en TU hoja de cálculo, debes instalar el script de backend allí.

1. Abre tu hoja de cálculo.
2. Ve a Extensiones > Apps Script.
3. Pega el siguiente código:

```javascript
/* BACKEND PARA ENCUESTA FODA */
const SHEET_NAME = "Respuestas";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const json = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => obj[header] = row[index]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Fecha", "nombre", "q1", "open1"]); // Simplified headers for example
  }
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = [];
  const params = e.parameter;
  headers.forEach(header => {
    if (header.toLowerCase() === 'fecha') newRow.push(new Date());
    else newRow.push(params[header] || params[header.toLowerCase()] || "");
  });
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({result:"success"})).setMimeType(ContentService.MimeType.JSON);
}
```

4. Implementar > Nueva implementación > Tipo: Aplicación web.
5. Acceso: "Cualquier usuario".
6. Copia la URL generada y envíamela.
