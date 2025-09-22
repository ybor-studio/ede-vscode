import * as vscode from "vscode";
import { Logger } from "./log";
import Handlebars from "handlebars";

export class EdeProvider
  implements
    vscode.PortAttributesProvider,
    vscode.TunnelProvider,
    vscode.TunnelInformation,
    vscode.RemoteAuthorityResolver
{
  proxyUri: string;
  proxyPorts: number[];
  proxyTemplate: HandlebarsTemplateDelegate<{
    port: number;
  }>;

  constructor(
    private context: vscode.ExtensionContext,
    private logger: Logger
  ) {
    this.proxyUri = process.env.EDE_PROXY_URI || "http://localhost:{{port}}";
    this.proxyTemplate = Handlebars.compile<{ port: number }>(this.proxyUri);
    this.proxyPorts = process.env.EDE_PROXY_PORTS?.split(",").map((p) =>
      parseInt(p)
    ) || [3000];

    this.logger.log("info", "EDE Provider Constructed", {
      proxyUri: this.proxyUri,
      proxyPorts: this.proxyPorts,
    });
  }

  resolve(
    authority: string,
    context: vscode.RemoteAuthorityResolverContext
  ): vscode.ResolverResult | Thenable<vscode.ResolverResult> {
    this.logger.log(new Error("Resolving Authority"), undefined, {
      authority,
      context,
    });
    throw new Error("resolve not implemented.");
  }
  resolveExecServer?(
    remoteAuthority: string,
    context: vscode.RemoteAuthorityResolverContext
  ): vscode.ExecServer | Thenable<vscode.ExecServer> {
    this.logger.log(new Error("Resolving Exec Server"), undefined, {
      remoteAuthority,
      context,
    });
    throw new Error("resolveExecServer not implemented.");
  }

  getCanonicalURI(uri: vscode.Uri): vscode.ProviderResult<vscode.Uri> {
    this.logger.log(new Error("Getting Canonical URI"), undefined, { uri });
    throw new Error("getCanonicalURI not implemented.");
  }

  tunnelFactory(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions
  ): Thenable<vscode.Tunnel> {
    this.logger.log(new Error("Tunneling Factory Called"), undefined, {
      tunnelOptions,
      tunnelCreationOptions,
    });
    throw new Error("tunnelFactory not implemented.");
  }

  showCandidatePort(
    host: string,
    port: number,
    detail: string
  ): Thenable<boolean> {
    this.logger.log(new Error("Showing Candidate Port"), undefined, {
      host,
      port,
      detail,
    });
    return Promise.resolve(true);
  }

  get candidatePortSource(): vscode.CandidatePortSource | undefined {
    this.logger.log(new Error("Providing Candidate Port Source"));
    return vscode.CandidatePortSource.Hybrid;
  }

  get environmentTunnels(): vscode.TunnelDescription[] | undefined {
    this.logger.log(new Error("Providing Environment Tunnels"));
    // return this.proxyPorts.map((port) => {
    //   const description: vscode.TunnelDescription = {
    //     remoteAddress: { host: "localhost", port },
    //     localAddress: this.proxyTemplate({ port }),
    //     privacy: "private",
    //     protocol: "http",
    //   };
    //   return description;
    // });
    return [];
  }

  get tunnelFeatures(): vscode.RemoteAuthorityResolver["tunnelFeatures"] {
    this.logger.log(new Error("Providing Tunnel Features"));
    return {
      elevation: false,
      privacyOptions: [
        { id: "private", label: "Private", themeIcon: "lock" },
        { id: "public", label: "Public", themeIcon: "globe" },
      ],
      public: true,
    };
  }

  async providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): Promise<vscode.PortAttributes> {
    const { port } = attributes;
    this.logger.log(new Error("Providing Port Attributes"), undefined, {
      port,
    });

    if (!this.proxyPorts.includes(port)) {
      this.logger.log("info", "Ignoring port", {
        port,
        proxyPorts: this.proxyPorts,
      });

      return new vscode.PortAttributes(vscode.PortAutoForwardAction.Silent);
    }

    const protocol = "HTTP"; // TODO inspect protocol
    const name = `Port ${port}`; // TODO process name
    const proxyUri = this.proxyTemplate({ port });
    const buttons: vscode.MessageItem[] = [{ title: "Open Browser" }];

    const choice = await vscode.window.showInformationMessage(
      `${protocol} ${name} is now [publicly accesible](${proxyUri}).`,
      {},
      ...buttons
    );

    if (choice?.title === "Open Browser") {
      await vscode.env.openExternal(vscode.Uri.parse(proxyUri));
    }

    return new vscode.PortAttributes(vscode.PortAutoForwardAction.Notify);
  }

  provideTunnel(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Tunnel> {
    this.logger.log("info", "Providing Tunnel", {
      tunnelOptions,
      tunnelCreationOptions,
    });
    throw new Error("provideTunnel not implemented.");
  }
}
