/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/define("vs/code/electron-main/main.nls",{"vs/base/common/date":["in {0}","now","{0} sec ago","{0} secs ago","{0} sec","{0} secs","{0} min ago","{0} mins ago","{0} min","{0} mins","{0} hr ago","{0} hrs ago","{0} hr","{0} hrs","{0} day ago","{0} days ago","{0} day","{0} days","{0} wk ago","{0} wks ago","{0} wk","{0} wks","{0} mo ago","{0} mos ago","{0} mo","{0} mos","{0} yr ago","{0} yrs ago","{0} yr","{0} yrs"],"vs/base/common/errorMessage":["{0}: {1}","A system error occurred ({0})","An unknown error occurred. Please consult the log for more details.","An unknown error occurred. Please consult the log for more details.","{0} ({1} errors in total)","An unknown error occurred. Please consult the log for more details."],"vs/base/common/keybindingLabels":["Ctrl","Shift","Alt","Windows","Ctrl","Shift","Alt","Super","Control","Shift","Alt","Command","Control","Shift","Alt","Windows","Control","Shift","Alt","Super"],"vs/base/node/processes":["Can't execute a shell command on a UNC drive."],"vs/code/electron-main/app":["&&Yes","&&No","An external application wants to open '{0}' in {1}. Do you want to open this file or folder?","If you did not initiate this request, it may represent an attempted attack on your system. Unless you took an explicit action to initiate this request, you should press 'No'","Successfully created trace.",`Please create an issue and manually attach the following file:
{0}`,"&&OK"],"vs/code/electron-main/main":["A second instance of {0} is already running as administrator.","Please close the other instance and try again.","Another instance of {0} is running but not responding","Please close all other instances and try again.","Unable to write program user data.",`{0}

Please make sure the following directories are writeable:

{1}`,"&&Close"],"vs/platform/configuration/common/configurationRegistry":["Default Language Configuration Overrides","Configure settings to be overridden for {0} language.","Configure editor settings to be overridden for a language.","This setting does not support per-language configuration.","Cannot register an empty property","Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.","Cannot register '{0}'. This property is already registered."],"vs/platform/dialogs/electron-main/dialogMainService":["Open","Open Folder","Open File","Open Workspace","&&Open"],"vs/platform/environment/node/argv":["Options","Extensions Management","Troubleshooting","Compare two files with each other.","Add folder(s) to the last active window.","Open a file at the path on the specified line and character position.","Force to open a new window.","Force to open a file or folder in an already opened window.","Wait for the files to be closed before returning.","The locale to use (e.g. en-US or zh-TW).","Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.","Print usage.","Set the root path for extensions.","List the installed extensions.","Show versions of installed extensions, when using --list-extensions.","Filters installed extensions by provided category, when using --list-extensions.","Installs or updates the extension. The identifier of an extension is always `${publisher}.${name}`. Use `--force` argument to update to latest version. To install a specific version provide `@${version}`. For example: 'vscode.csharp@1.2.3'.","Uninstalls an extension.","Enables proposed API features for extensions. Can receive one or more extension IDs to enable individually.","Print version.","Print verbose output (implies --wait).","Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'.","Print process usage and diagnostics information.","Run CPU profiler during startup.","Disable all installed extensions.","Disable an extension.","Turn sync on or off.","Allow debugging and profiling of extensions. Check the developer tools for the connection URI.","Allow debugging and profiling of extensions with the extension host being paused after start. Check the developer tools for the connection URI.","Disable GPU hardware acceleration.","Max memory size for a window (in Mbytes).","Shows all telemetry events which VS code collects.","Usage","options","paths","To read output from another program, append '-' (e.g. 'echo Hello World | {0} -')","To read from stdin, append '-' (e.g. 'ps aux | grep code | {0} -')","Unknown version","Unknown commit"],"vs/platform/environment/node/argvHelper":["Warning: '{0}' is not in the list of known options, but still passed to Electron/Chromium.","Option '{0}' is defined more than once. Using value '{1}.'","Arguments in `--goto` mode should be in the format of `FILE(:LINE(:CHARACTER))`."],"vs/platform/extensionManagement/common/extensionManagement":["Extensions","Preferences"],"vs/platform/extensions/common/extensionValidator":["Could not parse `engines.vscode` value {0}. Please use, for example: ^1.22.0, ^1.22.x, etc.","Version specified in `engines.vscode` ({0}) is not specific enough. For vscode versions before 1.0.0, please define at a minimum the major and minor desired version. E.g. ^0.10.0, 0.10.x, 0.11.0, etc.","Version specified in `engines.vscode` ({0}) is not specific enough. For vscode versions after 1.0.0, please define at a minimum the major desired version. E.g. ^1.10.0, 1.10.x, 1.x.x, 2.x.x, etc.","Extension is not compatible with Code {0}. Extension requires: {1}."],"vs/platform/externalTerminal/node/externalTerminalService":["VS Code Console","Script '{0}' failed with exit code {1}","'{0}' not supported","Press any key to continue...","'{0}' failed with exit code {1}","can't find terminal application '{0}'"],"vs/platform/files/common/fileService":["Unable to resolve filesystem provider with relative file path '{0}'","No file system provider found for resource '{0}'","Unable to resolve non-existing file '{0}'","Unable to create file '{0}' that already exists when overwrite flag is not set","Unable to write file '{0}' ({1})","Unable to unlock file '{0}' because provider does not support it.","Unable to write file '{0}' that is actually a directory","File Modified Since","Unable to read file '{0}' ({1})","Unable to read file '{0}' ({1})","Unable to read file '{0}' ({1})","Unable to read file '{0}' that is actually a directory","File not modified since","Unable to read file '{0}' that is too large to open","Unable to copy when source '{0}' is same as target '{1}' with different path case on a case insensitive file system","Unable to move/copy when source '{0}' is parent of target '{1}'.","Unable to move/copy '{0}' because target '{1}' already exists at destination.","Unable to move/copy '{0}' into '{1}' since a file would replace the folder it is contained in.","Unable to create folder '{0}' that already exists but is not a directory","Unable to delete file '{0}' via trash because provider does not support it.","Unable to delete non-existing file '{0}'","Unable to delete non-empty folder '{0}'.","Unable to modify readonly file '{0}'","Unable to modify readonly file '{0}'"],"vs/platform/files/common/files":["Unknown Error","{0}B","{0}KB","{0}MB","{0}GB","{0}TB"],"vs/platform/files/common/io":["To open a file of this size, you need to restart and allow {0} to use more memory","File is too large to open"],"vs/platform/files/node/diskFileSystemProvider":["File already exists","File does not exist","Unable to move '{0}' into '{1}' ({2}).","Unable to copy '{0}' into '{1}' ({2}).","'File cannot be copied to same path with different path case","File at target already exists"],"vs/platform/issue/electron-main/issueMainService":["Local","There is too much data to send to GitHub directly. The data will be copied to the clipboard, please paste it into the GitHub issue page that is opened.","&&OK","&&Cancel","Your input will not be saved. Are you sure you want to close this window?","&&Yes","&&Cancel","Issue Reporter","Process Explorer"],"vs/platform/menubar/electron-main/menubar":["New &&Window","&&File","&&Edit","&&Selection","&&View","&&Go","&&Run","&&Terminal","Window","&&Help","About {0}","&&Preferences","Services","Hide {0}","Hide Others","Show All","Quit {0}","Minimize","Zoom","Bring All to Front","Switch &&Window...","New Tab","Show Previous Tab","Show Next Tab","Move Tab to New Window","Merge All Windows","Check for &&Updates...","Checking for Updates...","D&&ownload Available Update","Downloading Update...","Install &&Update...","Installing Update...","Restart to &&Update"],"vs/platform/native/electron-main/nativeHostMainService":["{0} will now prompt with 'osascript' for Administrator privileges to install the shell command.","&&OK","&&Cancel","Unable to install the shell command '{0}'.","{0} will now prompt with 'osascript' for Administrator privileges to uninstall the shell command.","&&OK","&&Cancel","Unable to uninstall the shell command '{0}'.","Unable to find shell script in '{0}'"],"vs/platform/request/common/request":["HTTP","The proxy setting to use. If not set, will be inherited from the `http_proxy` and `https_proxy` environment variables.","Controls whether the proxy server certificate should be verified against the list of supplied CAs.","The value to send as the `Proxy-Authorization` header for every network request.","Disable proxy support for extensions.","Enable proxy support for extensions.","Enable proxy support for extensions, fall back to request options, when no proxy found.","Enable proxy support for extensions, override request options.","Use the proxy support for extensions.","Controls whether CA certificates should be loaded from the OS. (On Windows and macOS, a reload of the window is required after turning this off.)"],"vs/platform/telemetry/common/telemetryService":["Telemetry","Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made.","Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made. [Read more]({1}) about what we collect and our privacy statement."],"vs/platform/update/common/update.config.contribution":["Update","Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service.","Disable updates.","Disable automatic background update checks. Updates will be available if you manually check for updates.","Check for updates only on startup. Disable automatic background update checks.","Enable automatic update checks. Code will check for updates automatically and periodically.","Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service.","This setting is deprecated, please use '{0}' instead.","Enable Background Updates on Windows","Enable to download and install new VS Code versions in the background on Windows.","Show Release Notes after an update. The Release Notes are fetched from a Microsoft online service."],"vs/platform/windows/electron-main/window":["&&Reopen","&&Keep Waiting","&&Close","The window is not responding","You can reopen or close the window or keep waiting.","The window has crashed","The window has crashed (reason: '{0}', code: '{1}')","&&Reopen","&&Close","We are sorry for the inconvenience. You can reopen the window to continue where you left off.","You can still access the menu bar by pressing the Alt-key."],"vs/platform/windows/electron-main/windowsMainService":["&&OK","Path does not exist","URI can not be opened","The path '{0}' does not exist on this computer.","The URI '{0}' is not valid and can not be opened."],"vs/platform/workspaces/common/workspaces":["Code Workspace"],"vs/platform/workspaces/electron-main/workspacesHistoryMainService":["New Window","Opens a new window","Recent Folders & Workspaces","Recent Folders","Untitled (Workspace)","{0} (Workspace)"],"vs/platform/workspaces/electron-main/workspacesManagementMainService":["&&OK","Unable to save workspace '{0}'","The workspace is already opened in another window. Please close that window first and then try again."]});

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/e7d7e9a9348e6a8cc8c03f877d39cb72e5dfb1ff/core/vs/code/electron-main/main.nls.js.map
