import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ConfigError, loadConfig } from "../src/config.ts";

test("loadConfig returns empty overrides when default config does not exist", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const previous = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = tmpDir;

    try {
        const config = await loadConfig();
        assert.deepEqual(config, { tickerOverrides: {} });
    } finally {
        if (previous === undefined) {
            delete process.env.XDG_CONFIG_HOME;
        } else {
            process.env.XDG_CONFIG_HOME = previous;
        }

        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig throws ConfigError when explicit config file is missing", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const missingPath = path.join(tmpDir, "missing", "config.json");

    try {
        await assert.rejects(() => loadConfig(missingPath), ConfigError);
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig parses a valid config file", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const configPath = path.join(tmpDir, "config.json");

    try {
        await writeFile(configPath, JSON.stringify({ tickerOverrides: { "IPOL.UK": "IPOL.L" } }), "utf8");
        const config = await loadConfig(configPath);
        assert.deepEqual(config, { tickerOverrides: { "IPOL.UK": "IPOL.L" } });
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig ignores unknown top-level keys", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const configPath = path.join(tmpDir, "config.json");

    try {
        await writeFile(configPath, JSON.stringify({ futureOption: true }), "utf8");
        const config = await loadConfig(configPath);
        assert.deepEqual(config, { tickerOverrides: {} });
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig throws ConfigError for invalid JSON", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const configPath = path.join(tmpDir, "config.json");

    try {
        await writeFile(configPath, "{not json", "utf8");
        await assert.rejects(() => loadConfig(configPath), ConfigError);
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig throws ConfigError for non-string override values", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const configPath = path.join(tmpDir, "config.json");

    try {
        await writeFile(configPath, JSON.stringify({ tickerOverrides: { "IPOL.UK": 123 } }), "utf8");
        await assert.rejects(
            () => loadConfig(configPath),
            (error: unknown) => {
                assert.ok(error instanceof ConfigError);
                assert.match(error.message, /tickerOverrides\.IPOL\.UK/);
                return true;
            },
        );
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});

test("loadConfig throws ConfigError for non-object tickerOverrides", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xtb2sure-config-"));
    const configPath = path.join(tmpDir, "config.json");

    try {
        await writeFile(configPath, JSON.stringify({ tickerOverrides: "nope" }), "utf8");
        await assert.rejects(() => loadConfig(configPath), ConfigError);
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
});
