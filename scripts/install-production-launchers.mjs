import { execFileSync } from "node:child_process";
import { chmod, copyFile, realpath, rename } from "node:fs/promises";
import process from "node:process";

const releaseRoot = "/srv/akma/releases/";
const currentDirectory = await realpath(process.cwd());

// CI and developer builds must never mutate their host. The production deploy
// builds as root in a timestamped release directory, which is the only context
// where the restricted SSH deployment launchers are installed.
if (!currentDirectory.startsWith(releaseRoot) || process.getuid?.() !== 0) {
  console.log("Production launcher install skipped outside /srv/akma/releases.");
  process.exit(0);
}

const launchers = [
  ["ops/akma-server", "/usr/local/sbin/akma-server"],
  ["ops/akma-deploy", "/usr/local/sbin/akma-deploy"],
];

for (const [source, destination] of launchers) {
  // Never truncate the deployment script while Bash is executing it. An
  // atomic rename leaves the running process on the old inode and publishes
  // the complete replacement for the next invocation.
  const temporary = `${destination}.${process.pid}.tmp`;
  await copyFile(source, temporary);
  await chmod(temporary, 0o755);
  await rename(temporary, destination);
  console.log(`Installed production launcher: ${destination}`);
}

const processName = "akmaofficial";
const processes = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" }));
const application = processes.find((item) => item.name === processName);

if (!application?.pid) {
  console.log("Recovering the unhealthy akmaofficial PM2 entry.");
  if (application) {
    execFileSync("pm2", ["logs", processName, "--lines", "100", "--nostream"], {
      stdio: "inherit",
    });
    execFileSync("pm2", ["delete", processName], { stdio: "inherit" });
  }
  execFileSync(
    "pm2",
    ["start", "/usr/local/sbin/akma-server", "--name", processName, "--interpreter", "bash"],
    { stdio: "inherit" },
  );

  await new Promise((resolve) => setTimeout(resolve, 2_000));
  try {
    const response = await fetch("http://127.0.0.1:3010/api/health");
    const body = await response.text();
    if (!response.ok || !body.includes('"database":"connected"')) {
      throw new Error(`health status ${response.status}`);
    }
    console.log(`Recovered production health: ${body}`);
  } catch (error) {
    execFileSync("pm2", ["logs", processName, "--lines", "100", "--nostream"], {
      stdio: "inherit",
    });
    throw new Error("Unable to recover akmaofficial before deployment", { cause: error });
  }
}
