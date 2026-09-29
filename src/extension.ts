import * as vscode from 'vscode';
import { exec } from 'child_process';

let lastProcessed: string | undefined;

export async function activate(context: vscode.ExtensionContext) {

    vscode.window.showInformationMessage("Traceability Activated");

    const gitExtension = vscode.extensions.getExtension('vscode.git');

    if (!gitExtension) {
        vscode.window.showErrorMessage("Git extension not found");
        return;
    }

    const git = await gitExtension.activate();
    const api = git.getAPI(1);

    function attachRepo(repo: any) {
    vscode.window.showInformationMessage("repo attached 1");
		
        repo.state.onDidChange(() => {
    	vscode.window.showInformationMessage("repo attached 2");
            const head = repo.state.HEAD;

            if (head?.commit && head.commit !== lastProcessed) {
                lastProcessed = head.commit;
                runTraceability();
            }

        });
    }

    // Attach to already opened repos
    api.repositories.forEach((repo: any) => attachRepo(repo));

    // Attach to repos opened later
    api.onDidOpenRepository((repo: any) => {
        attachRepo(repo);
    });
}

function runTraceability() {

    const pythonPath = "python";
    const scriptPath = "C:\\Users\\andrada\\Downloads\\traceability_project";
    const command = `${pythonPath} -m src.commit_runner_for_plugin`;

    exec(command, { cwd: scriptPath }, (error, stdout, stderr) => {

        if (error) {
            vscode.window.showErrorMessage(stderr);
            return;
        }

        try {
            const result = JSON.parse(stdout);

            const output = vscode.window.createOutputChannel("Traceability");
            output.clear();
            output.show(true);

            output.appendLine(`Commit: ${result.sha}`);
            output.appendLine("--------------------------------");

            result.impact.forEach((item: any) => {
                output.appendLine(`Modified File: ${item.file}`);

                item.results.forEach((r: any) => {
                    output.appendLine(` • [${r.type}] ${r.id} -> ${r.explanation ?? "explanation unavailable"}`);
                });
            });

        } catch (e) {
            vscode.window.showErrorMessage("Invalid JSON from Python");
        }

    });
}

export function deactivate() {}