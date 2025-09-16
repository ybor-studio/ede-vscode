import * as vscode from "vscode";
import { Logger } from "./log";
import { TunnelProvider } from "./tunnels";

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

  logger.log("info", "Registering Tunnel Provider...");
  context.subscriptions.push(
    await vscode.workspace.registerTunnelProvider(
      new TunnelProvider(context, logger),
      TunnelProvider.TunnelInformation
    )
  );

  logger.log("info", "Extension Activated");
}

export function deactivate() {}
