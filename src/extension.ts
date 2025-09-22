import * as vscode from "vscode";
import { Logger } from "./log";
import { EdeProvider } from "./provider";

export async function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  logger.log("info", "Activating Extension");

  try {
    const provider = new EdeProvider(context, logger);

    logger.log("info", "Registering Remote Authority Resolver...");
    context.subscriptions.push(
      vscode.workspace.registerRemoteAuthorityResolver("localhost", provider)
    );

    logger.log("info", "Registering Tunnel Provider");
    context.subscriptions.push(
      await vscode.workspace.registerTunnelProvider(provider, provider)
    );

    logger.log("info", "Registering Ports Attributes Provider...");
    context.subscriptions.push(
      vscode.workspace.registerPortAttributesProvider({}, provider)
    );

    logger.log("info", "Extension Activated");
  } catch (error) {
    logger.log("error", "Unable to activate extension", error);
  }
}

export function deactivate() {}
