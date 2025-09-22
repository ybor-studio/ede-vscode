import * as vscode from "vscode";

export const NAME = "Ybor Studio EDE";

export class Logger {
  private outputChannel?: vscode.LogOutputChannel;

  constructor() {}

  public show(): void {
    return this.outputChannel?.show();
  }

  public clear() {
    this.outputChannel?.clear();
  }

  public log(
    logLevel: "trace" | "debug" | "info" | "warn" | "error" | Error,
    message?: string,
    ...args: unknown[]
  ) {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel(NAME, {
        log: true,
      });
      vscode.commands.executeCommand("setContext", "edeHasLog", true);
    }

    if (logLevel instanceof Error) {
      const source = logLevel.stack?.split("\n")[2].trim();
      if (source) {
        message = `${logLevel.message || message} (via ${source})`;
      }
      logLevel = "warn";
    }

    this.outputChannel[logLevel](message || "", ...args);

    if (logLevel === "error") {
      vscode.window.showErrorMessage(message || "").then(() => {});
    }
  }
}
