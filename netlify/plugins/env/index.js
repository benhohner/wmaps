export const onPreBuild = function ({ netlifyConfig, packageJson }) {
  netlifyConfig.build.environment.npm_package_version = packageJson.version;
};
