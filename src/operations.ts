import type { CashOperationRow } from "./types.ts";

const TRANSACTION_TYPES = new Set([
    "Deposit",
    "Free funds interest",
    "Free funds interest tax",
    "IKE deposit",
    "IKZE deposit",
    "Withholding tax",
]);

const INVESTMENT_TYPES = new Set(["Stock purchase", "Stock sell"]);

export function classifyOperation(type: string): "transaction" | "investment" | "ignored" {
    if (TRANSACTION_TYPES.has(type)) {
        return "transaction";
    }

    if (INVESTMENT_TYPES.has(type)) {
        return "investment";
    }

    return "ignored";
}

export interface ParsedTradeValues {
    price: string;
    qty: string;
    qtyHadExplicitDecimal: boolean;
}

export function parseTradeValues(comment: string): ParsedTradeValues {
    const normalized = comment.replace(/,/g, ".");
    const buySellMatch = normalized.match(
        /(?:\bBUY\b|\bSELL\b)\s+([+-]?\d+(?:\.\d+)?)(?:\/[+-]?\d+(?:\.\d+)?)?\s*@\s*([+-]?\d+(?:\.\d+)?)/i,
    );

    const qtyMatch = buySellMatch
        ? [buySellMatch[0], buySellMatch[1]]
        : normalized.match(/\b([+-]?\d+(?:\.\d+)?)\b\s*@/);
    const priceMatch = buySellMatch ? [buySellMatch[0], buySellMatch[2]] : normalized.match(/@\s*([+-]?\d+(?:\.\d+)?)/);

    if (!qtyMatch || !priceMatch) {
        throw new Error(`Could not parse qty/price from comment: ${comment}`);
    }

    const rawQty = qtyMatch[1];
    const rawPrice = priceMatch[1];
    if (!rawQty || !rawPrice) {
        throw new Error(`Could not parse qty/price from comment: ${comment}`);
    }

    return {
        price: normalizeNumberString(rawPrice),
        qty: normalizeNumberString(rawQty),
        qtyHadExplicitDecimal: rawQty.includes("."),
    };
}

function normalizeNumberString(value: string): string {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid numeric value: ${value}`);
    }

    if (value.includes(".") && Number.isInteger(parsed)) {
        return parsed.toFixed(1);
    }

    return String(parsed);
}

export function buildTransactionNotes(row: CashOperationRow): string {
    const comment = row.Comment?.trim();
    const base = comment ? `XTB ${row.ID}: ${comment}` : `XTB ${row.ID}`;
    const product = row.Product?.trim();

    if (!product || product === "IKE" || product === "IKZE") {
        return base;
    }

    return `${base} [subaccount: ${product}]`;
}

export function buildInvestmentName(row: CashOperationRow): string {
    if (row.Product?.trim() === "IKE") {
        return `XTB ${row.ID}: ${row.Type}`;
    }

    const instrument = row.Instrument?.trim();
    if (instrument) {
        return `${instrument} - ${row.Type} (XTB ${row.ID})`;
    }

    return `XTB ${row.ID}: ${row.Type}`;
}

export function formatQtyOutput(
    qty: string,
    instrument: string,
    qtyHadExplicitDecimal: boolean,
    product: string,
): string {
    if (product.trim() === "IKE") {
        return qtyHadExplicitDecimal ? qty : String(Number(qty));
    }

    if (qtyHadExplicitDecimal) {
        return qty;
    }

    return instrument.trim() ? `${qty}.0` : qty;
}
