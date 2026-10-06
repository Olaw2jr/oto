const SUPPORTED_ENVIRONMENTS = new Set([
  'development',
  'staging',
  'production',
]);

const resolveEnvironment = (
  value = process.env.OTO_ENVIRONMENT || 'development',
) => {
  if (!SUPPORTED_ENVIRONMENTS.has(value)) {
    throw new Error(`Unsupported OTO_ENVIRONMENT: ${value}`);
  }
  return value;
};

const resolveBuildNumber = (
  value = process.env.OTO_BUILD_NUMBER || '1',
) => {
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error('OTO_BUILD_NUMBER must be a positive integer');
  }
  return Number(value);
};

const androidSigning = (env = process.env) => ({
  storeFile: env.OTO_UPLOAD_STORE_FILE,
  storePassword: env.OTO_UPLOAD_STORE_PASSWORD,
  keyAlias: env.OTO_UPLOAD_KEY_ALIAS,
  keyPassword: env.OTO_UPLOAD_KEY_PASSWORD,
});

const validateAndroidSigning = (env = process.env) => {
  const signing = androidSigning(env);
  const missing = Object.entries(signing)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(
      `Missing Android release signing inputs: ${missing.join(', ')}`,
    );
  }
  return signing;
};

module.exports = {
  androidSigning,
  resolveBuildNumber,
  resolveEnvironment,
  validateAndroidSigning,
};
