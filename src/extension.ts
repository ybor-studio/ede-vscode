import * as vscode from "vscode";
import { Logger } from "./log";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  logger.log("info", "Registering ede-vscode.logs.show command...");
  context.subscriptions.push(
    vscode.commands.registerCommand("ede-vscode.logs.show", () => logger.show())
  );
  logger.log("info", "Registering ede-vscode.logs.clear command...");
  context.subscriptions.push(
    vscode.commands.registerCommand("ede-vscode.logs.clear", () =>
      logger.clear()
    )
  );

  logger.log("info", "Extension Activated");
}

export function deactivate() {}
