import * as vscode from "vscode";
import { log } from "./log";
import { resolve } from "path";
import { rejects } from "assert";

export async function activatePorts(context: vscode.ExtensionContext) {
  log("Activating Ports View...");
  await vscode.commands.executeCommand(
    "setContext",
    "forwardedPortsViewEnabled",
    true
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTunnels(async () => {
      const tunnels = await vscode.workspace.tunnels;
      console.log("!!! tunnels changed", { tunnels });
    })
  );

  context.subscriptions.push(
    await vscode.workspace.registerTunnelProvider(new TunnelProvider(), {
      environmentTunnels: [new Tunnel()],
      tunnelFeatures: {
        elevation: false,
        privacyOptions: [
          {
            id: "private",
            label: "Private",
            themeIcon: "globe",
          },
        ],
      },
    })
  );
}

class TunnelProvider implements vscode.TunnelProvider {
  constructor() {
    log("!!! TunnelProvider constructor");
  }

  provideTunnel(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Tunnel> {
    log("!!! TunnelProvider.provideTunnel", {
      tunnelOptions,
      tunnelCreationOptions,
      token,
    });
    return this.build(tunnelOptions, tunnelCreationOptions, token);
  }

  private async build(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): Promise<Tunnel> {
    return new Tunnel();
  }
}

class Tunnel implements vscode.Tunnel {
  remoteAddress: { port: number; host: string };
  localAddress: string | { port: number; host: string };
  public?: boolean | undefined;
  privacy?: string | undefined;
  protocol?: string | undefined;
  onDidDispose: vscode.Event<void>;

  constructor() {
    log("!!! Tunnel Constructor");
    this.remoteAddress = { host: "todo", port: 443 };
    this.localAddress = { host: "localhost", port: 3000 };
    this.onDidDispose = () => new vscode.Disposable(() => this.dispose());
  }

  dispose(): void {
    log("!!! Tunnel Dispose");
  }
}
