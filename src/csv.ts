import { stringify } from "csv-stringify/sync";

export function toCsv(headers: string[], rows: string[][]): string {
    return stringify([headers, ...rows]);
}
