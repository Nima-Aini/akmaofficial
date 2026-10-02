import { chmod, copyFile, realpath } from "node:fs/promises";
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
  await copyFile(source, destination);
  await chmod(destination, 0o755);
  console.log(`Installed production launcher: ${destination}`);
}
