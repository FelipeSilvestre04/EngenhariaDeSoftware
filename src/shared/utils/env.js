class Env {
    getEnvVar(
        varName, defaultValue = undefined
    ) {
        return process.env[varName] || defaultValue;
    }
}
export default Env;