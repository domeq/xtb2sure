const NAME = process.env.DD_SERVICE || "xtb2sure";
const ENVIRONMENT = process.env.NODE_ENV || "development";
const VERSION = process.env.npm_package_version || "dev";

export default {
    application: {
        env: ENVIRONMENT,
        name: NAME,
        version: VERSION,
    },
};
