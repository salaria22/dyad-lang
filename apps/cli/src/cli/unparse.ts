import process from "process";
import { unparseDyad } from "@juliacomputing/dyad-parser";

export async function unparse(): Promise<void> {
  return new Promise((resolve, reject) => {
    let input: string = "";
    process.stdin.on("data", (data) => {
      input = input + data.toString();
    });
    process.stdin.on("error", (err) => {
      reject(err);
    });
    process.stdin.on("close", () => {
      const obj = JSON.parse(input);
      resolve(undefined);
      console.log(unparseDyad(obj));
    });
  });
}
