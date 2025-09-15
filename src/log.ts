import { format } from "util";
import * as vscode from "vscode";

export const NAME = "Ybor Studio EDE";
const output = vscode.window.createOutputChannel(NAME);

export const log = (message: string, ...additionalParams: unknown[]) => {
  output.appendLine(format(message, additionalParams));
};
