import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultServerEntry = join(repositoryRoot, "build", "index.js");
const privatePrompt = "PRIVATE_PROMPT_DO_NOT_LOG";

function jsonRpcMessages(prompt) {
  return [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "stdio-protocol-test",
          version: "1.0.0",
        },
      },
    },
    {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "enhance_prompt",
        arguments: {
          prompt,
        },
      },
    },
  ];
}

function parseStdoutMessages(stdout) {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  assert.ok(lines.length > 0, "server must emit at least one JSON-RPC response");

  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      assert.fail(`stdout contained a non-JSON MCP message: ${JSON.stringify(line)}\n${error}`);
    }
  });
}

async function runStdioServer(mockFetchFixture) {
  const serverEntry = process.env.MCP_SERVER_ENTRY || defaultServerEntry;
  const fixtureUrl = pathToFileURL(join(repositoryRoot, "test", "fixtures", mockFetchFixture)).href;
  const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
  const nodeOptions = [existingNodeOptions, `--import=${fixtureUrl}`].filter(Boolean).join(" ");

  const child = spawn(process.execPath, [serverEntry], {
    cwd: dirname(dirname(serverEntry)),
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      PROMPT_PILOT_API_KEY: "test-api-key",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let toolResponseFound = false;

  const toolResponse = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (!toolResponseFound) {
        reject(new Error(
          `server exited before the tool response (code=${code}, signal=${signal})\n` +
          `stdout=${JSON.stringify(stdout)}\nstderr=${JSON.stringify(stderr)}`,
        ));
      }
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();

      for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
        try {
          const message = JSON.parse(line);
          if (message.id === 2) {
            toolResponseFound = true;
            resolve(message);
            return;
          }
        } catch {
          // The final assertion reports protocol contamination with the exact line.
        }
      }
    });
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.stdin.write(`${jsonRpcMessages(privatePrompt).map(JSON.stringify).join("\n")}\n`);

  let timeoutId;
  try {
    await Promise.race([
      toolResponse,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(
          `timed out waiting for the tool response\n` +
          `stdout=${JSON.stringify(stdout)}\nstderr=${JSON.stringify(stderr)}`,
        )), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
    child.stdin.end();

    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await once(child, "close");
    }
  }

  return {
    messages: parseStdoutMessages(stdout),
    stderr,
  };
}

test("stdio returns a successful tool result without protocol or prompt leakage", async () => {
  const { messages, stderr } = await runStdioServer("mock-fetch-success.mjs");
  const toolResponse = messages.find((message) => message.id === 2);

  assert.deepEqual(toolResponse?.result, {
    content: [
      {
        type: "text",
        text: "enhanced prompt",
      },
    ],
    isError: false,
  });
  assert.equal(stderr.includes(privatePrompt), false, "stderr must not expose the user's prompt");
});

test("stdio returns a valid MCP tool error when the upstream API fails", async () => {
  const { messages, stderr } = await runStdioServer("mock-fetch-error.mjs");
  const toolResponse = messages.find((message) => message.id === 2);

  assert.equal(toolResponse?.result?.isError, true);
  assert.match(toolResponse?.result?.content?.[0]?.text, /503 Service Unavailable/);
  assert.match(toolResponse?.result?.content?.[0]?.text, /backend boom/);
  assert.equal(stderr.includes(privatePrompt), false, "stderr must not expose the user's prompt");
});
