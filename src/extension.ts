import * as vscode from "vscode";
import { Logger } from "./log";
import { EdeProvider } from "./provider";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  try {
    const provider = new EdeProvider(context, logger);
    await provider.activate();

    logger.log("info", "Extension Activated");
  } catch (error) {
    logger.log("error", "Unable to activate extension", error);
  }
}

export function deactivate() {}
