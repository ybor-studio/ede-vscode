import * as vscode from "vscode";
import { log } from "./log";
import Handlebars from "handlebars";

const { EDE_PROXY_PORTS = "", EDE_PROXY_URI = "" } = process.env;

const LOCAL = Handlebars.compile<{ port: string | number }>(
  "localhost:{{port}}"
);
const REMOTE = Handlebars.compile<{ port: string | number }>(EDE_PROXY_URI);

export async function activateTunnels(context: vscode.ExtensionContext) {
  log("Activating Tunnels...", { EDE_PROXY_PORTS, EDE_PROXY_URI });

  const provider = new TunnelProvider(context);

  log("Registering Tunnel Provider...");
  context.subscriptions.push(
    await vscode.workspace
      .registerTunnelProvider(provider, provider.tunnelInformation)
      .then((disposable) =>
        vscode.commands
          .executeCommand("setContext", "forwardedPortsViewEnabled", true)
          .then(() => {
            log("Registering Ports Attributes Provider...");
            context.subscriptions.push(
              vscode.workspace.registerPortAttributesProvider(
                provider.portSelector,
                provider
              )
            );

            return disposable;
          })
      )
  );

  log("Registering Commands...");
  context.subscriptions.push(
    vscode.commands.registerCommand("ede-vscode.ports.scan", async () => {
      vscode.window.showInformationMessage("Scanning for open ports...");
      provider.tunnelInformation.environmentTunnels?.map((t) => {
        log(`Tunneling ${t.localAddress}`);
      });
    })
  );

  log("Tunnels Activated!");
}

class TunnelProvider
  implements vscode.TunnelProvider, vscode.PortAttributesProvider
{
  // private tunnels: vscode.Tunnel[] = [];
  constructor(private context: vscode.ExtensionContext) {}

  provideTunnel(
    tunnel: vscode.TunnelOptions,
    options: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): Thenable<vscode.Tunnel> {
    log("Providing Tunnel", JSON.stringify(tunnel));
    return vscode.workspace.openTunnel(tunnel).then((tunnel) => {
      this.context.subscriptions.push(
        token.onCancellationRequested(async () => {
          await tunnel.dispose();
        })
      );
      return tunnel;
    });
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
      return new vscode.PortAttributes(vscode.PortAutoForwardAction.Ignore);
    }

    return this.provideTunnel(
      {
        remoteAddress: tunnel.remoteAddress,
        localAddressPort: attributes.port,
        label:
          attributes.commandLine || attributes.pid
            ? `PID: ${attributes.pid}`
            : undefined,
        privacy: tunnel.privacy,
        protocol: tunnel.protocol,
      },
      { elevationRequired: false },
      token
    ).then(() => {
      return new vscode.PortAttributes(vscode.PortAutoForwardAction.Notify);
    });
  }

  get portSelector(): vscode.PortAttributesSelector {
    const selector: vscode.PortAttributesSelector = {
      portRange: [0, 65536],
      commandPattern: /.*/,
    };

    log("Generated Port Selectors", JSON.stringify(selector));
    return selector;
  }

  get tunnelInformation(): vscode.TunnelInformation {
    const ports = EDE_PROXY_PORTS.split(",");

    const information: vscode.TunnelInformation = {
      environmentTunnels: ports.map((port) => {
        const description: vscode.TunnelDescription = {
          localAddress: LOCAL({ port }),
          remoteAddress: { host: REMOTE({ port }), port: 443 },
          privacy: "public",
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
