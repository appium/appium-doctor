import { cp, fs, macOsxVersion, ok, nok } from './utils';
import { DoctorCheck } from './doctor';
import log from './logger';
import path from 'path';
import { FixSkippedError } from './doctor';
import NodeDetector from './node-detector';
import { doIt } from './prompt';

let checks = [];

// Helpers
// TODO move or use lib
async function authorizeIos () {
  try {
    var authorizePath = path.resolve(__dirname, "../../bin", "authorize-ios.js");
    await cp.exec(`'${process.execPath}' '${authorizePath}'`, { maxBuffer: 524288});
  } catch (err) {
    throw new Error('Could not authorize iOS: ' + err);
  }
}

// Check for Xcode.
class XcodeCheck extends DoctorCheck {
  constructor() {
    super({autofix: true});
  }

  async diagnose() {
    let xcodePath;
    try {
      let [stdout] = await cp.exec("xcode-select --print-path", { maxBuffer: 524288});
      xcodePath = stdout.replace("\n", "");
    } catch (err) {
      return nok('Xcode is NOT installed!');
    }
    return xcodePath && await fs.exists(xcodePath) ? ok(`Xcode is installed at ${xcodePath}.`) :
      nok(`Xcode cannot be found at ${xcodePath}!`);
  }

  async fix () {
    let cmd = 'xcode-select --install';
    log.info(`The following command need be executed: '${cmd}'.`);
    let yesno = await doIt();
    if (yesno === 'yes') {
      await cp.exec("xcode-select --install", { maxBuffer: 524288});
    } else {
      log.info('Skipping you will need to install Xcode manually.');
      throw new FixSkippedError();
    }
  }
}
checks.push(new XcodeCheck());

// Check for Xcode Command Line Tools.
class XcodeCmdLineToolsCheck extends DoctorCheck {
  constructor() {
    super({autofix: true});
  }

  async diagnose () {
    const errMess = 'Xcode Command Line Tools are NOT installed!';
    let pkgName = await macOsxVersion() === '10.8' ? "com.apple.pkg.DeveloperToolsCLI" : "com.apple.pkg.CLTools_Executables";
    let stdout;
    try {
      [stdout] = await cp.exec("pkgutil --pkg-info=" + pkgName, { maxBuffer: 524288});
    } catch (err) {
      log.debug(err);
      return nok(errMess);
    }
    return stdout.match(/install-time/) ? ok('Xcode Command Line Tools are installed.') : 
      nok(errMess);
  }

  async fix () {
    await cp.exec("xcode-select --install", { maxBuffer: 524288});
  }
}
checks.push(new XcodeCmdLineToolsCheck());

// Dev Tools Security
class DevToolsSecurityCheck extends DoctorCheck {
  constructor() {
    super({autofix: true});
  }

  async diagnose () {
    const errMess = 'DevToolsSecurity is NOT enabled!';
    let stdout;
    try {
      [stdout] = await cp.exec("DevToolsSecurity", { maxBuffer: 524288});
    } catch (err) {
      log.debug(err);
      return nok(errMess);
    }
    return stdout && stdout.match(/enabled/) ? ok('DevToolsSecurity is enabled.') 
      : nok(errMess);
  }

  async fix () {
    await authorizeIos();
  }
}
checks.push(new DevToolsSecurityCheck());

// Authorization DB
class AuthorizationDbCheck extends DoctorCheck {
  constructor() {
    super({autofix: true});
  }

  async diagnose () {
    const successMess = 'The Authorization DB is set up properly.';
    const errMess = 'The Authorization DB is NOT set up properly.';
    let stdout;
    try {
      [stdout] = await cp.exec("security authorizationdb read system.privilege.taskport", { maxBuffer: 524288});
    } catch (err) {
      if (await macOsxVersion() === '10.8') {
        let data;
        try {
          data = await fs.readFile('/etc/authorization', 'utf8');
        } catch (err) {
          log.debug(err);
          return nok(errMess);
        }
        let rg =/<key>system.privilege.taskport<\/key>\s*\n\s*<dict>\n\s*<key>allow-root<\/key>\n\s*(<true\/>)/;
        return data && data.match(rg) ? ok(successMess) : nok(errMess);
      } else {
        log.debug(err);
        return nok(errMess);
      }
    }
    return stdout && (stdout.match(/is-developer/) || stdout.match(/allow/)) ?
       ok(successMess) : nok(errMess);
  }

  async fix () {
    await authorizeIos();
  }
}
checks.push(new AuthorizationDbCheck());

// Node Binary
class NodeBinaryCheck extends DoctorCheck {
  async diagnose () {
    let nodePath = await NodeDetector.detect();
    return nodePath ? ok(`The Node.js binary was found at: ${nodePath}.`) :
      nok('The Node.js binary was NOT found!');
  }

  fix() {
    return `Manually setup Node.js and run appium-doctor again.`;
  }
}
checks.push(new NodeBinaryCheck());

export { authorizeIos, XcodeCheck, XcodeCmdLineToolsCheck, DevToolsSecurityCheck,
         AuthorizationDbCheck, NodeBinaryCheck };
export default checks;
