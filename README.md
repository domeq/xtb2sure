# xtb2sure

Convert XTB `.xlsx` exports into Sure-compatible CSV files.

## What it does

- Reads the `Cash Operations` sheet from an XTB export workbook.
- Produces two CSV files:
  - transactions CSV (`date,amount,name,account,notes`)
  - investments CSV (`date,ticker,currency,qty,price,account,name`)

## Requirements

- Node.js 24+

## Install

```bash
npm install
```

## Usage

```bash
node ./src/cli.ts convert <input.xlsx> --currency <CODE> --account "<ACCOUNT_NAME>"
```

Options:

- `--out-dir <dir>`
- `--transactions-out <file>`
- `--investments-out <file>`
- `--strict`
- `--dry-run`
- `--report <file>`

Examples:

```bash
node ./src/cli.ts convert sample_data/IKE/input.xlsx --currency USD --account "XTB IKE"
```

```bash
node ./src/cli.ts convert sample_data/PLN/input.xlsx --currency PLN --account "XTB PLN" --out-dir ./out

Or via npm script:

```bash
npm run convert -- sample_data/PLN/input.xlsx --currency PLN --account "XTB PLN"
```
```

## Exit codes

- `0` success
- `1` conversion or validation failure
- `2` usage or config error

## Development

Run tests (Node.js test runner):

```bash
npm test
```
