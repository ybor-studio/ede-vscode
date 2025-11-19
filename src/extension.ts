import * as vscode from "vscode";
import { Logger } from "./log";
import { EdeProvider } from "./provider";
import { showAIStudio } from "./views/ai-studio";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  try {
    const provider = new EdeProvider(context, logger);
    await provider.activate();

    // Register AI Studio command
    const aiStudioCommand = vscode.commands.registerCommand(
      "ede-vscode.openAIStudio",
      () => {
        showAIStudio(context);
      }
    );
    context.subscriptions.push(aiStudioCommand);

    logger.log("info", "Extension Activated");
  } catch (error) {
    logger.log("error", "Unable to activate extension", error);
  }
}

export function deactivate() {}
