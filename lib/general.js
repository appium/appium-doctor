import { ok, nok, okOptional, nokOptional, resolveExecutablePath } from './utils';
import { exec } from 'teen_process';
import { DoctorCheck } from './doctor';
import NodeDetector from './node-detector';
import log from './logger';
import { EOL } from 'os';
import { system } from 'appium-support';

let checks = [];

// Node Binary
class NodeBinaryCheck extends DoctorCheck {
  async diagnose () {
    let nodePath = await NodeDetector.detect();
    return nodePath ? ok(`The Node.js binary was found at: ${nodePath}`) :
      nok('The Node.js binary was NOT found!');
  }

  fix () {
    return `Manually setup Node.js.`;
  }
}
checks.push(new NodeBinaryCheck());

// Node version
class NodeVersionCheck extends DoctorCheck {
  async diagnose () {
    let nodePath = await NodeDetector.detect();
    if (!nodePath) {
      return nok('Node is not installed, so no version to check!');
    }
    let {stdout} = await exec(nodePath, ['--version']);
    let versionString = stdout.replace('v', '').trim();
    let version = parseInt(versionString, 10);
    if (Number.isNaN(version)) {
      return nok(`Unable to find node version (version = '${versionString}')`);
    }
    return version >= 4 ? ok(`Node version is ${versionString}`) :
      nok('Node version should be at least 4!');
  }

  fix () {
    return `Manually upgrade Node.js.`;
  }
}
checks.push(new NodeVersionCheck());

// Python version check which is required by https://github.com/nodejs/node-gyp
class OptionalPythonVersionCheck extends DoctorCheck {
  async diagnose () {
    const pythonPath = await resolveExecutablePath(`python${system.isWindows() ? `.EXE` : ''}`);
    if (!pythonPath) {
      return nokOptional(`Python required by node-gyp (used by heapdump) not found in PATH: ${process.env.PATH}`);
    }

    // It can return version number as stderr
    const {stdout, stderr} = await exec(pythonPath, ['-V']);
    let versionString = `${stdout} ${stderr}`.match(/Python (\d(\.\d+)*)/g);
    if (versionString) {
      versionString = versionString.pop().replace('Python ', '');
    }
    const version = parseInt(versionString, 10);
    if (Number.isNaN(version)) {
      return nokOptional(`Unable to identify Python version correctly (version = '${versionString}') at ${pythonPath}. Please make sure your Python environment in PATH: ${process.env.PATH}. node-gyp (used by heapdump) requires Python 2.x`);
    }
    return version === 2 ? okOptional(`Python required by node-gyp (used by heapdump) is installed at: ${pythonPath}. Installed version is: ${versionString}`) :
      nokOptional('Python version required by node-gyp (used by heapdump) should be 2.x');
  }

  fix () {
    return `Manually configure Python 2.x environment. node-gyp which is NodeJS toolchain requires Python 2.x`;
  }
}
checks.push(new OptionalPythonVersionCheck());


class OptionalOpencv4nodejsCommandCheck extends DoctorCheck {
  async diagnose () {
    let stdout = '';
    const packageName = 'opencv4nodejs';

    const npmPath = await resolveExecutablePath(`npm${system.isWindows() ? `.cmd` : ''}`);
    if (!npmPath) {
      return nokOptional(`'npm' binary not found in PATH: ${process.env.PATH}`);
    }

    try {
      ({stdout} = await exec(npmPath, ['list', '-g', packageName]));
    } catch (err) {
      log.debug(err);
    }
    if (stdout.includes(packageName)) {
      const lines = stdout.split(EOL);
      const openvcLib = lines.find(function (line) { return line.includes(`${packageName}@`); });
      return (openvcLib)
        ? okOptional(`${packageName} is installed at: ${lines[0]}. Installed version is: ${openvcLib.match(/(\d(\.\d+)*)/g).pop()}`)
        : okOptional(`${packageName} is probably installed at: ${lines[0]}.`);
    }
    return nokOptional(`${packageName} cannot be found.`);
  }

  async fix () { // eslint-disable-line require-await
    return 'Why opencv4nodejs is needed and how to install it: https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/image-comparison.md';
  }
}
checks.push(new OptionalOpencv4nodejsCommandCheck());

class OptionalFfmpegCommandCheck extends DoctorCheck {
  async diagnose () {
    const ffmpegPath = await resolveExecutablePath('ffmpeg');
    return ffmpegPath
      ? okOptional(`ffmpeg is installed at: ${ffmpegPath}. ${(await exec('ffmpeg', ['-version'])).stdout.split(EOL)[0]}`)
      : nokOptional('ffmpeg cannot be found');
  }

  async fix () { // eslint-disable-line require-await
    return 'ffmpeg is needed to record screen features. Please read https://www.ffmpeg.org/ to install it';
  }
}
checks.push(new OptionalFfmpegCommandCheck());

export { NodeBinaryCheck, NodeVersionCheck, OptionalPythonVersionCheck,
  OptionalOpencv4nodejsCommandCheck, OptionalFfmpegCommandCheck };
export default checks;
