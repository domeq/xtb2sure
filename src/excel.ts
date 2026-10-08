import xlsx from "xlsx";
import type { CashOperationRow } from "./types.ts";

const { readFile, utils } = xlsx;

const REQUIRED_COLUMNS = [
    "Type",
    "Instrument",
    "Ticker",
    "Time",
    "Amount",
    "ID",
    "Comment",
    "Product",
    "Position ID",
] as const;

export function readCashOperationsSheet(inputPath: string): CashOperationRow[] {
    const workbook = withSuppressedXlsxWarnings(() => readFile(inputPath, { cellDates: false, raw: true }));
    const worksheet = workbook.Sheets["Cash Operations"];

    if (!worksheet) {
        throw new Error("Input workbook is missing required sheet: Cash Operations");
    }

    const matrix = utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: "",
        raw: true,
    });

    const headerIndex = matrix.findIndex(
        (row) => Array.isArray(row) && row[0] === "Type" && row.includes("Time") && row.includes("Comment"),
    );

    if (headerIndex < 0) {
        throw new Error("Could not locate Cash Operations header row");
    }

    const headers = matrix[headerIndex] as unknown[];
    const headerToIndex = new Map<string, number>();
    headers.forEach((header, index) => {
        headerToIndex.set(String(header), index);
    });

    const missingColumns = REQUIRED_COLUMNS.filter((column) => !headerToIndex.has(column));
    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns in Cash Operations: ${missingColumns.join(", ")}`);
    }

    const bodyRows = matrix
        .slice(headerIndex + 1)
        .filter((row) => Array.isArray(row) && String(row[0]).trim().length > 0);
    return bodyRows.map((row) => normalizeRowFromArray(row, headerToIndex));
}

function withSuppressedXlsxWarnings<T>(fn: () => T): T {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
        if (typeof args[0] === "string" && args[0].includes("Bad uncompressed size:")) {
            return;
        }

        originalConsoleError(...args);
    };

    try {
        return fn();
    } finally {
        console.error = originalConsoleError;
    }
}

function normalizeRowFromArray(row: unknown[], headerToIndex: Map<string, number>): CashOperationRow {
    const get = (column: string): unknown => row[headerToIndex.get(column) ?? -1];

    return {
        Type: stringValue(get("Type")),
        Instrument: stringValue(get("Instrument")),
        Ticker: stringValue(get("Ticker")),
        Time: numberValue(get("Time")),
        Amount: numberValue(get("Amount")),
        ID: stringValue(get("ID")),
        Comment: stringValue(get("Comment")),
        Product: stringValue(get("Product")),
        "Position ID": stringValue(get("Position ID")),
    };
}

function stringValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
}

function numberValue(value: unknown): number {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) {
        return Number.NaN;
    }

    return num;
}
