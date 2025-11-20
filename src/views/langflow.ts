import * as vscode from "vscode";
import * as fs from "fs";
import { Logger } from "../log";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export class LangflowWebview {
  showIn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
  currentPanel?: vscode.WebviewPanel;
  path: vscode.Uri;
  constructor(
    private context: vscode.ExtensionContext,
    private logger: Logger
  ) {
    this.logger.log("info", "Initializing Langflow Webview");
    this.path = vscode.Uri.joinPath(context.extensionUri, "out", "langflow");
  }

  activate() {
    this.logger.log("info", "Activating Langflow Webview");

    if (this.currentPanel) {
      this.logger.log("info", "Revealing existing Langflow Webview panel");
      this.currentPanel.reveal();
      return;
    }

    this.currentPanel = vscode.window.createWebviewPanel(
      "langflow",
      "Langflow",
      this.showIn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.path],
      }
    );
    this.currentPanel.onDidDispose(
      () => {
        this.logger.log("info", "Langflow Webview panel disposed");
        this.currentPanel = undefined;
      },
      null,
      this.context.subscriptions
    );

    this.render(this.currentPanel.webview);
  }

  private router() {
    this.logger.log("info", "Routing message from Langflow Webview");
    return async (msg: any) => {
      if (msg.type === "api") {
        try {
          const url = `http://localhost:2002${msg.path}`;
          const res = await fetch(url, {
            method: msg.method,
            body: msg.body ? JSON.stringify(msg.body) : null,
            headers: { "Content-Type": "application/json" },
          });
          currentPanel?.webview.postMessage({
            requestId: msg.requestId,
            result: await res.json(),
          });
        } catch (error) {
          currentPanel?.webview.postMessage({
            requestId: msg.requestId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
  }

  private render(webview: vscode.Webview): void {
    const indexHtml = vscode.Uri.joinPath(this.path, "index.html");
    let html = fs.readFileSync(indexHtml.fsPath, "utf8");
    const baseUri = webview.asWebviewUri(this.path);

    // Rewrite asset paths to use vscode-webview:// URIs
    // Replace absolute paths starting with /
    html = html.replace(
      /(src|href)="\/([^"]+)"/g,
      (match, attr, path) => `${attr}="${baseUri}/${path}"`
    );

    // Replace relative paths
    html = html.replace(
      /(src|href)="(?!http|vscode-webview:)([^"]+)"/g,
      (match, attr, path) => `${attr}="${baseUri}/${path}"`
    );

    // Inject API proxy script
    const proxyScript = `
    <script>
      const vscode = acquireVsCodeApi();
      const pending = new Map();
      let id = 0;

      window.addEventListener('message', e => {
        const { requestId, result, error } = e.data;
        const p = pending.get(requestId);
        if (p) {
          pending.delete(requestId);
          error ? p.reject(new Error(error)) : p.resolve(result);
        }
      });

      const _fetch = window.fetch;
      window.fetch = (url, opts = {}) => {
        const path = url.toString();
        if (path.startsWith('/api') || path.startsWith('/health')) {
          return new Promise((resolve, reject) => {
            const requestId = id++;
            pending.set(requestId, { resolve, reject });
            vscode.postMessage({
              type: 'api',
              requestId,
              method: opts.method || 'GET',
              path,
              body: opts.body ? JSON.parse(opts.body) : null
            });
          });
        }
        return _fetch(url, opts);
      };
    </script>
  `;

    webview.html = html.replace("</head>", `${proxyScript}</head>`);
    webview.onDidReceiveMessage(
      this.router(),
      null,
      this.context.subscriptions
    );
  }
}
