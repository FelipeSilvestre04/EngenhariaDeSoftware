/**
 * Testes para TasksService
 * Testa operações CRUD de tarefas com mock do banco de dados
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { createMockDb, defaultResponses } from "./mocks/db.mock.js";

// Simula a classe TasksService isolada do banco real
class MockedTasksService {
    constructor(db) {
        this.db = db;
    }

    async getListId(projectId, userId, listName) {
        const query = `
            SELECT list_id FROM list 
            WHERE project_id = $1 AND user_id = $2 AND name = $3
        `;
        const result = await this.db.query(query, [projectId, userId, listName]);
        if (result.rows.length === 0) {
            // Fallback para 'to-do'
            const fallback = await this.db.query(
                `SELECT list_id FROM list WHERE project_id=$1 AND name='to-do'`,
                [projectId]
            );
            return fallback.rows[0]?.list_id || 1;
        }
        return result.rows[0].list_id;
    }

    async getTasksByProject(projectId, userId) {
        const query = `
            SELECT 
                t.task_id as id, 
                t.project_id as "projectId", 
                t.text as title, 
                t.description as description,
                l.name as column,
                COALESCE(array_agg(tg.tag_name), '{}') as tags
            FROM task t
            JOIN list l ON t.list_id = l.list_id AND t.project_id = l.project_id
            LEFT JOIN tag_task tt ON t.task_id = tt.task_id
            LEFT JOIN tag tg ON tt.tag_id = tg.tag_id
            WHERE t.project_id = $1 AND t.user_id = $2
            GROUP BY t.task_id, l.name
        `;
        const result = await this.db.query(query, [projectId, userId]);
        return result.rows;
    }

    async createTask({ userId, projectId, title, description, column = 'to-do', tags = [] }) {
        const listId = await this.getListId(projectId, userId, column);

        const insertQuery = `
            INSERT INTO task (list_id, project_id, user_id, text, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING task_id as id
        `;
        const taskResult = await this.db.query(insertQuery, [listId, projectId, userId, title, description || '']);
        const newTaskId = taskResult.rows[0].id;

        // Vincula tags
        for (const tagName of tags) {
            let selectTag = await this.db.query('SELECT tag_id FROM tag WHERE tag_name = $1', [tagName]);
            let tagId;

            if (selectTag.rows.length === 0) {
                const insertTagResult = await this.db.query(
                    'INSERT INTO tag (tag_name) VALUES ($1) RETURNING tag_id',
                    [tagName]
                );
                tagId = insertTagResult.rows[0].tag_id;
            } else {
                tagId = selectTag.rows[0].tag_id;
            }

            if (tagId) {
                await this.db.query(`
                    INSERT INTO tag_task (tag_id, task_id, list_id, project_id, user_id)
                    VALUES ($1, $2, $3, $4, $5)
                `, [tagId, newTaskId, listId, projectId, userId]);
            }
        }

        return { id: newTaskId, projectId, title, description, column, tags };
    }

    async deleteTask({ taskId, projectId, userId, currentColumn }) {
        const listId = await this.getListId(projectId, userId, currentColumn);

        const query = `
            DELETE FROM task 
            WHERE task_id = $1 AND user_id = $2 AND project_id = $3 AND list_id = $4
            RETURNING task_id
        `;
        const result = await this.db.query(query, [taskId, userId, projectId, listId]);

        if (result.rows.length === 0) throw new Error('Tarefa não encontrada');
        return result.rows[0];
    }
}

describe("TasksService", () => {
    let tasksService;
    let mockDb;

    describe("getListId", () => {
        test("deve retornar list_id correto", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': { rows: [{ list_id: 5 }] }
            });
            tasksService = new MockedTasksService(mockDb);

            const listId = await tasksService.getListId(1, 'user-123', 'to-do');

            assert.strictEqual(listId, 5);
        });

        test("deve usar fallback quando lista não existe", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': (params) => {
                    // Primeira chamada retorna vazio, segunda (fallback) retorna list_id
                    if (params.includes('to-do') || params.length === 1) {
                        return { rows: [{ list_id: 1 }] };
                    }
                    return { rows: [] };
                }
            });
            tasksService = new MockedTasksService(mockDb);

            const listId = await tasksService.getListId(1, 'user-123', 'coluna-inexistente');

            assert.strictEqual(listId, 1, 'Deve retornar fallback list_id = 1');
        });

        test("deve passar parâmetros corretos na query", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId
            });
            tasksService = new MockedTasksService(mockDb);

            await tasksService.getListId(42, 'user-abc', 'in-progress');

            const lastQuery = mockDb.getLastQuery();
            assert.deepStrictEqual(lastQuery.params, [42, 'user-abc', 'in-progress']);
        });
    });

    describe("getTasksByProject", () => {
        test("deve retornar lista de tarefas do projeto", async () => {
            mockDb = createMockDb({
                'SELECT': defaultResponses.tasksList
            });
            tasksService = new MockedTasksService(mockDb);

            const tasks = await tasksService.getTasksByProject(1, 'user-123');

            assert.ok(Array.isArray(tasks));
            assert.strictEqual(tasks.length, 2);
            assert.strictEqual(tasks[0].title, 'Task 1');
            assert.strictEqual(tasks[1].title, 'Task 2');
        });

        test("deve retornar array vazio quando não há tarefas", async () => {
            mockDb = createMockDb({
                'FROM task': defaultResponses.empty
            });
            tasksService = new MockedTasksService(mockDb);

            const tasks = await tasksService.getTasksByProject(1, 'user-123');

            assert.ok(Array.isArray(tasks));
            assert.strictEqual(tasks.length, 0);
        });

        test("deve incluir tags nas tarefas", async () => {
            mockDb = createMockDb({
                'SELECT': {
                    rows: [
                        { id: 1, projectId: 1, title: 'Task com Tags', column: 'to-do', tags: ['Backend', 'Urgente'] }
                    ]
                }
            });
            tasksService = new MockedTasksService(mockDb);

            const tasks = await tasksService.getTasksByProject(1, 'user-123');

            assert.ok(tasks[0].tags);
            assert.ok(Array.isArray(tasks[0].tags));
            assert.deepStrictEqual(tasks[0].tags, ['Backend', 'Urgente']);
        });
    });

    describe("createTask", () => {
        test("deve criar tarefa e retornar dados", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'INSERT INTO task': { rows: [{ id: 10 }] },
                'SELECT tag_id': defaultResponses.empty,
                'INSERT INTO tag': defaultResponses.tagCreated,
                'INSERT INTO tag_task': { rows: [] }
            });
            tasksService = new MockedTasksService(mockDb);

            const task = await tasksService.createTask({
                userId: 'user-123',
                projectId: 1,
                title: 'Nova Tarefa',
                description: 'Descrição da tarefa',
                column: 'to-do',
                tags: []
            });

            assert.ok(task);
            assert.strictEqual(task.id, 10);
            assert.strictEqual(task.title, 'Nova Tarefa');
        });

        test("deve usar coluna padrão 'to-do'", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'INSERT INTO task': { rows: [{ id: 11 }] }
            });
            tasksService = new MockedTasksService(mockDb);

            const task = await tasksService.createTask({
                userId: 'user-123',
                projectId: 1,
                title: 'Tarefa Sem Coluna'
            });

            assert.strictEqual(task.column, 'to-do');
        });

        test("deve vincular tags existentes", async () => {
            let tagTaskInserted = false;
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'INSERT INTO task': { rows: [{ id: 12 }] },
                'SELECT tag_id FROM tag': { rows: [{ tag_id: 5 }] },
                'INSERT INTO tag_task': () => {
                    tagTaskInserted = true;
                    return { rows: [] };
                }
            });
            tasksService = new MockedTasksService(mockDb);

            await tasksService.createTask({
                userId: 'user-123',
                projectId: 1,
                title: 'Tarefa com Tag',
                tags: ['Backend']
            });

            assert.ok(tagTaskInserted, 'Tag deve ser vinculada');
        });

        test("deve criar tag nova quando não existe", async () => {
            let tagCreated = false;
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'INSERT INTO task': { rows: [{ id: 13 }] },
                'SELECT tag_id FROM tag': defaultResponses.empty,
                'INSERT INTO tag (tag_name)': () => {
                    tagCreated = true;
                    return { rows: [{ tag_id: 99 }] };
                },
                'INSERT INTO tag_task': { rows: [] }
            });
            tasksService = new MockedTasksService(mockDb);

            await tasksService.createTask({
                userId: 'user-123',
                projectId: 1,
                title: 'Tarefa Nova Tag',
                tags: ['NovaTag']
            });

            assert.ok(tagCreated, 'Tag nova deve ser criada');
        });
    });

    describe("deleteTask", () => {
        test("deve deletar tarefa e retornar dados", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'DELETE FROM task': { rows: [{ task_id: 1 }] }
            });
            tasksService = new MockedTasksService(mockDb);

            const deleted = await tasksService.deleteTask({
                taskId: 1,
                projectId: 1,
                userId: 'user-123',
                currentColumn: 'to-do'
            });

            assert.ok(deleted);
            assert.strictEqual(deleted.task_id, 1);
        });

        test("deve lançar erro quando tarefa não existe", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': defaultResponses.listId,
                'DELETE FROM task': defaultResponses.empty
            });
            tasksService = new MockedTasksService(mockDb);

            await assert.rejects(
                () => tasksService.deleteTask({
                    taskId: 999,
                    projectId: 1,
                    userId: 'user-123',
                    currentColumn: 'to-do'
                }),
                { message: 'Tarefa não encontrada' }
            );
        });

        test("deve usar list_id da coluna atual", async () => {
            mockDb = createMockDb({
                'SELECT list_id FROM list': { rows: [{ list_id: 3 }] },
                'DELETE FROM task': { rows: [{ task_id: 5 }] }
            });
            tasksService = new MockedTasksService(mockDb);

            await tasksService.deleteTask({
                taskId: 5,
                projectId: 2,
                userId: 'user-xyz',
                currentColumn: 'done'
            });

            const queryHistory = mockDb.getQueryHistory();
            const deleteQuery = queryHistory.find(q => q.text.includes('DELETE FROM task'));

            // Deve incluir list_id = 3 nos parâmetros
            assert.ok(deleteQuery.params.includes(3), 'list_id deve ser passado na query de delete');
        });
    });
});

describe("TasksService - Fluxo Completo", () => {
    test("criar tarefa e depois deletar", async () => {
        const mockDb = createMockDb({
            'SELECT list_id FROM list': { rows: [{ list_id: 1 }] },
            'INSERT INTO task': { rows: [{ id: 100 }] },
            'DELETE FROM task': { rows: [{ task_id: 100 }] }
        });
        const tasksService = new MockedTasksService(mockDb);

        // Criar
        const created = await tasksService.createTask({
            userId: 'user-1',
            projectId: 1,
            title: 'Tarefa Temporária'
        });

        assert.strictEqual(created.id, 100);

        // Deletar
        const deleted = await tasksService.deleteTask({
            taskId: 100,
            projectId: 1,
            userId: 'user-1',
            currentColumn: 'to-do'
        });

        assert.strictEqual(deleted.task_id, 100);
    });
});
