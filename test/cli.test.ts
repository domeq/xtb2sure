import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const cliPath = path.join(rootDir, "src", "cli.ts");

test("CLI validates required --currency and --account args", async () => {
    const result = await runCli([
        "convert",
        path.join(rootDir, "test", "fixtures", "IKE", "input.xlsx"),
        "--currency",
        "USD",
    ]);

    assert.equal(result.code, 2);
    assert.match(result.stderr, /required option/);
});

test("CLI generates output files", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-cli-"));
    const txPath = path.join(tmpDir, "tx.csv");
    const invPath = path.join(tmpDir, "inv.csv");

    const result = await runCli([
        "convert",
        path.join(rootDir, "test", "fixtures", "IKE", "input.xlsx"),
        "--currency",
        "USD",
        "--account",
        "XTB IKE",
        "--transactions-out",
        txPath,
        "--investments-out",
        invPath,
    ]);

    assert.equal(result.code, 0);
    await access(txPath);
    await access(invPath);
});

test("CLI dry-run does not create output files", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-dry-"));
    const txPath = path.join(tmpDir, "tx.csv");
    const invPath = path.join(tmpDir, "inv.csv");

    const result = await runCli([
        "convert",
        path.join(rootDir, "test", "fixtures", "IKE", "input.xlsx"),
        "--currency",
        "USD",
        "--account",
        "XTB IKE",
        "--transactions-out",
        txPath,
        "--investments-out",
        invPath,
        "--dry-run",
    ]);

    assert.equal(result.code, 0);
    await assert.rejects(() => access(txPath));
    await assert.rejects(() => access(invPath));
});

test("CLI strict mode fails when mapping issue is encountered", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-strict-"));
    const inputPath = path.join(tmpDir, "bad.xlsx");
    const reportPath = path.join(tmpDir, "report.json");
    await writeInvalidTradeWorkbook(inputPath);

    const strictResult = await runCli([
        "convert",
        inputPath,
        "--currency",
        "USD",
        "--account",
        "XTB TEST",
        "--strict",
        "--report",
        reportPath,
    ]);

    assert.equal(strictResult.code, 1);

    const relaxedResult = await runCli([
        "convert",
        inputPath,
        "--currency",
        "USD",
        "--account",
        "XTB TEST",
        "--report",
        reportPath,
    ]);

    assert.equal(relaxedResult.code, 0);
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    assert.equal(report.totals.issues, 1);
});

function runCli(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ["--experimental-transform-types", cliPath, ...args], {
            cwd: rootDir,
            stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += String(chunk);
        });

        child.stderr.on("data", (chunk) => {
            stderr += String(chunk);
        });

        child.on("error", reject);
        child.on("close", (code) => {
            resolve({ code, stdout, stderr });
        });
    });
}

async function writeInvalidTradeWorkbook(outPath: string): Promise<void> {
    const worksheet = xlsx.utils.aoa_to_sheet([
        ["Account number", "123"],
        ["Cash Operations"],
        ["Date from (UTC)", 46000],
        ["Date to (UTC)", 46001],
        ["Type", "Instrument", "Ticker", "Category", "Time", "Amount", "ID", "Comment", "Product", "Position ID"],
        ["Stock purchase", "Test instrument", "TEST.UK", "", 46000.5, 123.45, "1", "BROKEN COMMENT", "My Trades", ""],
    ]);

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Cash Operations");
    xlsx.writeFile(workbook, outPath);
}
