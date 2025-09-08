import * as vscode from "vscode";
import { log } from "./log";
import Handlebars from "handlebars";

const { EDE_PROXY_PORTS = "", EDE_PROXY_URI = "" } = process.env;

type Port = {
  hostname: string;
};

type Ports = Record<number, Port>;

export async function activatePorts(context: vscode.ExtensionContext) {
  log("Activating Ports View...", { EDE_PROXY_PORTS, EDE_PROXY_URI });

  log("Registering Ports Attributes Provider...");
  const provider = new PortAttributesProvider(context);
  context.subscriptions.push(
    vscode.workspace.registerPortAttributesProvider(
      { portRange: [0, 65536] },
      provider
    )
  );

  // Make a port appear in the Ports view:
  // const tunnel = await vscode.workspace.openTunnel({
  //   // the port on the REMOTE side that you want to forward
  //   remoteAddress: { host: "127.0.0.1", port: 3000 },
  //   // optional hint for which LOCAL port to use (VS Code may pick another free port)
  //   localAddressPort: 3000,
  //   label: "hello world",
  // });

  // Keep it alive until your extension is disposed
  // context.subscriptions.push(tunnel);

  // await vscode.commands.executeCommand(
  //   "setContext",
  //   "forwardedPortsViewEnabled",
  //   true
  // );

  // const detected: vscode.TunnelDescription[] = [
  //   {
  //     remoteAddress: { host: vscode.env.remoteAuthority!, port: 443 },
  //     localAddress: { host: "localhost", port: 3000 },
  //     privacy: "private",
  //     protocol: "http",
  //   },
  //   {
  //     remoteAddress: { host: vscode.env.remoteAuthority!, port: 443 },
  //     localAddress: { host: "localhost", port: 3000 },
  //     privacy: "public",
  //     protocol: "http",
  //   },
  // ];
  // log("!!! detected", detected);

  // const info: vscode.TunnelInformation = {
  //   environmentTunnels: detected,
  //   tunnelFeatures: {
  //     elevation: true,
  //     privacyOptions: [
  //       { id: "private", label: "Private", themeIcon: "globe" },
  //       { id: "public", label: "Public", themeIcon: "globe" },
  //     ],
  //     protocol: true,
  //   },
  // };
  // log("!!! info", info);

  // const reg = await vscode.workspace.registerTunnelProvider(
  //   {
  //     provideTunnel(options, creation, token) {
  //       // Create the required onDidDispose event
  //       const disposed = new vscode.EventEmitter<void>();

  //       // Start your real tunnel here (ssh/cloudflared/ngrok/etc)
  //       const localPort =
  //         options.localAddressPort ?? options.remoteAddress.port;

  //       const tunnel: vscode.Tunnel = {
  //         remoteAddress: options.remoteAddress,
  //         localAddress: { host: "127.0.0.1", port: localPort },
  //         privacy: "private",
  //         protocol: options.protocol, // honored only if tunnelFeatures.protocol = true
  //         onDidDispose: disposed.event,
  //         dispose: () => {
  //           // stop real tunnel
  //           disposed.fire();
  //           disposed.dispose();
  //         },
  //       };

  //       return tunnel;
  //     },
  //   },
  //   info
  // );
  // log("!!! reg", reg);

  // context.subscriptions.push(reg);

  // log(
  //   "remoteName:",
  //   vscode.env.remoteName,
  //   "remoteAuthority:",
  //   vscode.env.remoteAuthority
  // );

  // log("!!! opening tunnel");
  // try {
  //   vscode.workspace
  //     .openTunnel({
  //       remoteAddress: { host: vscode.env.remoteAuthority!, port: 443 },
  //       localAddressPort: 3000,
  //     })
  //     .then((tunnel) => {
  //       log("!!! tunnel", tunnel);
  //     });
  // } catch (e) {
  //   log("!!! error open tunnel", e);
  // }
  // log("!!! opened tunnel");

  // console.log("!!! tunnel", tunnel);

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeTunnels(async () => {
  //     const tunnels = await vscode.workspace.tunnels;
  //     log("!!! tunnels changed", { tunnels });
  //   })
  // );

  // context.subscriptions.push(
  //   await vscode.workspace.registerTunnelProvider(new TunnelProvider(), {
  //     environmentTunnels: [new Tunnel()],
  //     tunnelFeatures: {
  //       elevation: false,
  //       privacyOptions: [
  //         {
  //           id: "private",
  //           label: "Private",
  //           themeIcon: "globe",
  //         },
  //       ],
  //     },
  //   })
}

class PortAttributesProvider implements vscode.PortAttributesProvider {
  ports: Ports;
  tunnelProvider: TunnelProvider;

  constructor(private context: vscode.ExtensionContext) {
    this.tunnelProvider = new TunnelProvider();

    const template = Handlebars.compile(EDE_PROXY_URI);

    this.ports = EDE_PROXY_PORTS.split(",")
      .map((p) => parseInt(p, 10))
      .reduce((acc, port) => {
        // TODO: support for port ranges, e.g. 80,443,3000-4000,8456
        acc[port] = { hostname: template({ port }) };
        return acc;
      }, {} as Ports);
  }

  providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PortAttributes> {
    log("!!! providePortAttributes", attributes);
    return new vscode.PortAttributes(vscode.PortAutoForwardAction.Notify);
  }
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

class TunnelInformation implements vscode.TunnelInformation {}
