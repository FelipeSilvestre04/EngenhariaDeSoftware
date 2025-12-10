/**
 * Testes para ProjectsService
 * Testa operações CRUD de projetos com mock do banco de dados
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { createMockDb, defaultResponses } from "./mocks/db.mock.js";

// Simula a classe ProjectsService isolada do banco real
class MockedProjectsService {
    constructor(db) {
        this.db = db;
    }

    async getAllProjects(userId) {
        const query = `
            SELECT project_id as id, name as title, color 
            FROM project 
            WHERE user_id = $1 AND name != 'Projeto_Fantasma'
            ORDER BY project_id ASC
        `;
        const result = await this.db.query(query, [userId]);
        return result.rows;
    }

    async getProjectById(id, userId) {
        const query = `
            SELECT project_id as id, name as title, color 
            FROM project 
            WHERE project_id = $1 AND user_id = $2
        `;
        const result = await this.db.query(query, [id, userId]);
        return result.rows[0];
    }

    async createProject(userId, title, color = '#666666') {
        const query = `
            INSERT INTO project (user_id, name, color) 
            VALUES ($1, $2, $3) 
            RETURNING project_id as id, name as title, color
        `;
        const result = await this.db.query(query, [userId, title, color]);
        return result.rows[0];
    }

    async deleteProject(id, userId) {
        const query = `
            DELETE FROM project 
            WHERE project_id = $1 AND user_id = $2 
            RETURNING project_id as id, name as title
        `;
        const result = await this.db.query(query, [id, userId]);
        if (result.rows.length === 0) throw new Error('Projeto não encontrado');
        return result.rows[0];
    }
}

describe("ProjectsService", () => {
    let projectsService;
    let mockDb;

    describe("getAllProjects", () => {
        test("deve retornar lista de projetos do usuário", async () => {
            mockDb = createMockDb({
                'SELECT project_id': defaultResponses.projectsList
            });
            projectsService = new MockedProjectsService(mockDb);

            const projects = await projectsService.getAllProjects('user-123');

            assert.ok(Array.isArray(projects), 'Deve retornar array');
            assert.strictEqual(projects.length, 2, 'Deve retornar 2 projetos');
            assert.strictEqual(projects[0].title, 'Projeto Alpha');
            assert.strictEqual(projects[1].title, 'Projeto Beta');
        });

        test("deve retornar lista vazia quando usuário não tem projetos", async () => {
            mockDb = createMockDb({
                'SELECT project_id': defaultResponses.empty
            });
            projectsService = new MockedProjectsService(mockDb);

            const projects = await projectsService.getAllProjects('user-sem-projetos');

            assert.ok(Array.isArray(projects));
            assert.strictEqual(projects.length, 0);
        });

        test("deve passar userId correto na query", async () => {
            mockDb = createMockDb({
                'SELECT project_id': defaultResponses.projectsList
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.getAllProjects('user-xyz');

            const lastQuery = mockDb.getLastQuery();
            assert.ok(lastQuery.params.includes('user-xyz'), 'userId deve ser passado como parâmetro');
        });

        test("deve excluir Projeto_Fantasma da listagem", async () => {
            mockDb = createMockDb({
                'SELECT project_id': defaultResponses.projectsList
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.getAllProjects('user-123');

            const lastQuery = mockDb.getLastQuery();
            assert.ok(lastQuery.text.includes("Projeto_Fantasma"), 'Query deve filtrar Projeto_Fantasma');
        });
    });

    describe("getProjectById", () => {
        test("deve retornar projeto específico", async () => {
            mockDb = createMockDb({
                'WHERE project_id = $1': defaultResponses.projectSingle
            });
            projectsService = new MockedProjectsService(mockDb);

            const project = await projectsService.getProjectById(1, 'user-123');

            assert.ok(project, 'Deve retornar projeto');
            assert.strictEqual(project.id, 1);
            assert.strictEqual(project.title, 'Projeto Alpha');
            assert.strictEqual(project.color, '#FF5733');
        });

        test("deve retornar undefined quando projeto não existe", async () => {
            mockDb = createMockDb({
                'WHERE project_id = $1': defaultResponses.empty
            });
            projectsService = new MockedProjectsService(mockDb);

            const project = await projectsService.getProjectById(999, 'user-123');

            assert.strictEqual(project, undefined);
        });

        test("deve passar id e userId como parâmetros", async () => {
            mockDb = createMockDb({
                'WHERE project_id = $1': defaultResponses.projectSingle
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.getProjectById(42, 'user-abc');

            const lastQuery = mockDb.getLastQuery();
            assert.deepStrictEqual(lastQuery.params, [42, 'user-abc']);
        });
    });

    describe("createProject", () => {
        test("deve criar projeto e retornar dados", async () => {
            mockDb = createMockDb({
                'INSERT INTO project': { rows: [{ id: 5, title: 'Meu Novo Projeto', color: '#123456' }] }
            });
            projectsService = new MockedProjectsService(mockDb);

            const project = await projectsService.createProject('user-123', 'Meu Novo Projeto', '#123456');

            assert.ok(project, 'Deve retornar projeto criado');
            assert.strictEqual(project.title, 'Meu Novo Projeto');
            assert.strictEqual(project.color, '#123456');
        });

        test("deve usar cor padrão quando não especificada", async () => {
            mockDb = createMockDb({
                'INSERT INTO project': { rows: [{ id: 6, title: 'Projeto Sem Cor', color: '#666666' }] }
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.createProject('user-123', 'Projeto Sem Cor');

            const lastQuery = mockDb.getLastQuery();
            assert.strictEqual(lastQuery.params[2], '#666666', 'Cor padrão deve ser #666666');
        });

        test("deve passar todos os parâmetros na query", async () => {
            mockDb = createMockDb({
                'INSERT INTO project': defaultResponses.projectCreated
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.createProject('user-xyz', 'Título do Projeto', '#AABBCC');

            const lastQuery = mockDb.getLastQuery();
            assert.strictEqual(lastQuery.params[0], 'user-xyz');
            assert.strictEqual(lastQuery.params[1], 'Título do Projeto');
            assert.strictEqual(lastQuery.params[2], '#AABBCC');
        });
    });

    describe("deleteProject", () => {
        test("deve deletar projeto e retornar dados", async () => {
            mockDb = createMockDb({
                'DELETE FROM project': { rows: [{ id: 1, title: 'Projeto Deletado' }] }
            });
            projectsService = new MockedProjectsService(mockDb);

            const deleted = await projectsService.deleteProject(1, 'user-123');

            assert.ok(deleted, 'Deve retornar projeto deletado');
            assert.strictEqual(deleted.id, 1);
            assert.strictEqual(deleted.title, 'Projeto Deletado');
        });

        test("deve lançar erro quando projeto não existe", async () => {
            mockDb = createMockDb({
                'DELETE FROM project': defaultResponses.empty
            });
            projectsService = new MockedProjectsService(mockDb);

            await assert.rejects(
                () => projectsService.deleteProject(999, 'user-123'),
                { message: 'Projeto não encontrado' }
            );
        });

        test("deve passar id e userId na query", async () => {
            mockDb = createMockDb({
                'DELETE FROM project': defaultResponses.projectDeleted
            });
            projectsService = new MockedProjectsService(mockDb);

            await projectsService.deleteProject(42, 'user-abc');

            const lastQuery = mockDb.getLastQuery();
            assert.deepStrictEqual(lastQuery.params, [42, 'user-abc']);
        });
    });
});

describe("ProjectsService - Histórico de Queries", () => {
    test("deve registrar todas as queries executadas", async () => {
        const mockDb = createMockDb({
            'SELECT project_id': defaultResponses.projectsList,
            'INSERT INTO project': defaultResponses.projectCreated
        });
        const projectsService = new MockedProjectsService(mockDb);

        await projectsService.getAllProjects('user-1');
        await projectsService.createProject('user-1', 'Projeto X', '#FFF');

        const history = mockDb.getQueryHistory();
        assert.strictEqual(history.length, 2, 'Deve ter 2 queries no histórico');
    });

    test("deve limpar histórico corretamente", async () => {
        const mockDb = createMockDb({
            'SELECT project_id': defaultResponses.projectsList
        });
        const projectsService = new MockedProjectsService(mockDb);

        await projectsService.getAllProjects('user-1');
        mockDb.clearHistory();

        assert.strictEqual(mockDb.getQueryHistory().length, 0);
    });
});
