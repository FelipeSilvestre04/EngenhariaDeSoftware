export class Env {
    static getEnvVar(name, defaultValue = undefined) {
        return import.meta.env[name] || defaultValue;
    }
}