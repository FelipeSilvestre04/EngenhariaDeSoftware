/**
 * Mock do módulo de banco de dados para testes
 * Este helper cria mocks do db.query() para isolar testes das dependências externas
 */

/**
 * Cria um mock do banco de dados com respostas configuráveis
 * @param {Object} responses - Objeto com queries como chaves e respostas como valores
 * @returns {Object} Mock do db com função query
 */
export function createMockDb(responses = {}) {
    const queryHistory = [];

    const mockDb = {
        /**
         * Mock da função query
         * @param {string} text - SQL query
         * @param {Array} params - Parâmetros da query
         * @returns {Promise<Object>} Resposta mockada
         */
        query: async (text, params = []) => {
            queryHistory.push({ text, params });

            // Procura por uma resposta configurada que contenha parte da query
            for (const [queryPattern, response] of Object.entries(responses)) {
                if (text.includes(queryPattern)) {
                    // Se a resposta for uma função, executa com os params
                    if (typeof response === 'function') {
                        return response(params);
                    }
                    return response;
                }
            }

            // Resposta padrão para queries não configuradas
            return { rows: [], rowCount: 0 };
        },

        /**
         * Retorna o histórico de queries executadas
         * @returns {Array} Lista de queries
         */
        getQueryHistory: () => queryHistory,

        /**
         * Limpa o histórico de queries
         */
        clearHistory: () => {
            queryHistory.length = 0;
        },

        /**
         * Retorna a última query executada
         * @returns {Object|null} Última query ou null
         */
        getLastQuery: () => queryHistory[queryHistory.length - 1] || null
    };

    return mockDb;
}

/**
 * Cria respostas padrão para queries comuns
 */
export const defaultResponses = {
    // Projects
    projectsList: {
        rows: [
            { id: 1, title: 'Projeto Alpha', color: '#FF5733' },
            { id: 2, title: 'Projeto Beta', color: '#33C1FF' }
        ]
    },
    projectSingle: {
        rows: [
            { id: 1, title: 'Projeto Alpha', color: '#FF5733' }
        ]
    },
    projectCreated: {
        rows: [
            { id: 3, title: 'Novo Projeto', color: '#666666' }
        ]
    },
    projectDeleted: {
        rows: [
            { id: 1, title: 'Projeto Alpha' }
        ]
    },

    // Tasks
    tasksList: {
        rows: [
            { id: 1, projectId: 1, title: 'Task 1', description: 'Descrição 1', column: 'to-do', tags: ['Backend'] },
            { id: 2, projectId: 1, title: 'Task 2', description: 'Descrição 2', column: 'in-progress', tags: [] }
        ]
    },
    taskCreated: { rows: [{ id: 3 }] },
    taskDeleted: { rows: [{ task_id: 1 }] },

    // Lists
    listId: { rows: [{ list_id: 1 }] },

    // Tags
    tagFound: { rows: [{ tag_id: 1 }] },
    tagCreated: { rows: [{ tag_id: 2 }] },

    // Empty results
    empty: { rows: [], rowCount: 0 }
};
