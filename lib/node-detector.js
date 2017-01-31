import { fs } from 'appium-support';
import { exec } from 'teen_process';
import log from './logger';
import path from 'path';

const NODE_COMMON_PATHS = [
  process.env.NODE_BIN,
  '/usr/local/bin/node',
  '/opt/local/bin/node',
];

// Look for node
class NodeDetector {
  static async retrieveInCommonPlaces () {
    for (let p of NODE_COMMON_PATHS) {
      if (p && await fs.exists(p)) {
        log.debug(`Node binary found at common place: ${p}`);
        return p;
      }
    }
    log.debug('Node binary wasn\'t found at common places.');
    return null;
  }

  static async retrieveUsingWhichCommand () {
    let stdout;
    try {
      stdout = (await exec('which', ['node'])).stdout;
    } catch (ign) {
      log.debug(ign);
      return null;
    }
    let nodePath = stdout.replace("\n", "");
    if (await fs.exists(nodePath)) {
      log.debug(`Node binary found using which command at: ${nodePath}`);
      return nodePath;
    } else {
      log.debug('Node binary not found using the which command.');
      return null;
    }
  }

  static async retrieveUsingWhereCommand () {
    let stdout;
    try {
      stdout = (await exec('where', ['node'])).stdout;
    } catch (ign) {
      log.debug(ign);
      return null;
    }
    let nodePath = stdout.replace("\n", "");
    if (await fs.exists(nodePath)) {
      log.debug(`Node binary found using where command at: ${nodePath}`);
      return nodePath;
    } else {
      log.debug('Node binary not found using the where command.');
      return null;
    }
  }

  static async retrieveUsingAppleScript () {
    var appScript = [
      'try'
      , '  set appiumIsRunning to false'
      , '  tell application "System Events"'
      , '    set appiumIsRunning to name of every process contains "Appium"'
      , '  end tell'
      , '  if appiumIsRunning then'
      , '    tell application "Appium" to return node path'
      , '  end if'
      , 'end try'
      , 'return "NULL"'
    ].join("\n");
    let stdout;
    try {
      stdout = (await exec('osascript', ['-e', appScript])).stdout;
    } catch (ign) {
      log.debug(ign);
      return null;
    }
    let nodePath = stdout.replace("\n", "");
    if (await fs.exists(nodePath)) {
      log.debug(`Node binary found using AppleScript at: ${nodePath}`);
      return nodePath;
    } else {
      log.debug('Node binary not found using AppleScript.');
      return null;
    }
  }

  static async retrieveUsingAppiumConfigFile () {
    let jsonobj;
    try {
      var appiumConfigPath = path.resolve(__dirname, '..', '..', '.appiumconfig.json');
      if (await fs.exists(appiumConfigPath)) {
        jsonobj = JSON.parse(await fs.readFile(appiumConfigPath, 'utf8'));
      }
    } catch (ign) {
      log.debug(ign);
      return null;
    }
    if (jsonobj && jsonobj.node_bin && await fs.exists(jsonobj.node_bin) ) {
      log.debug(`Node binary found using .appiumconfig.json at: ${jsonobj.node_bin}`);
      return jsonobj.node_bin;
    } else {
      log.debug('Node binary not found in the .appiumconfig.json file.');
      return null;
    }
  }

  static async detect () {
    let nodePath = await this.retrieveInCommonPlaces() ||
      await NodeDetector.retrieveUsingWhichCommand() ||
      await NodeDetector.retrieveUsingWhereCommand() ||
      await NodeDetector.retrieveUsingAppleScript() ||
      await NodeDetector.retrieveUsingAppiumConfigFile();
    if (nodePath) {
      return nodePath;
    } else {
      log.warn('The node binary could not be found.');
      return null;
    }
  }
}

export default NodeDetector;
