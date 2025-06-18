import cp from "child_process";

export function run_script(
  command: string,
  args: string[],
  dir: string,
  env?: Record<string, string>
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    var child = cp.spawn(command, args, {
      cwd: dir,
      env: { ...process.env, ...env },
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    var scriptOutput = "";
    var scriptError = "";

    child.stdout.on("data", function (data) {
      data = data.toString();
      scriptOutput += data;
    });

    child.stderr.on("data", function (data) {
      data = data.toString();
      scriptError += data;
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", function (code) {
      if (scriptOutput === "" && scriptError !== "") {
        resolve(scriptError);
        return;
      }
      if (scriptError !== "") {
        console.warn(
          scriptError
            .split("\n")
            .map((x) => `Julia Error Output (${code}): ${x}`)
            .join("\n")
        );
      }

      resolve(scriptOutput);
    });

    child.stdin.end();
  });
}
