import * as vscode from "vscode";
import { Logger } from "./log";
import Handlebars from "handlebars";
import { netstat, PortAttributes } from "./netstat";
import { Subscription } from "rxjs";

export class EdeProvider implements vscode.PortAttributesProvider {
  private ports: vscode.EventEmitter<PortAttributes> =
    new vscode.EventEmitter<PortAttributes>();

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
    ) || [3000, 8080];

    context.subscriptions.push(
      this.ports.event((attributes) => {
        this.logger.log("info", "EDE Provider Port Event", { attributes });
        return this.providePortAttributes(
          attributes,
          new vscode.CancellationTokenSource().token
        );
      })
    );
    context.subscriptions.push(this.ports);

    this.logger.log("info", "EDE Provider Constructed", {
      proxyUri: this.proxyUri,
      proxyPorts: this.proxyPorts,
    });
  }

  async activate(): Promise<void> {
    this.logger.log("info", "Registering Commands...");
    await this.registerCommands();

    this.logger.log("info", "Starting Ports Scanner...");
    await vscode.commands.executeCommand("ede-vscode.port-scan.start");

    this.context.subscriptions.push({
      dispose: async () => {
        this.logger.log("info", "Provider Disposed");
        await vscode.commands.executeCommand("ede-vscode.port-scan.stop");
      },
    });

    this.logger.log("info", "Provider Activated");
  }

  async registerCommands(): Promise<void> {
    let portScan: Subscription | undefined = undefined;

    const commands = [
      vscode.commands.registerCommand(
        "ede-vscode.port-scan.start",
        async () => {
          this.logger.log("info", "Scanning for open ports...");

          await vscode.commands.executeCommand("ede-vscode.port-scan.stop");

          portScan = netstat(this.proxyPorts, 2000).subscribe((data) => {
            this.logger.log("info", "Port Observed", { data });
            this.ports.fire(data);
          });
        }
      ),
      vscode.commands.registerCommand("ede-vscode.port-scan.stop", async () => {
        if (portScan) {
          this.logger.log("info", "Stopping port scan...");
          portScan.unsubscribe();
          portScan = undefined;
        }
      }),
    ];

    this.context.subscriptions.push(...commands);
  }

  async providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): Promise<vscode.PortAttributes> {
    const { port } = attributes;
    this.logger.log("info", "Providing Port Attributes", {
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

    return new vscode.PortAttributes(vscode.PortAutoForwardAction.Silent);
  }
}
