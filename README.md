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
- `--config <file>` — path to config file (defaults to `~/.config/xtb2sure/config.json`)

Examples:

```bash
xtb2sure convert report.xlsx --currency USD --account "XTB IKE"
```

```bash
xtb2sure convert report.xlsx --currency PLN --account "XTB PLN" --out-dir ./out
```

## Configuration

Some XTB tickers differ from the tickers used by Sure.am's providers. You can override exported tickers via a JSON config file at `~/.config/xtb2sure/config.json` (or `$XDG_CONFIG_HOME/xtb2sure/config.json` when set):

```json
{
  "tickerOverrides": {
    "IPOL.UK": "IPOL.L"
  }
}
```

Keys are the XTB ticker, values are the Sure.am ticker. Overrides apply to the investments CSV only; unmatched tickers are exported unchanged.

Use `--config <file>` to load a config file from a different location.

## Exit codes

- `0` success
- `1` conversion or validation failure
- `2` usage or config error

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/domeq/xtb2sure.git
cd xtb2sure
npm install
```

Run the CLI directly from source — no build step required (Node.js runs TypeScript natively):

```bash
node src/cli.ts convert report.xlsx --currency USD --account "XTB IKE"
```

You can use any CLI flag this way, e.g. `node src/cli.ts --version`.

Build the compiled output (needed for `dist/`, which the published package uses):

```bash
npm run build
```

Run tests (Node.js test runner):

```bash
npm test
```

Run linting and type checking:

```bash
npm run lint
npm run typecheck
```
