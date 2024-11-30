import * as path from 'path';
import Mocha = require('mocha');
import glob = require('glob');

export async function run(): Promise<void> {
    console.log('Initializing test suite...');

    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 60000,  // Longer timeout for stability
        reporter: 'spec' // More detailed test reporting
    });

    const testsRoot = path.resolve(__dirname, '.');
    console.log('Tests root:', testsRoot);

    return new Promise<void>((resolve, reject) => {
        try {
            // Find all test files
            console.log('Searching for test files...');
            glob('**/**.test.js', { 
                cwd: testsRoot 
            }, (err: Error | null, files: string[]) => {
                if (err) {
                    return reject(err);
                }

                console.log('Found test files:', files);

                // Add files to the test suite
                files.forEach((f: string) => {
                    console.log('Adding test file:', f);
                    mocha.addFile(path.resolve(testsRoot, f));
                });

                console.log('Running tests...');
                // Run the mocha test
                try {
                    mocha.run((failures: number) => {
                        if (failures > 0) {
                            console.error(`${failures} tests failed.`);
                            reject(new Error(`${failures} tests failed.`));
                        } else {
                            console.log('All tests passed successfully.');
                            resolve();
                        }
                    });
                } catch (err) {
                    console.error('Error running tests:', err);
                    reject(err);
                }
            });
        } catch (err) {
            console.error('Error in test suite:', err);
            reject(err);
        }
    });
}
