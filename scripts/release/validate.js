const {
  resolveBuildNumber,
  resolveEnvironment,
  validateAndroidSigning,
} = require('./config');

const environment = resolveEnvironment();
const buildNumber = resolveBuildNumber();

if (environment === 'production') {
  validateAndroidSigning();
}

process.stdout.write(
  `oto release configuration valid: environment=${environment} build=${buildNumber}\n`,
);
