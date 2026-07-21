import { spawn } from "node:child_process";

const server = "/Users/Daiki/Applications/Pen.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-arm64";
const child = spawn(server, ["--app", "desktop", "--agent", "codexCLI"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
const pending = new Map();

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  while (buffer.includes("\n")) {
    const index = buffer.indexOf("\n");
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  }
});

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => process.stderr.write(chunk));

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function request(id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 60000);
    pending.set(id, (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
    send({ jsonrpc: "2.0", id, method, params });
  });
}

try {
  const initialized = await request(1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "codex-local", version: "1.0.0" },
  });
  if (initialized.error) throw new Error(JSON.stringify(initialized.error));
  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  await new Promise((resolve) => setTimeout(resolve, 500));

  const toolIndex = process.argv.indexOf("--tool");
  if (toolIndex === -1) {
    const tools = await request(2, "tools/list");
    if (tools.error) throw new Error(JSON.stringify(tools.error));
    process.stdout.write(`${JSON.stringify(tools.result, null, 2)}\n`);
  } else {
    const name = process.argv[toolIndex + 1];
    const argsIndex = process.argv.indexOf("--args");
    const argsFileIndex = process.argv.indexOf("--args-file");
    let args = {};
    if (argsFileIndex !== -1) {
      const { readFile } = await import("node:fs/promises");
      args = JSON.parse(await readFile(process.argv[argsFileIndex + 1], "utf8"));
    } else if (argsIndex !== -1) {
      args = JSON.parse(process.argv[argsIndex + 1]);
    }
    const result = await request(2, "tools/call", { name, arguments: args });
    if (result.error) throw new Error(JSON.stringify(result.error));
    process.stdout.write(`${JSON.stringify(result.result, null, 2)}\n`);
  }
} finally {
  child.kill();
}
