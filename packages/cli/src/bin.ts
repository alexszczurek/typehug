import { run } from "./cli.js";

run(process.argv.slice(2)).then((status) => {
  process.exitCode = status;
}).catch((error: unknown) => {
  process.stderr.write(`typehug: ${(error as Error).message}\n`);
  process.exitCode = 2;
});
