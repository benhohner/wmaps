export const onPreBuild = function ({ netlifyConfig, packageJson }) {
  netlifyConfig.build.environment.NPM_PACKAGE_VERSION = packageJson.version;
};
