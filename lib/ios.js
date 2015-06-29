import {cp, fs, macOsxVersion, ok, nok} from './utils';
import {DoctorCheck} from './doctor';
import log from './logger';
import path from 'path';
import NodeDetector from './node-detector';
let checks = [];

// Helpers

async function authorizeIos () {
  try {
    var authorizePath = path.resolve(__dirname, "../../bin", "authorize-ios.js");
    cp.exec("'" + process.execPath + "' '" + authorizePath + "'", { maxBuffer: 524288});
  } catch (err) {
    throw new Error('Could not authorize iOS: ' + err);
  }
}

// Check for Xcode.
class XcodeCheck extends DoctorCheck {
 async diagnose() {
    let xcodePath;
    const errMess = 'Xcode is NOT installed!';
    try {
      let [stdout] = await cp.exec("xcode-select --print-path", { maxBuffer: 524288});
      xcodePath = stdout.replace("\n", "");
    } catch (err) {
      log.debug(err);
      return nok(errMess);
    }
    return xcodePath && await fs.existsSync(xcodePath) ? ok(`Xcode is installed at {xcodePath}.`) : 
      nok(errMess);
  }

  async fix () {
    await cp.exec("xcode-select --install", { maxBuffer: 524288});
  }
}
checks.push(new XcodeCheck());

// Check for Xcode Command Line Tools.
class XcodeCmdLineToolsCheck extends DoctorCheck {
  async diagnose () {
    const errMess = "Xcode Command Line Tools are NOT installed!";
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
  async diagnose () {
    const errMess = 'The Authorization DB is NOT set up properly.';
    let stdout;
    try {
      [stdout] = await cp.exec("security authorizationdb read system.privilege.taskport", { maxBuffer: 524288});
    } catch (err) {
      if(await macOsxVersion() === 10.8) {
        let data;
        try {
          data = await fs.readFile('/etc/authorization', 'utf8');
        } catch (err) {
          log.debug(err);
          return nok(errMess);
        }
        let rg =/<key>system.privilege.taskport<\/key>\s*\n\s*<dict>\n\s*<key>allow-root<\/key>\n\s*(<true\/>)/;
        return data && data.match(rg) ? ok('The Authorization DB is set up properly.') : nok();
      } else {
        log.debug(err);
        return nok(errMess);
      }
    }
    return stdout && (stdout.match(/is-developer/) || stdout.match(/allow/)) ? ok() : nok();
  }

  async fix () {
    await authorizeIos();
  }
}
checks.push(new AuthorizationDbCheck());

// Node Binary
class NodeBinaryCheck extends DoctorCheck {
  async diagnose () {
    let nodePath;
    let ok = () => { return {ok: true, message: `The Node.js binary was found here: {nodePath}.`}; };
    let nok = () => { return {ok: false, message: "The Node.js binary was NOT found!."}; };
    nodePath = new NodeDetector().detect();
    return nodePath ? ok(`The Node.js binary was found here: {nodePath}.`) : 
      nok('The Node.js binary was NOT found!.');
  }
}
checks.push(new NodeBinaryCheck());

export { authorizeIos, XcodeCheck };
export default checks;
