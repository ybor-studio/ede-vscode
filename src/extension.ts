import * as vscode from "vscode";
import { Logger } from "./log";
import { EdeProvider } from "./provider";
import { LangflowWebview } from "./views/langflow";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  try {
    const langflow = new LangflowWebview(context, logger);

    const provider = new EdeProvider(context, logger);
    await provider.activate();

    context.subscriptions.push(
      vscode.commands.registerCommand("ede-vscode.open.langflow", () => {
        langflow.activate();
      })
    );

    logger.log("info", "Extension Activated");
  } catch (error) {
    logger.log("error", "Unable to activate extension", error);
  }
}

export function deactivate() {}
