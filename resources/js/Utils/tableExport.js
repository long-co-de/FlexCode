const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const normalizeRows = (rows) => {
    if (!rows.length) {
        return { headers: [], normalizedRows: [] };
    }

    const headers = Object.keys(rows[0]);
    const normalizedRows = rows.map((row) =>
        headers.map((header) => row[header] ?? '')
    );

    return { headers, normalizedRows };
};

export const exportRowsToCsv = (filename, rows) => {
    const { headers, normalizedRows } = normalizeRows(rows);

    const csvContent = [headers, ...normalizedRows]
        .map((row) => row
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(','))
        .join('\r\n');

    downloadFile(`\uFEFF${csvContent}`, filename, 'text/csv;charset=utf-8;');
};

export const exportRowsToExcel = (filename, sheetName, rows) => {
    const { headers, normalizedRows } = normalizeRows(rows);

    const tableHeaders = headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join('');

    const tableRows = normalizedRows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');

    const workbook = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8" />
                <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8" />
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>${escapeHtml(sheetName)}</x:Name>
                                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
            </head>
            <body>
                <table>
                    <thead><tr>${tableHeaders}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
        </html>`;

    downloadFile(workbook, filename, 'application/vnd.ms-excel;charset=utf-8;');
};
