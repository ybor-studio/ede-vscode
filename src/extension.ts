import * as vscode from "vscode";
import { log, NAME } from "./log";
import { activateTunnels } from "./tunnels";
import { writeFileSync, writeSync } from "fs";

export async function activate(context: vscode.ExtensionContext) {
  log(`Activating ${NAME} extension...`);

  const tunneler = new Tunneler();

  log("registering authority");
  context.subscriptions.push(
    vscode.workspace.registerRemoteAuthorityResolver("ede", tunneler)
  );
  log("done registering authority");

  log("registering remote authority");
  context.subscriptions.push(
    vscode.workspace.registerRemoteAuthorityResolver(
      vscode.env.remoteAuthority!,
      tunneler
    )
  );
  log("done registering remote authority");

  log("register tunnel provider");
  context.subscriptions.push(
    await vscode.workspace.registerTunnelProvider(
      tunneler,
      tunneler.tunnelInformation
    )
  );
  log("done registering tunnel provier");

  log("register attributes provider");
  context.subscriptions.push(
    vscode.workspace.registerPortAttributesProvider(tunneler, tunneler)
  );
  log("done registering attributes provider");

  log("getting exec server");
  const server = await vscode.workspace.getRemoteExecServer("ede+tunnels");
  log("exec server", server);

  log("open tunnel");
  const tunnel = await vscode.workspace.openTunnel({
    localAddressPort: 3000,
    remoteAddress: { host: vscode.env.remoteAuthority!, port: 3000 },
  });
  log("tunnel opened", tunnel);

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

  constructor() {
    this.fs = new FileSystem();
    this.portRange = 3000;
  }

  get tunnelInformation(): vscode.TunnelInformation {
    return {};
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
    return this;
  }

  getCanonicalURI?(uri: vscode.Uri): vscode.ProviderResult<vscode.Uri> {
    throw new Error("Method not implemented.");
  }

  tunnelFactory(
    tunnelOptions: vscode.TunnelOptions,
    tunnelCreationOptions: vscode.TunnelCreationOptions
  ): Thenable<vscode.Tunnel> {
    throw new Error("Not implemented");
  }

  showCandidatePort(
    host: string,
    port: number,
    detail: string
  ): Thenable<boolean> {
    return Promise.resolve(true);
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
  // console.log("Deactivating EDE VSCode extension...");
  // Clean up resources if necessary
}
