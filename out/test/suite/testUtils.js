"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
exports.clearConfiguration = clearConfiguration;
exports.setupTestConfiguration = setupTestConfiguration;
exports.waitForExtensionActivation = waitForExtensionActivation;
exports.mockQuickPick = mockQuickPick;
exports.mockInputBox = mockInputBox;
const vscode = __importStar(require("vscode"));
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function clearConfiguration() {
    const config = vscode.workspace.getConfiguration('hexQuickResponder');
    await config.update('responses', undefined, vscode.ConfigurationTarget.Global);
    await config.update('autoRespond', undefined, vscode.ConfigurationTarget.Global);
}
async function setupTestConfiguration() {
    const config = vscode.workspace.getConfiguration('hexQuickResponder');
    await config.update('responses', {
        'Test Question?': 'Yes',
        'Save changes?': 'Yes'
    }, vscode.ConfigurationTarget.Global);
    await config.update('autoRespond', true, vscode.ConfigurationTarget.Global);
}
async function waitForExtensionActivation() {
    const extension = vscode.extensions.getExtension('HexProperty.Hex-Quick-Responder');
    if (extension) {
        if (!extension.isActive) {
            await extension.activate();
        }
        await sleep(100); // Give the extension a moment to fully activate
    }
}
function mockQuickPick(items) {
    return Promise.resolve({
        label: items[0],
        description: `Responds with: Yes`
    });
}
function mockInputBox(value) {
    return Promise.resolve(value);
}
//# sourceMappingURL=testUtils.js.map