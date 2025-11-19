import * as vscode from "vscode";
import * as fs from "fs";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showAIStudio(context: vscode.ExtensionContext) {
  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

  if (currentPanel) {
    // If we already have a panel, show it in the target column
    currentPanel.reveal(columnToShowIn);
    return;
  }

  // Create and show a new webview panel
  currentPanel = vscode.window.createWebviewPanel(
    "aiStudio",
    "AI Studio",
    columnToShowIn || vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "out", "langflow"),
      ],
    }
  );

  currentPanel.webview.html = getHtml(currentPanel.webview, context);

  // Handle messages from the webview (API proxy)
  currentPanel.webview.onDidReceiveMessage(
    async (msg) => {
      if (msg.type === "api") {
        try {
          const url = `http://localhost:2001${msg.path}`;
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
    },
    null,
    context.subscriptions
  );

  // Reset when the current panel is closed
  currentPanel.onDidDispose(
    () => {
      currentPanel = undefined;
    },
    null,
    context.subscriptions
  );
}

function getHtml(webview: vscode.Webview, context: vscode.ExtensionContext) {
  const langflowPath = vscode.Uri.joinPath(
    context.extensionUri,
    "out",
    "langflow"
  );

  const indexHtml = vscode.Uri.joinPath(langflowPath, "index.html");
  let html = fs.readFileSync(indexHtml.fsPath, "utf8");

  // Get the base URI for the langflow assets
  const baseUri = webview.asWebviewUri(langflowPath);

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

  html = html.replace("</head>", `${proxyScript}</head>`);

  return html;
}
