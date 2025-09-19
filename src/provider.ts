import * as vscode from "vscode";
import { Logger } from "./log";
import Handlebars from "handlebars";

export class EdeProvider
  implements vscode.PortAttributesProvider, vscode.PortAttributesSelector
{
  proxyUri: string;
  proxyPorts: number[];
  proxyTemplate: HandlebarsTemplateDelegate<{
    port: number;
  }>;
  portRange: [number, number] = [0, 65536];
  commandPattern?: RegExp;

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

  providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PortAttributes> {
    const { port } = attributes;
    this.logger.log("info", "Providing Port Attributes", { port });

    if (!this.proxyPorts.includes(port)) {
      this.logger.log("info", "Ignoring port", {
        port,
        proxyPorts: this.proxyPorts,
      });
      return;
    }

    const protocol = "HTTP"; // TODO inspect protocol
    const name = `Port ${port}`; // TODO process name
    const proxyUri = this.proxyTemplate({ port });
    const buttons = ["Open Browser", "Dismiss"];

    return vscode.window
      .showInformationMessage(
        `${protocol} ${name} is accesible at ${proxyUri}`,
        ...buttons
      )
      .then((choice) => {
        if (choice === "Open Browser") {
          return vscode.env.openExternal(vscode.Uri.parse(proxyUri));
        }
      })
      .then(
        () => new vscode.PortAttributes(vscode.PortAutoForwardAction.Silent)
      );
  }
}
