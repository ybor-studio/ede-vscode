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
          logger.log("info", "Opening tunnel to VSC URL...");
          const tunnel = await vscode.workspace.openTunnel({
            localAddressPort: 3000,
            remoteAddress: {
              host: "localhost",
              port: 3000,
            },
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

  logger.log("info", "Activating Ports View...");
  await vscode.commands
    .executeCommand("setContext", "forwardedPortsViewEnabled", true)
    .then(() =>
      vscode.workspace.registerTunnelProvider(
        tunnelProvider,
        TunnelProvider.TunnelInformation
      )
    )
    .then((disposable) => {
      logger.log("info", "Tunnel Provider Registered!");
      context.subscriptions.push(disposable);
    });

  logger.log("info", "Extension Activated");
}

export function deactivate() {}
