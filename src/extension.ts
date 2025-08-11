import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Activating EDE VSCode extension...');
	await vscode.commands.executeCommand('setContext', 'forwardedPortsViewEnabled', true);

	// DEVNOTE: Update package.json for command registrations
	let disposable = vscode.commands.registerCommand('ede-vscode.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from EDE VSCode!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	console.log('Deactivating EDE VSCode extension...');
	// Clean up resources if necessary
}