# xtb2sure PRD

## Goal

Build an open-source TypeScript CLI that converts XTB `.xlsx` exports into two Sure-compatible CSV files:

1. transactions CSV (for Sure Transactions import)
2. investments CSV (for Sure Trades import)

Target runtime is current Node LTS, executed directly via Node strip-types.

## Confirmed Decisions

- Input format: `.xlsx`
- Source data: only `Cash Operations` sheet
- Output: two CSVs per input file
- Date output format: `YYYY-MM-DD`
- Currency: required CLI parameter
- Account: account-level label provided by CLI (e.g. `XTB PLN`, `XTB IKE`)
- Include tax rows (`Free funds interest tax`, `Withholding tax`)
- Ignore summary `Total` row
- Trade ticker uses XTB input as-is (e.g. `EIMI.UK`, `IUSQ.DE`)

## Input Schema (XTB Cash Operations)

Relevant columns:
- `Type`
- `Instrument`
- `Ticker`
- `Time`
- `Amount`
- `ID`
- `Comment`
- `Product`
- `Position ID`

## Output A: Transactions CSV

Header:
- `date,amount,name,account,notes`

Includes operation types:
- `Deposit`
- `IKE deposit`
- `IKZE deposit`
- `Free funds interest`
- `Free funds interest tax`
- `Withholding tax`

Mapping:
- `date` from `Time` (Excel serial UTC) -> `YYYY-MM-DD`
- `amount` from `Amount` (signed as-is)
- `name` from `Type` (or normalized label if fixture requires)
- `account` from CLI account label
- `notes` as traceable text including `XTB <ID>` and source comment

## Output B: Investments CSV

Header:
- `date,ticker,currency,qty,price,account,name`

Includes operation types:
- `Stock purchase`
- `Stock sell`

Mapping:
- `date` from `Time` -> `YYYY-MM-DD`
- `ticker` from XTB `Ticker` as-is (e.g. `IPOL.UK`, `SXRV.DE`)
- `currency` from CLI currency argument
- `qty` parsed from `Comment` (sell rows negative where reflected in fixture)
- `price` parsed from `Comment` (`@ <price>`)
- `account` from CLI account label
- `name` fixture-compatible human-readable label including `XTB <ID>`

## CLI (v1)

Command:
- `xtb2sure convert <input.xlsx> --currency <CODE> --account "<ACCOUNT_NAME>"`

Options:
- `--out-dir <dir>`
- `--transactions-out <file>`
- `--investments-out <file>`
- `--strict`
- `--dry-run`
- `--report <file>`

Exit codes:
- `0` success
- `1` conversion/validation failure
- `2` usage/config error

## TDD Plan

### Unit tests
- Excel serial date conversion
- operation classification (transaction/investment/ignored)
- qty/price parser from comment text
- per-row mapping by type

### Integration tests (fixture exact)
- `sample_data/IKE/input.xlsx` -> exact match:
  - `sample_data/IKE/output_transactions.csv`
  - `sample_data/IKE/output_investments.csv`
- `sample_data/PLN/input.xlsx` -> exact match:
  - `sample_data/PLN/output_transactions.csv`
  - `sample_data/PLN/output_investments.csv`
- investments schema regression checks:
  - `ticker` equals source `Cash Operations.Ticker` value for the matching XTB operation ID

### CLI tests
- required args validation (`--currency`, `--account`)
- output file generation
- `--dry-run` behavior
- strict-mode failure behavior
- summary counters and exit codes

## Open Source Baseline

Include in repo from the beginning:
- `README.md`
- `LICENSE` (permissive and inclusive; MIT recommended unless you choose otherwise)
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- optional but recommended: `SECURITY.md`, CI workflow, issue templates

## Non-goals (v1)

- `Closed Positions` / `Open Positions` parsing
- Sure API upload automation
- FX conversion logic
- Data enrichment beyond deterministic mapping

## Fixture Status

Current fixtures are aligned and usable for TDD:
- `sample_data/IKE`
- `sample_data/PLN`

Investments outputs now use:
- ticker from input as-is
