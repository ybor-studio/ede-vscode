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

  logger.log("info", "Registering ede-vscode.test.createTunnel command...");
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ede-vscode.test.createTunnel",
      async () => {
        try {
          // Use VS Code's built-in port forwarding API
          const tunnel = await vscode.workspace.openTunnel({
            remoteAddress: { host: "localhost", port: 3000 },
            label: "Test Port 3000",
          });
          logger.log("info", "Port forwarded via VS Code API", tunnel);

          // Also show a notification
          vscode.window.showInformationMessage(
            `Port 3000 forwarded to ${tunnel?.localAddress}`
          );
        } catch (error) {
          logger.log("error", "Failed to forward port", error);
          vscode.window.showErrorMessage(`Failed to forward port: ${error}`);
        }
      }
    )
  );

  const tunnelProvider = new TunnelProvider(context, logger);

  logger.log("info", "Registering Tunnel Provider...");
  context.subscriptions.push(
    await vscode.workspace.registerTunnelProvider(
      tunnelProvider,
      TunnelProvider.TunnelInformation
    )
  );

  logger.log("info", "Extension Activated");
}

export function deactivate() {}
