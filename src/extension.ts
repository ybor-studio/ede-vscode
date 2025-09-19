import * as vscode from "vscode";
import { Logger } from "./log";
import { EdeProvider } from "./provider";
import { error } from "console";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  try {
    const provider = new EdeProvider(context, logger);

    logger.log("info", "Registering Ports Attributes Provider...");
    context.subscriptions.push(
      vscode.workspace.registerPortAttributesProvider({}, provider)
    );

    // TODO: add support for Tunnel Provider

    logger.log("info", "Extension Activated");
  } catch (error) {
    logger.log("error", "Unable to activate extension", error);
  }
}

export function deactivate() {}
