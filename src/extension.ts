import * as vscode from "vscode";
import { log, NAME } from "./log";
import { activateTunnels } from "./tunnels";

export async function activate(context: vscode.ExtensionContext) {
  log(`Activating ${NAME} extension...`);

  await activateTunnels(context);

  log(`Activated ${NAME} extension!`);
}

export function deactivate() {
  // console.log("Deactivating EDE VSCode extension...");
  // Clean up resources if necessary
}
