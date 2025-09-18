import * as vscode from "vscode";
import { Logger } from "./log";

export class TunnelProvider
  implements vscode.TunnelProvider, vscode.RemoteAuthorityResolver
{
  static TunnelInformation: vscode.TunnelInformation = {
    environmentTunnels: [
      {
        localAddress: { host: "localhost", port: 3000 },
        remoteAddress: { host: "localhost", port: 3000 },
        privacy: "private",
        protocol: "http",
      },
    ],
    tunnelFeatures: {
      elevation: false,
      privacyOptions: [
        {
          id: "private",
          label: "Private",
          themeIcon: "lock",
        },
        {
          id: "public",
          label: "Public",
          themeIcon: "globe",
        },
      ],
    },
  };

  candidatePortSource = vscode.CandidatePortSource.Hybrid;
  showCandidatePort = () => Promise.resolve(true);

  constructor(
    private context: vscode.ExtensionContext,
    private logger: Logger
  ) {}

  async provideTunnel(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.Tunnel | undefined> {
    this.logger.log("info", "Providing Tunnel", {
      remoteAddress: tunnelOptions.remoteAddress,
      localAddressPort: tunnelOptions.localAddressPort,
      label: tunnelOptions.label,
    });

    const { remoteAddress } = tunnelOptions;
    const port = remoteAddress.port;

    this.logger.log("info", `Creating tunnel for port ${port}`);

    const disposableEvent = new vscode.EventEmitter<void>();

    const tunnel: vscode.Tunnel = {
      // remoteAddress,
      // localAddress: `https://${port}-whatever.p6m.run`,
      remoteAddress: { host: "localhost", port: 3000 },
      localAddress: { host: "localhost", port: 3000 },
      privacy: "private",
      onDidDispose: disposableEvent.event,
      dispose: () => {
        this.logger.log("info", `Disposing tunnel`, tunnel);
        disposableEvent.fire();
        disposableEvent.dispose();
      },
    };

    this.logger.log("info", `Tunnel created`, tunnel);
    return tunnel;
  }

  async resolve(authority: string): Promise<vscode.ResolverResult> {
    this.logger.log("info", "Resolving remote authority", { authority });

    const serverName = authority.replace(/^ede:\/\//, "");
    const host = "localhost";
    const port = 22;

    this.logger.log("info", "Resolved authority", {
      authority,
      serverName,
      host,
      port,
    });

    return {
      host,
      port,
      connectionToken: undefined,
    };
  }

  getCanonicalURI(uri: vscode.Uri): vscode.Uri {
    this.logger.log("info", "Getting canonical URI", { uri: uri.toString() });
    return uri;
  }

  tunnelFactory = async (
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions
  ): Promise<vscode.Tunnel> => {
    this.logger.log("info", "Creating tunnel via resolver factory");
    const token = new vscode.CancellationTokenSource().token;
    const tunnel = await this.provideTunnel(
      tunnelOptions,
      tunnelCreationOptions,
      token
    );
    if (!tunnel) {
      throw new Error("Failed to create tunnel");
    }
    return tunnel;
  };
}
