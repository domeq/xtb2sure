import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { convertRows } from "./convert.ts";
import { readCashOperationsSheet } from "./excel.ts";
import { investmentsToCsv, transactionsToCsv } from "./output.ts";

export interface ConvertFileOptions {
    inputPath: string;
    currency: string;
    account: string;
    outDir?: string;
    transactionsOut?: string;
    investmentsOut?: string;
    strict?: boolean;
    dryRun?: boolean;
    report?: string;
    tickerOverrides?: Record<string, string>;
}

export interface ConvertFileResult {
    transactionsCsv: string;
    investmentsCsv: string;
    transactionsOutPath: string;
    investmentsOutPath: string;
    reportData: {
        inputPath: string;
        totals: {
            sourceRows: number;
            transactionRows: number;
            investmentRows: number;
            ignoredRows: number;
            issues: number;
        };
        issues: Array<{ rowIndex: number; operationId?: string; message: string }>;
    };
}

export async function convertFile(options: ConvertFileOptions): Promise<ConvertFileResult> {
    const rows = readCashOperationsSheet(options.inputPath);
    const result = convertRows(rows, {
        account: options.account,
        currency: options.currency,
        strict: Boolean(options.strict),
        tickerOverrides: options.tickerOverrides,
    });

    const transactionsCsv = transactionsToCsv(result.transactions);
    const investmentsCsv = investmentsToCsv(result.investments);

    const resolvedOutDir = options.outDir
        ? path.resolve(options.outDir)
        : path.dirname(path.resolve(options.inputPath));
    const baseName = path.basename(options.inputPath, path.extname(options.inputPath));
    const transactionsOutPath = path.resolve(
        options.transactionsOut ?? path.join(resolvedOutDir, `${baseName}.transactions.csv`),
    );
    const investmentsOutPath = path.resolve(
        options.investmentsOut ?? path.join(resolvedOutDir, `${baseName}.investments.csv`),
    );

    if (!options.dryRun) {
        await mkdir(path.dirname(transactionsOutPath), { recursive: true });
        await mkdir(path.dirname(investmentsOutPath), { recursive: true });
        await writeFile(transactionsOutPath, transactionsCsv, "utf8");
        await writeFile(investmentsOutPath, investmentsCsv, "utf8");
    }

    const reportData = {
        inputPath: path.resolve(options.inputPath),
        totals: {
            sourceRows: rows.length,
            transactionRows: result.transactions.length,
            investmentRows: result.investments.length,
            ignoredRows: result.ignoredRows,
            issues: result.issues.length,
        },
        issues: result.issues,
    };

    if (options.report) {
        const reportPath = path.resolve(options.report);
        if (!options.dryRun) {
            await mkdir(path.dirname(reportPath), { recursive: true });
            await writeFile(reportPath, `${JSON.stringify(reportData, null, 2)}\n`, "utf8");
        }
    }

    return {
        transactionsCsv,
        investmentsCsv,
        transactionsOutPath,
        investmentsOutPath,
        reportData,
    };
}
