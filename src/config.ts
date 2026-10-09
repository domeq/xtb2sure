import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface Config {
    tickerOverrides: Record<string, string>;
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigError";
    }
}

export function resolveConfigPath(cliPath?: string): string {
    if (cliPath) {
        return path.resolve(cliPath);
    }

    const baseDir = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
    return path.join(baseDir, "xtb2sure", "config.json");
}

export async function loadConfig(filePath?: string): Promise<Config> {
    const resolvedPath = resolveConfigPath(filePath);

    let raw: string;
    try {
        raw = await readFile(resolvedPath, "utf8");
    } catch (error) {
        if (isNotFoundError(error)) {
            if (filePath) {
                throw new ConfigError(`Config file not found: ${resolvedPath}`);
            }

            return { tickerOverrides: {} };
        }

        throw new ConfigError(`Cannot read config file: ${resolvedPath}`);
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new ConfigError(`Invalid JSON in config file: ${resolvedPath}`);
    }

    return validateConfig(parsed);
}

function validateConfig(value: unknown): Config {
    if (!isPlainObject(value)) {
        throw new ConfigError("Config must be a JSON object");
    }

    const tickerOverrides = value.tickerOverrides ?? {};
    if (!isPlainObject(tickerOverrides)) {
        throw new ConfigError('Config "tickerOverrides" must be an object');
    }

    const overrides: Record<string, string> = {};
    for (const [ticker, override] of Object.entries(tickerOverrides)) {
        if (typeof override !== "string") {
            throw new ConfigError(`Config "tickerOverrides.${ticker}" must be a string`);
        }

        overrides[ticker] = override;
    }

    return { tickerOverrides: overrides };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotFoundError(error: unknown): boolean {
    return (
        typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ENOENT"
    );
}
