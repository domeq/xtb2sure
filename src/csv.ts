export function toCsv(headers: string[], rows: string[][]): string {
    const lines: string[] = [];
    lines.push(headers.join(","));

    for (const row of rows) {
        lines.push(row.map(escapeCsvCell).join(","));
    }

    return `${lines.join("\n")}\n`;
}

function escapeCsvCell(value: string): string {
    if (/[,"\n]/.test(value)) {
        return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
}
