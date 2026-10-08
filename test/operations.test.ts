import assert from "node:assert/strict";
import test from "node:test";
import { classifyOperation, parseTradeValues } from "../src/operations.ts";

test("classifyOperation maps supported operation groups", () => {
    assert.equal(classifyOperation("Deposit"), "transaction");
    assert.equal(classifyOperation("Stock purchase"), "investment");
    assert.equal(classifyOperation("Total"), "ignored");
});

test("parseTradeValues parses BUY format with split quantity", () => {
    const parsed = parseTradeValues("OPEN BUY 7/7.7575 @ 42.750");
    assert.equal(parsed.qty, "7");
    assert.equal(parsed.price, "42.75");
    assert.equal(parsed.qtyHadExplicitDecimal, false);
});

test("parseTradeValues parses SELL format with decimal-preserving integer price", () => {
    const parsed = parseTradeValues("CLOSE SELL 0.9179 @ 1233.0");
    assert.equal(parsed.qty, "0.9179");
    assert.equal(parsed.price, "1233.0");
    assert.equal(parsed.qtyHadExplicitDecimal, true);
});
