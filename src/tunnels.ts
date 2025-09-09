import * as vscode from "vscode";
import { log } from "./log";
import Handlebars from "handlebars";
import { isOpen } from "./sockets";

// TODO: infer cmd from local port
// TODO: infer pid from local port

const {
  EDE_PROXY_PORTS = "3000,8080",
  EDE_PROXY_URI = "http://localhost:{{port}}",
} = process.env;

const LOCAL = Handlebars.compile<{ port: string | number }>(
  "localhost:{{port}}"
);
const REMOTE = Handlebars.compile<{ port: string | number }>(EDE_PROXY_URI);

export async function activateTunnels(context: vscode.ExtensionContext) {
  log("Activating Tunnels...", { EDE_PROXY_PORTS, EDE_PROXY_URI });

  const provider = new TunnelProvider(context);
  await provider.register();
  await provider.registerCommand(
    "ede-vscode.tunnel.open",
    (portInput?: string) => provider.tunnelOpen(portInput)
  );
  await provider.registerCommand("ede-vscode.tunnel.scan", () =>
    provider.tunnelScan()
  );

  log("Tunnels Activated!");
}

class TunnelProvider
  implements vscode.TunnelProvider, vscode.PortAttributesProvider
{
  constructor(private context: vscode.ExtensionContext) {}

  async register() {
    log("Registering Tunnel Provider...");
    this.context.subscriptions.push(
      await vscode.workspace
        .registerTunnelProvider(this, this.tunnelInformation)
        .then((disposable) =>
          vscode.commands
            .executeCommand("setContext", "forwardedPortsViewEnabled", true)
            .then(() => {
              log("Registering Ports Attributes Provider...");
              this.context.subscriptions.push(
                vscode.workspace.registerPortAttributesProvider(
                  this.portSelector,
                  this
                )
              );

              return disposable;
            })
        )
    );
  }

  async registerCommand(command: string, handler: () => Promise<void>) {
    log("Registering Command", command);
    this.context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  async tunnelOpen(portInput?: string): Promise<void> {
    log("Executing Tunnel Open Command...");

    if (!portInput) {
      portInput = await vscode.window.showQuickPick(
        this.tunnelInformation.environmentTunnels?.map((t) =>
          t.localAddress.toString()
        ) || [],
        {
          placeHolder: "Select a port to open a tunnel to",
        }
      );

      if (!portInput) {
        return;
      }
    }

    const tunnelDesc = this.tunnelInformation.environmentTunnels?.find(
      (t) => t.localAddress.toString() === portInput
    );
    if (!tunnelDesc) {
      vscode.window.showErrorMessage(
        `No tunnel description found for ${portInput}`
      );
      return;
    }

    if (!(await isOpen(tunnelDesc))) {
      vscode.window.showErrorMessage(`Nothing is listening on ${portInput}`);
      return;
    }

    const tunnel = await this.provideTunnel(tunnelDesc);
    await vscode.workspace.openTunnel(tunnel);
    vscode.window.showInformationMessage(`Opened tunnel to ${portInput}`);
  }

  async tunnelScan(): Promise<void> {
    log("Executing Tunnel Scan Command...");
    const tunnels = this.tunnelInformation.environmentTunnels || [];
    for (const tunnel of tunnels) {
      if (await isOpen(tunnel)) {
        log("Port is open", tunnel.localAddress);
        await vscode.commands.executeCommand(
          "ede-vscode.tunnel.open",
          tunnel.localAddress.toString()
        );
      } else {
        log("Port is closed", tunnel.localAddress);
      }
    }
  }

  provideTunnel(
    tunnel: vscode.TunnelOptions | vscode.TunnelDescription,
    // TODO: handle these
    options?: vscode.TunnelCreationOptions,
    token?: vscode.CancellationToken
  ): Thenable<vscode.Tunnel> {
    log("Providing Tunnel", JSON.stringify(tunnel));

    const spec: vscode.Tunnel = {
      localAddress:
        "localAddress" in tunnel
          ? tunnel.localAddress
          : LOCAL({
              port: tunnel.localAddressPort || tunnel.remoteAddress.port,
            }),
      remoteAddress: tunnel.remoteAddress,
      privacy: tunnel.privacy,
      protocol: tunnel.protocol,
      onDidDispose: new vscode.EventEmitter<void>().event,
      dispose: async () => {},
    };

    log("Created Tunnel", JSON.stringify(spec));

    return Promise.resolve(spec);
  }

  providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PortAttributes> {
    log("Providing Port Attributes...", JSON.stringify(attributes));
    const tunnel = this.tunnelInformation.environmentTunnels?.find(
      (t) => t.localAddress === LOCAL({ port: attributes.port })
    );

    if (!tunnel) {
      log("Tunnel not found for port", attributes.port);
      return new vscode.PortAttributes(vscode.PortAutoForwardAction.Ignore);
    }

    return vscode.commands
      .executeCommand(
        "ede-vscode.tunnel.open",
        LOCAL({ port: attributes.port })
      )
      .then(() => {
        return new vscode.PortAttributes(vscode.PortAutoForwardAction.Notify);
      });
  }

  get portSelector(): vscode.PortAttributesSelector {
    const selector: vscode.PortAttributesSelector = {
      portRange: [0, 65536],
    };

    log("Generated Port Selectors", JSON.stringify(selector));
    return selector;
  }

  get tunnelInformation(): vscode.TunnelInformation {
    const ports = EDE_PROXY_PORTS.split(",");

    const information: vscode.TunnelInformation = {
      environmentTunnels: ports.map((port) => {
        const remote = new URL(REMOTE({ port }));
        const description: vscode.TunnelDescription = {
          localAddress: LOCAL({ port }),
          remoteAddress: {
            host: remote.hostname,
            port: parseInt(remote.port) || 443,
          },
          privacy: "private",
          protocol: "http",
        };
        return description;
      }),
      tunnelFeatures: {
        elevation: false,
        privacyOptions: [
          {
            id: "private",
            label: "Private",
            themeIcon: "private-ports-view-icon",
          },
          {
            id: "public",
            label: "Public",
            themeIcon: "public-ports-view-icon",
          },
        ],
      },
    };

    log("Generated Tunnel Information", JSON.stringify(information));

    return information;
  }
}
