const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function excelSerialToDate(serial: number): Date {
    if (!Number.isFinite(serial)) {
        throw new Error(`Invalid Excel serial date: ${serial}`);
    }

    const utcMs = EXCEL_EPOCH_UTC_MS + Math.round(serial * DAY_MS);
    return new Date(utcMs);
}

function formatDateYYYYMMDD(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function excelSerialToYYYYMMDD(serial: number): string {
    return formatDateYYYYMMDD(excelSerialToDate(serial));
}
