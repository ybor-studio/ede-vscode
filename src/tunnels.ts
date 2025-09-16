import * as vscode from "vscode";
import { Logger } from "./log";

export class TunnelProvider implements vscode.TunnelProvider {
  static TunnelInformation: vscode.TunnelInformation = {
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
      remoteAddress,
      localAddress: `http://localhost:${port}`,
      public: true,
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
}
