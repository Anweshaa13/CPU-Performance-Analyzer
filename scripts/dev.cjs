const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function start(command, args, cwd, name) {
  console.log(`Starting ${name}...`);

  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    windowsHide: false,
  });

  child.on("error", (error) => {
    console.error(`${name} failed to start:`, error);
  });

  return child;
}

console.log("🚀 Starting CPU Performance Analyzer...\n");

const backend = start(
  "python",
  ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
  path.join(root, "backend"),
  "Backend"
);

const frontend = start(
  "npm",
  ["run", "dev", "--", "--host", "localhost", "--port", "5173"],
  path.join(root, "frontend"),
  "Frontend"
);

console.log("\n==========================================");
console.log("CPU Performance Analyzer is starting...");
console.log("Frontend: http://localhost:5173");
console.log("Backend:  http://localhost:8000");
console.log("API:      http://localhost:8000/api");
console.log("==========================================\n");

function shutdown() {
  console.log("\nStopping CPU Performance Analyzer...");

  if (backend) backend.kill();
  if (frontend) frontend.kill();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);