// client/src/utils/api.js
import { Env } from './env.js';

/**
 * Configuração centralizada da API
 */
export class ApiClient {
    constructor() {
        this.baseURL = Env.getEnvVar('VITE_BACKEND_URL', 'http://localhost:10000');
    }

    /**
     * Monta a URL completa para um endpoint
     * @param {string} path - Caminho do endpoint (ex: '/calendar/events')
     * @returns {string} URL completa
     */
    getUrl(path) {
        // Remove barra inicial duplicada
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${this.baseURL}${cleanPath}`;
    }

    /**
     * Faz uma requisição GET
     * @param {string} path - Caminho do endpoint
     * @param {object} options - Opções adicionais do fetch
     * @returns {Promise<Response>}
     */
    async get(path, options = {}) {
        return fetch(this.getUrl(path), {
            method: 'GET',
            credentials: 'include', // Importante para cookies
            ...options
        });
    }

    /**
     * Faz uma requisição POST
     * @param {string} path - Caminho do endpoint
     * @param {object} data - Dados a enviar
     * @param {object} options - Opções adicionais do fetch
     * @returns {Promise<Response>}
     */
    async post(path, data, options = {}) {
        return fetch(this.getUrl(path), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * Faz uma requisição PUT
     * @param {string} path - Caminho do endpoint
     * @param {object} data - Dados a enviar
     * @param {object} options - Opções adicionais do fetch
     * @returns {Promise<Response>}
     */
    async put(path, data, options = {}) {
        return fetch(this.getUrl(path), {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * Faz uma requisição DELETE
     * @param {string} path - Caminho do endpoint
     * @param {object} options - Opções adicionais do fetch
     * @returns {Promise<Response>}
     */
    async delete(path, options = {}) {
        return fetch(this.getUrl(path), {
            method: 'DELETE',
            credentials: 'include',
            ...options
        });
    }
}

// Exporta instância singleton
export const api = new ApiClient();
