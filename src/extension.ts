import * as vscode from "vscode";
import { log, NAME } from "./log";
import { activatePorts } from "./ports";

export async function activate(context: vscode.ExtensionContext) {
  log(`Activating ${NAME} extension...`);
  await activatePorts(context);

  // DEVNOTE: Update package.json for command registrations
  let disposable = vscode.commands.registerCommand(
    "ede-vscode.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from EDE VSCode!");
    }
  );

  context.subscriptions.push(disposable);
  log(`Activated ${NAME} extension!`);
}

export function deactivate() {
  // console.log("Deactivating EDE VSCode extension...");
  // Clean up resources if necessary
}
