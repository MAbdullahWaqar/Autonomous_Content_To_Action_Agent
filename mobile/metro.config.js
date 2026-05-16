const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

function getFirebaseAuthRnPath() {
  const candidates = [
    path.join(__dirname, 'node_modules/@firebase/auth/dist/rn/index.js'),
    path.join(
      __dirname,
      'node_modules/firebase/node_modules/@firebase/auth/dist/rn/index.js',
    ),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Could not find @firebase/auth React Native bundle. Run npm install in mobile/.',
  );
}

const firebaseAuthRn = getFirebaseAuthRnPath();

// Firebase + Expo SDK 53+: avoid dual CJS/ESM @firebase/app loads and use the RN auth build.
// https://github.com/expo/expo/issues/36598#issuecomment-2848750540
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/auth' && platform !== 'web') {
    return { type: 'sourceFile', filePath: firebaseAuthRn };
  }

  if (moduleName.startsWith('@firebase/')) {
    return context.resolveRequest(
      { ...context, isESMImport: true },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
