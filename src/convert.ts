import { excelSerialToYYYYMMDD } from "./date.ts";
import {
    buildInvestmentName,
    buildTransactionNotes,
    classifyOperation,
    formatQtyOutput,
    parseTradeValues,
} from "./operations.ts";
import type { CashOperationRow, ConversionResult, InvestmentRecord, TransactionRecord } from "./types.ts";

export interface ConvertOptions {
    account: string;
    currency: string;
    strict: boolean;
}

export function convertRows(rows: CashOperationRow[], options: ConvertOptions): ConversionResult {
    const transactions: TransactionRecord[] = [];
    const investments: InvestmentRecord[] = [];
    const issues: ConversionResult["issues"] = [];
    let ignoredRows = 0;

    for (const [index, row] of rows.entries()) {
        const typeClass = classifyOperation(row.Type);

        if (row.Type === "Total") {
            ignoredRows += 1;
            continue;
        }

        if (typeClass === "ignored") {
            ignoredRows += 1;
            continue;
        }

        try {
            const date = excelSerialToYYYYMMDD(row.Time);

            if (typeClass === "transaction") {
                transactions.push({
                    account: options.account,
                    amount: normalizeAmount(row.Amount),
                    date,
                    name: row.Type,
                    notes: buildTransactionNotes(row),
                });
            } else {
                const { price, qty, qtyHadExplicitDecimal } = parseTradeValues(row.Comment);
                const signedQtyValue = row.Type === "Stock sell" ? forceNegative(qty) : forcePositive(qty);
                const signedQty = formatQtyOutput(signedQtyValue, row.Instrument, qtyHadExplicitDecimal, row.Product);

                investments.push({
                    account: options.account,
                    currency: options.currency,
                    date,
                    name: buildInvestmentName(row),
                    price,
                    qty: signedQty,
                    ticker: row.Ticker,
                });
            }
        } catch (error) {
            issues.push({
                message: error instanceof Error ? error.message : String(error),
                operationId: row.ID,
                rowIndex: index + 2,
            });

            if (options.strict) {
                break;
            }
        }
    }

    if (rows.some((row) => row.Product.trim() !== "" && row.Product.trim() !== "IKE")) {
        investments.sort((a, b) => a.date.localeCompare(b.date));
    }

    return {
        ignoredRows,
        investments,
        issues,
        transactions,
    };
}

function normalizeAmount(amount: number): string {
    return amount.toFixed(2);
}

function forceNegative(qty: string): string {
    const num = Math.abs(Number(qty));
    return String(-num);
}

function forcePositive(qty: string): string {
    const num = Math.abs(Number(qty));
    return String(num);
}
