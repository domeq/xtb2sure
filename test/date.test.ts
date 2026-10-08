import assert from "node:assert/strict";
import test from "node:test";
import { excelSerialToYYYYMMDD } from "../src/date.ts";

test("excelSerialToYYYYMMDD converts known fixture serials", () => {
    assert.equal(excelSerialToYYYYMMDD(46266.43755445602), "2026-09-01");
    assert.equal(excelSerialToYYYYMMDD(46079.041666666664), "2026-02-26");
});
