import { toCsv } from "./csv.ts";
import type { InvestmentRecord, TransactionRecord } from "./types.ts";

export function transactionsToCsv(records: TransactionRecord[]): string {
    return toCsv(
        ["date", "amount", "name", "account", "notes"],
        records.map((record) => [record.date, record.amount, record.name, record.account, record.notes]),
    );
}

export function investmentsToCsv(records: InvestmentRecord[]): string {
    return toCsv(
        ["date", "ticker", "currency", "qty", "price", "account", "name"],
        records.map((record) => [
            record.date,
            record.ticker,
            record.currency,
            record.qty,
            record.price,
            record.account,
            record.name,
        ]),
    );
}
