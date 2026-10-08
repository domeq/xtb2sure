export type OperationType =
    | "Deposit"
    | "IKE deposit"
    | "IKZE deposit"
    | "Free funds interest"
    | "Free funds interest tax"
    | "Withholding tax"
    | "Stock purchase"
    | "Stock sell"
    | "Total";

export interface CashOperationRow {
    Type: string;
    Instrument: string;
    Ticker: string;
    Time: number;
    Amount: number;
    ID: string;
    Comment: string;
    Product: string;
    "Position ID": string;
}

export interface TransactionRecord {
    date: string;
    amount: string;
    name: string;
    account: string;
    notes: string;
}

export interface InvestmentRecord {
    date: string;
    ticker: string;
    currency: string;
    qty: string;
    price: string;
    account: string;
    name: string;
}

export interface ConversionIssue {
    rowIndex: number;
    operationId?: string;
    message: string;
}

export interface ConversionResult {
    transactions: TransactionRecord[];
    investments: InvestmentRecord[];
    ignoredRows: number;
    issues: ConversionIssue[];
}
