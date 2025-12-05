# PATCH: Adicionar LLM Tools para Tarefas

## 1. Adicionar inicialização do tasksService no constructor

**Arquivo:** `src/modules/llm/services/LLMService.js`

**Localização:** Linha 13-14 (dentro do constructor)

**ANTES:**
```javascript
        this.projectService = new ProjectsService();
        this.tools = [];
```

**DEPOIS:**
```javascript
        this.projectService = new ProjectsService();
        this.tasksService = new TasksService();
        this.tools = [];
```

---

## 2. Adicionar 4 novos tools antes do this.tools.push

**Arquivo:** `src/modules/llm/services/LLMService.js`

**Localização:** Após `deleteProjectTool` (linha ~232), ANTES de `this.tools.push`

**ADICIONAR:**

```javascript
        // ========================================
        // TASKS TOOLS
        // ========================================

        const listTasksTool = tool(
            async ({ projectId }) => {
                try {
                    const tasks = this.tasksService.getTasksByProject(projectId);
                    
                    if (!tasks || tasks.length === 0) {
                        return `Nenhuma tarefa encontrada no projeto ${projectId}.`;
                    }

                    const formattedTasks = tasks.map((task, index) => {
                        const columnTitles = {
                            'to-do': 'A Fazer',
                            'in-progress': 'Em Andamento',
                            'done': 'Concluído'
                        };
                        return `${index + 1}. **${task.title}** (ID: ${task.id})
   Status: ${columnTitles[task.column] || task.column}
   Descrição: ${task.description || 'Sem descrição'}
   Tags: ${task.tags.join(', ') || 'Sem tags'}`;
                    }).join('\\n\\n');

                    return `Encontrei ${tasks.length} tarefa(s) no projeto ${projectId}:\\n\\n${formattedTasks}`;
                } catch (error) {
                    return `Erro ao listar tarefas: ${error.message}`;
                }
            },
            {
                name: "list_tasks",
                description: "Lista todas as tarefas de um projeto específico. Use quando o usuário quiser ver as tarefas de um projeto ou quadro kanban.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto para listar tarefas")
                }),
            }
        );

        const createTaskTool = tool(
            async ({ projectId, title, description, column, tags }) => {
                try {
                    const newTask = this.tasksService.createTask({
                        projectId,
                        title,
                        description: description || '',
                        column: column || 'to-do',
                        tags: tags || []
                    });
                    
                    const columnTitles = {
                        'to-do': 'A Fazer',
                        'in-progress': 'Em Andamento',
                        'done': 'Concluído'
                    };
                    
                    return `Tarefa criada com sucesso!
ID: ${newTask.id}
Título: "${newTask.title}"
Status: ${columnTitles[newTask.column]}
Projeto ID: ${projectId}`;
                } catch (error) {
                    return `Erro ao criar tarefa: ${error.message}`;
                }
            },
            {
                name: "create_task",
                description: "Cria uma nova tarefa em um projeto. Use quando o usuário pedir para adicionar, criar ou inserir uma tarefa no kanban.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto onde criar a tarefa"),
                    title: z.string().describe("Título da tarefa"),
                    description: z.string().optional().describe("Descrição detalhada da tarefa"),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("Coluna/status da tarefa. Padrão: 'to-do'"),
                    tags: z.array(z.string()).optional().describe("Array de tags da tarefa")
                }),
            }
        );

        const updateTaskTool = tool(
            async ({ taskId, title, description, column, tags }) => {
                try {
                    const updates = {};
                    if (title !== undefined) updates.title = title;
                    if (description !== undefined) updates.description = description;
                    if (column !== undefined) updates.column = column;
                    if (tags !== undefined) updates.tags = tags;

                    const updatedTask = this.tasksService.updateTask(taskId, updates);
                    
                    const columnTitles = {
                        'to-do': 'A Fazer',
                        'in-progress': 'Em Andamento',
                        'done': 'Concluído'
                    };
                    
                    return `Tarefa atualizada com sucesso!
ID: ${updatedTask.id}
Título: "${updatedTask.title}"
Status: ${columnTitles[updatedTask.column]}`;
                } catch (error) {
                    return `Erro ao atualizar tarefa: ${error.message}`;
                }
            },
            {
                name: "update_task",
                description: "Atualiza uma tarefa existente. Use para mover tarefas entre colunas (mudar status), editar título, descrição ou tags. IMPORTANTE: Use list_tasks primeiro para obter o ID correto.",
                schema: z.object({
                    taskId: z.number().describe("ID da tarefa a ser atualizada"),
                    title: z.string().optional().describe("Novo título (opcional)"),
                    description: z.string().optional().describe("Nova descrição (opcional)"),
                    column: z.enum(['to-do', 'in-progress', 'done']).optional().describe("Nova coluna/status (opcional)"),
                    tags: z.array(z.string()).optional().describe("Novas tags (opcional)")
                }),
            }
        );

        const deleteTaskTool = tool(
            async ({ taskId }) => {
                try {
                    const deletedTask = this.tasksService.deleteTask(taskId);
                    return `Tarefa "${deletedTask.title}" (ID: ${deletedTask.id}) deletada com sucesso!`;
                } catch (error) {
                    return `Erro ao deletar tarefa: ${error.message}`;
                }
            },
            {
                name: "delete_task",
                description: "Deleta uma tarefa do projeto. IMPORTANTE: Use list_tasks primeiro para obter o ID correto da tarefa.",
                schema: z.object({
                    taskId: z.number().describe("ID da tarefa a ser deletada")
                }),
            }
        );
```

---

## 3. Atualizar this.tools.push para incluir os novos tools

**ANTES:**
```javascript
        this.tools.push(
            getCalendarEventsTool,
            createEventTool,
            cancelEventTool,
            rescheduleEventTool,
            createProjectTool,
            listProjectsTool,
            deleteProjectTool
        );
```

**DEPOIS:**
```javascript
        this.tools.push(
            getCalendarEventsTool,
            createEventTool,
            cancelEventTool,
            rescheduleEventTool,
            createProjectTool,
            listProjectsTool,
            deleteProjectTool,
            listTasksTool,
            createTaskTool,
            updateTaskTool,
            deleteTaskTool
        );
```

---

## ✅ Após aplicar o patch

A LLM terá **11 tools** disponíveis:
- 4 tools de calendário (get, create, cancel, reschedule)
- 3 tools de projetos (create, list, delete)
- **4 tools de tarefas (list, create, update, delete)** ← NOVO!

Exemplos de uso:
- "Liste as tarefas do projeto 1"
- "Crie uma tarefa 'Implementar login' no projeto 1"
- "Mova a tarefa 5 para 'concluído'"
- "Delete a tarefa 3"
