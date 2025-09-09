import * as vscode from "vscode";
import * as net from "net";

export const isOpen = (tunnel: vscode.TunnelDescription): Promise<boolean> => {
  const socket = new net.Socket();
  return new Promise((resolve) => {
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });

    if (typeof tunnel.localAddress === "string") {
      const [host, port] = tunnel.localAddress.split(":");
      socket.connect(Number(port), host);
    } else {
      socket.connect(tunnel.localAddress.port, tunnel.localAddress.host);
    }
  });
};
