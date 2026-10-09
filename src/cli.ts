#!/usr/bin/env node

import { createRequire } from "node:module";
import process from "node:process";
import { Command, CommanderError } from "commander";
import { convertFile } from "./index.ts";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const EXIT_SUCCESS = 0;
const EXIT_CONVERSION_FAILURE = 1;
const EXIT_USAGE_ERROR = 2;

interface ConvertCommandOptions {
    account: string;
    currency: string;
    dryRun: boolean;
    investmentsOut?: string;
    outDir?: string;
    report?: string;
    strict: boolean;
    transactionsOut?: string;
}

async function main(argv: string[]): Promise<number> {
    let exitCode = EXIT_SUCCESS;

    const program = new Command();
    program
        .name("xtb2sure")
        .description("Convert XTB .xlsx exports into Sure-compatible CSV files")
        .version(version)
        .showHelpAfterError()
        .exitOverride();

    program
        .command("convert")
        .argument("<input.xlsx>", "Path to XTB export workbook")
        .requiredOption("--currency <code>", "Account currency for all investment rows")
        .requiredOption("--account <name>", "Account label used in generated CSV files")
        .option("--out-dir <dir>", "Output directory for default file names")
        .option("--transactions-out <file>", "Transactions CSV path")
        .option("--investments-out <file>", "Investments CSV path")
        .option("--strict", "Fail on first conversion issue", false)
        .option("--dry-run", "Do not write output files", false)
        .option("--report <file>", "Write conversion report JSON to file")
        .action(async (inputPath: string, options: ConvertCommandOptions) => {
            try {
                const result = await convertFile({
                    account: options.account,
                    currency: options.currency,
                    dryRun: options.dryRun,
                    inputPath,
                    investmentsOut: options.investmentsOut,
                    outDir: options.outDir,
                    report: options.report,
                    strict: options.strict,
                    transactionsOut: options.transactionsOut,
                });

                const totals = result.reportData.totals;
                console.error(
                    `Converted rows=${totals.sourceRows}, transactions=${totals.transactionRows}, investments=${totals.investmentRows}, ignored=${totals.ignoredRows}, issues=${totals.issues}`,
                );

                if (options.dryRun) {
                    console.error("Dry run enabled: files were not written.");
                } else {
                    console.error(`Transactions CSV: ${result.transactionsOutPath}`);
                    console.error(`Investments CSV: ${result.investmentsOutPath}`);
                }

                if (totals.issues > 0 && options.strict) {
                    exitCode = EXIT_CONVERSION_FAILURE;
                }
            } catch (error) {
                console.error(error instanceof Error ? error.message : String(error));
                exitCode = EXIT_CONVERSION_FAILURE;
            }
        });

    try {
        await program.parseAsync(argv, { from: "user" });

        return exitCode;
    } catch (error) {
        if (error instanceof CommanderError) {
            if (error.code === "commander.helpDisplayed" || error.code === "commander.version") {
                return EXIT_SUCCESS;
            }

            return EXIT_USAGE_ERROR;
        }

        console.error(error instanceof Error ? error.message : String(error));
        return EXIT_CONVERSION_FAILURE;
    }
}

main(process.argv.slice(2))
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = EXIT_CONVERSION_FAILURE;
    });
