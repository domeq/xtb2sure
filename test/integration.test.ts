import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readCashOperationsSheet } from "../src/excel.ts";
import { convertFile } from "../src/index.ts";
import { classifyOperation } from "../src/operations.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("IKE fixture conversion matches expected outputs", async () => {
    const result = await convertFile({
        account: "XTB IKE",
        currency: "USD",
        dryRun: true,
        inputPath: path.join(rootDir, "test", "fixtures", "IKE", "input.xlsx"),
    });

    const expectedTransactions = await readExpected("test/fixtures/IKE/output_transactions.csv");
    const expectedInvestments = await readExpected("test/fixtures/IKE/output_investments.csv");

    assert.equal(normalizeEol(result.transactionsCsv), expectedTransactions);
    assert.equal(normalizeEol(result.investmentsCsv), expectedInvestments);
});

test("PLN fixture conversion matches expected outputs", async () => {
    const result = await convertFile({
        account: "XTB PLN",
        currency: "PLN",
        dryRun: true,
        inputPath: path.join(rootDir, "test", "fixtures", "PLN", "input.xlsx"),
    });

    const expectedTransactions = await readExpected("test/fixtures/PLN/output_transactions.csv");
    const expectedInvestments = await readExpected("test/fixtures/PLN/output_investments.csv");

    assert.equal(normalizeEol(result.transactionsCsv), expectedTransactions);
    assert.equal(normalizeEol(result.investmentsCsv), expectedInvestments);
});

test("investment ticker regression: output ticker equals source ticker by XTB operation ID", async () => {
    const inputPath = path.join(rootDir, "test", "fixtures", "PLN", "input.xlsx");
    const result = await convertFile({
        account: "XTB PLN",
        currency: "PLN",
        dryRun: true,
        inputPath,
    });

    const rows = readCashOperationsSheet(inputPath);
    const byId = new Map<string, string>();

    for (const row of rows) {
        if (classifyOperation(row.Type) === "investment") {
            byId.set(row.ID, row.Ticker);
        }
    }

    for (const line of normalizeEol(result.investmentsCsv).split("\n").slice(1)) {
        if (!line.trim()) {
            continue;
        }

        const cells = parseCsvLine(line);
        const ticker = cells[1];
        const name = cells[6];
        assert.ok(typeof ticker === "string" && ticker.length > 0);
        assert.ok(typeof name === "string" && name.length > 0);
        const idMatch = name.match(/XTB\s+(\d+)/);
        assert.ok(idMatch, `Missing XTB ID in row: ${line}`);
        const id = idMatch[1];
        assert.ok(id);
        assert.equal(ticker, byId.get(id));
    }
});

test("investment currency is always taken from CLI argument", async () => {
    const result = await convertFile({
        account: "XTB PLN",
        currency: "PLN",
        dryRun: true,
        inputPath: path.join(rootDir, "test", "fixtures", "PLN", "input.xlsx"),
    });

    for (const line of normalizeEol(result.investmentsCsv).split("\n").slice(1)) {
        if (!line.trim()) {
            continue;
        }

        const cells = parseCsvLine(line);
        assert.equal(cells[2], "PLN");
    }
});

test("investment price is derived from Amount and qty", async () => {
    const inputPath = path.join(rootDir, "test", "fixtures", "PLN", "input.xlsx");
    const result = await convertFile({
        account: "XTB PLN",
        currency: "PLN",
        dryRun: true,
        inputPath,
    });

    const rows = readCashOperationsSheet(inputPath);
    const amountById = new Map<string, number>();

    for (const row of rows) {
        if (classifyOperation(row.Type) === "investment") {
            amountById.set(row.ID, Math.abs(row.Amount));
        }
    }

    for (const line of normalizeEol(result.investmentsCsv).split("\n").slice(1)) {
        if (!line.trim()) {
            continue;
        }

        const cells = parseCsvLine(line);
        const qty = Math.abs(Number(cells[3]));
        const price = Number(cells[4]);
        const name = cells[6] ?? "";
        const idMatch = name.match(/XTB\s+(\d+)/);
        assert.ok(idMatch, `Missing XTB ID in row: ${line}`);
        const id = idMatch[1];
        assert.ok(id);
        const expectedAmount = amountById.get(id);
        assert.ok(typeof expectedAmount === "number", `No amount found for ID ${id}`);

        const actualAmount = qty * price;
        assert.ok(Math.abs(actualAmount - expectedAmount) < 0.02, `Amount mismatch for ${id}`);
    }
});

async function readExpected(relativePath: string): Promise<string> {
    const value = await readFile(path.join(rootDir, relativePath), "utf8");
    return normalizeEol(value);
}

function normalizeEol(value: string): string {
    return value.replace(/\r\n/g, "\n");
}

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    cells.push(current);

    return cells;
}
