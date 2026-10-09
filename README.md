# xtb2sure

Convert XTB `.xlsx` exports into [Sure.am](https://sure.am/)-compatible CSV files.

## What it does

- Reads the `Cash Operations` sheet from an XTB export workbook.
- Produces two CSV files:
  - transactions CSV (`date,amount,name,account,notes`)
  - investments CSV (`date,ticker,currency,qty,price,account,name`)

## Requirements

- Node.js 24+

## Install

Install globally with npm:

```bash
npm install -g @jaskrowo/xtb2sure
```

This makes the `xtb2sure` command available everywhere on your system.

## Usage

```bash
xtb2sure convert <input.xlsx> --currency <CODE> --account "<ACCOUNT_NAME>"
```

Options:

- `--out-dir <dir>` — output directory for default file names (defaults to the input file's directory)
- `--transactions-out <file>` — transactions CSV path
- `--investments-out <file>` — investments CSV path
- `--strict` — fail on the first conversion issue
- `--dry-run` — do not write output files
- `--report <file>` — write conversion report JSON to file

Examples:

```bash
xtb2sure convert report.xlsx --currency USD --account "XTB IKE"
```

```bash
xtb2sure convert report.xlsx --currency PLN --account "XTB PLN" --out-dir ./out
```

## Exit codes

- `0` success
- `1` conversion or validation failure
- `2` usage or config error

## Development

Build the compiled output:

```bash
npm run build
```

Run tests (Node.js test runner):

```bash
npm test
```
