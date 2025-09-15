import * as vscode from "vscode";
import { log, NAME } from "./log";

export async function activate(context: vscode.ExtensionContext) {
  log(`Activating ${NAME} extension...`);

  const tunneler = new Tunneler(context);

  log("Registering Remote Authority Resolver...");
  context.subscriptions.push(
    vscode.workspace.registerRemoteAuthorityResolver("ede", tunneler)
  );

  log("Registering Tunnel Provider...");
  context.subscriptions.push(
    await vscode.workspace.registerTunnelProvider(
      tunneler,
      tunneler.tunnelInformation
    )
  );

  log("Registering Port Attributes Provider...");
  context.subscriptions.push(
    vscode.workspace.registerPortAttributesProvider(tunneler, tunneler)
  );

  log("Registering Tunnel Scan Command...");
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ede-vscode.tunnel.scan",
      tunneler.scan,
      tunneler
    )
  );

  log("Registering Tunnel Open Command...");
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ede-vscode.tunnel.open",
      tunneler.open,
      tunneler
    )
  );

  log(`Activated ${NAME} extension!`);
}

class Tunneler
  implements
    vscode.TunnelProvider,
    vscode.PortAttributesSelector,
    vscode.PortAttributesProvider,
    vscode.RemoteAuthorityResolver,
    vscode.ResourceLabelFormatter,
    vscode.ExecServer
{
  fs: vscode.RemoteFileSystem;
  scheme = "vscode-remote";
  authority = "ede+*";
  formatting = {
    label: "${path}",
    separator: "/" as const,
    tildify: true,
    normalizeDriveLetter: false,
    workspaceSuffix: "EDE Stuff",
  };
  candidatePortSource = vscode.CandidatePortSource.Hybrid;
  portRange?: number | [number, number];
  commandPattern?: RegExp;

  constructor(private context: vscode.ExtensionContext) {
    this.fs = new FileSystem();
    this.portRange = [0, 65536];
  }

  get tunnelInformation(): vscode.TunnelInformation {
    return {};
  }

  async scan(...args: []): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async open(...args: []): Promise<void> {
    throw new Error("Method not implemented.");
  }

  resolve(
    authority: string,
    context: vscode.RemoteAuthorityResolverContext
  ): vscode.ResolverResult | Thenable<vscode.ResolverResult> {
    throw new Error("Method not implemented.");
  }

  providePortAttributes(
    attributes: { port: number; pid?: number; commandLine?: string },
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PortAttributes> {
    throw new Error("Method not implemented.");
  }

  resolveExecServer?(
    remoteAuthority: string,
    context: vscode.RemoteAuthorityResolverContext
  ): vscode.ExecServer | Thenable<vscode.ExecServer> {
    throw new Error("Method not implemented.");
  }

  getCanonicalURI?(uri: vscode.Uri): vscode.ProviderResult<vscode.Uri> {
    throw new Error("Method not implemented.");
  }

  tunnelFactory(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions
  ): Thenable<vscode.Tunnel> {
    throw new Error("Method not implemented.");
  }

  showCandidatePort(
    host: string,
    port: number,
    detail: string
  ): Thenable<boolean> {
    throw new Error("Method not implemented.");
  }

  provideTunnel(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions,
    token: vscode.CancellationToken
  ): Thenable<vscode.Tunnel> {
    throw new Error("Method not implemented.");
  }

  spawn(
    command: string,
    args: string[],
    options?: vscode.ExecServerSpawnOptions
  ): Thenable<vscode.SpawnedCommand> {
    throw new Error("Method not implemented.");
  }

  spawnRemoteServerConnector?(
    command: string,
    args: string[],
    options?: vscode.ExecServerSpawnOptions
  ): Thenable<vscode.RemoteServerConnector> {
    throw new Error("Method not implemented.");
  }

  downloadCliExecutable?(
    buildTarget: vscode.CliBuild,
    command: string,
    args: string[],
    options?: vscode.ExecServerSpawnOptions
  ): Thenable<vscode.ProcessExit> {
    throw new Error("Method not implemented.");
  }

  env(): Thenable<vscode.ExecEnvironment> {
    throw new Error("Method not implemented.");
  }

  kill(processId: number): Thenable<void> {
    throw new Error("Method not implemented.");
  }

  tcpConnect(
    host: string,
    port: number
  ): Thenable<{
    stream: vscode.WriteStream & vscode.ReadStream;
    done: Thenable<void>;
  }> {
    throw new Error("Method not implemented.");
  }
}

class FileSystem implements vscode.RemoteFileSystem {
  stat(path: string): Thenable<vscode.FileStat> {
    throw new Error("Method not implemented.");
  }
  mkdirp(path: string): Thenable<void> {
    throw new Error("Method not implemented.");
  }
  rm(path: string): Thenable<void> {
    throw new Error("Method not implemented.");
  }
  read(path: string): Thenable<vscode.ReadStream> {
    throw new Error("Method not implemented.");
  }
  write(
    path: string
  ): Thenable<{ stream: vscode.WriteStream; done: Thenable<void> }> {
    throw new Error("Method not implemented.");
  }
  connect(path: string): Thenable<{
    stream: vscode.WriteStream & vscode.ReadStream;
    done: Thenable<void>;
  }> {
    throw new Error("Method not implemented.");
  }
  rename(fromPath: string, toPath: string): Thenable<void> {
    throw new Error("Method not implemented.");
  }
  readdir(path: string): Thenable<vscode.DirectoryEntry[]> {
    throw new Error("Method not implemented.");
  }
}

export function deactivate() {
  log(`Dectivated ${NAME} extension.`);
}
