import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to the extension test script
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        console.log('Starting test run...');
        console.log('Extension path:', extensionDevelopmentPath);
        console.log('Test path:', extensionTestsPath);

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions',
                '--disable-gpu',
                '--disable-workspace-trust',
                '--skip-welcome',
                '--skip-release-notes'
            ],
            version: '1.60.0'  // Use a specific version of VS Code
        });

        console.log('Test run completed successfully');
    } catch (err) {
        console.error('Failed to run tests');
        console.error(err);
        process.exit(1);
    }
}

console.log('Initializing test runner...');
main().catch(err => {
    console.error('Failed to initialize test runner');
    console.error(err);
    process.exit(1);
});
