import * as vscode from "vscode";
import { openAccountWidgets } from "./commands/load";
import { loginAccount } from "./commands/login";
import { publishCode } from "./commands/publish";
import { handleTransactionCallback } from "./commands/callbacks";
import { SocialFS } from "./modules/file-system/fs";
import { WidgetPreviewPanel } from "./modules/preview-panel";
import { chooseLocalPath } from "./commands/init-fs";
import { preview } from "./commands/preview";
import { refreshFS } from "./commands/refresh";

export function activate(context: vscode.ExtensionContext) {
  const localWorkspace: string | undefined = context.workspaceState.get('localStoragePath');
  const openAccount: string | undefined = context.workspaceState.get('openAccount');

  context.workspaceState.update('localStoragePath', undefined);
  context.workspaceState.update('openAccount', undefined);

  // File System
  let socialFS = new SocialFS(localWorkspace);
  refreshFS(context, socialFS);
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider(socialFS.scheme, socialFS, { isCaseSensitive: true }));

  // Preview Widget
  const previewPanel = new WidgetPreviewPanel(context, socialFS);
  const log = vscode.window.createOutputChannel("Widget");

  context.subscriptions.push(
    vscode.commands.registerCommand("near.showWidgetPreview", () => { preview(previewPanel, log); })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("near.chooseLocalPath", async () => {
      chooseLocalPath(context, socialFS);
    })
  );

  // Open Widgets by Account ID
  context.subscriptions.push(
    vscode.commands.registerCommand("near.openWidgetsFromAccount", (accountId?) => {
      openAccountWidgets(socialFS, accountId);
    })
  );

  if (openAccount) {
    vscode.commands.executeCommand("near.openWidgetsFromAccount", openAccount);
  }

  // Login
  context.subscriptions.push(
    vscode.commands.registerCommand("near.login", () =>
      loginAccount(context, 'mainnet', socialFS)
    )
  );

  // Publish Code
  context.subscriptions.push(
    vscode.commands.registerCommand("near.publishWidget", () =>
      publishCode(context, 'mainnet')
    )
  );

  // Callback
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri) => handleTransactionCallback(uri, context, localWorkspace, socialFS)
    })
  );

  // Reload FS
  context.subscriptions.push(
    vscode.commands.registerCommand("workbench.files.action.refreshFilesExplorer", () => { refreshFS(context, socialFS); })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  vscode.commands.executeCommand('setContext', 'loadedStoragePath', false);
}