import assert from "node:assert/strict";
import test from "node:test";
import { convertRows } from "../src/convert.ts";
import type { CashOperationRow } from "../src/types.ts";

function investmentRow(ticker: string): CashOperationRow {
    return {
        Type: "Stock purchase",
        Instrument: "Test instrument",
        Ticker: ticker,
        Time: 46000.5,
        Amount: 100,
        ID: "1",
        Comment: "OPEN BUY 10 @ 10.0",
        Product: "My Trades",
        "Position ID": "",
    };
}

test("convertRows applies ticker overrides", () => {
    const rows = [investmentRow("IPOL.UK")];
    const result = convertRows(rows, {
        account: "XTB TEST",
        currency: "USD",
        strict: false,
        tickerOverrides: { "IPOL.UK": "IPOL.L" },
    });

    assert.equal(result.investments[0]?.ticker, "IPOL.L");
});

test("convertRows passes through tickers without overrides", () => {
    const rows = [investmentRow("AAPL.US")];
    const result = convertRows(rows, {
        account: "XTB TEST",
        currency: "USD",
        strict: false,
        tickerOverrides: { "IPOL.UK": "IPOL.L" },
    });

    assert.equal(result.investments[0]?.ticker, "AAPL.US");
});
