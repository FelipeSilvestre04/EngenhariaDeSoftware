# PATCH: Adicionar Tools de Gerenciamento de Projetos
# Arquivo: src/modules/llm/services/LLMService.js

## MUDANÇA 1: Atualizar createProjectTool (linha 122-135)

### ANTES:
```javascript
        const createProjectTool = tool(
            async ({ projectName }) => {
                // Simula a criação de um projeto
                const newProject = await this.projectService.createProject(projectName);
                return `Projeto criado com sucesso: ID ${newProject.id}, Nome: ${newProject.title}`;
            },
            {
                name: "create_project",
                description: "Cria um novo projeto com o nome fornecido.",
                schema: z.object({
                    projectName: z.string().describe("Nome do projeto a ser criado")
                }),
            }
        );
```

### DEPOIS:
```javascript
        const createProjectTool = tool(
            async ({ title, color }) => {
                try {
                    const newProject = this.projectService.createProject(title, color);
                    return `Projeto criado com sucesso! ID: ${newProject.id}, Nome: "${newProject.title}", Cor: ${newProject.color}`;
                } catch (error) {
                    return `Erro ao criar projeto: ${error.message}`;
                }
            },
            {
                name: "create_project",
                description: "Cria um novo projeto. Use quando o usuário pedir para criar um novo projeto ou quadro kanban.",
                schema: z.object({
                    title: z.string().describe("Nome/título do projeto"),
                    color: z.string().optional().describe("Cor do projeto em formato hex (ex: #FF5733). Opcional, padrão é #666666")
                }),
            }
        );

        const listProjectsTool = tool(
            async () => {
                try {
                    const projects = this.projectService.getAllProjects();
                    
                    if (!projects || projects.length === 0) {
                        return "Nenhum projeto encontrado.";
                    }

                    const formattedProjects = projects.map((project, index) => {
                        return `${index + 1}. **${project.title}** (ID: ${project.id}) - Cor: ${project.color}`;
                    }).join('\\n');

                    return `Encontrei ${projects.length} projeto(s):\\n\\n${formattedProjects}`;
                } catch (error) {
                    return `Erro ao listar projetos: ${error.message}`;
                }
            },
            {
                name: "list_projects",
                description: "Lista todos os projetos disponíveis com seus IDs, nomes e cores. Use quando o usuário quiser ver quais projetos existem.",
                schema: z.object({}),
            }
        );

        const deleteProjectTool = tool(
            async ({ projectId }) => {
                try {
                    const deletedProject = this.projectService.deleteProject(projectId);
                    return `Projeto "${deletedProject.title}" (ID: ${deletedProject.id}) deletado com sucesso!`;
                } catch (error) {
                    return `Erro ao deletar projeto: ${error.message}`;
                }
            },
            {
                name: "delete_project",
                description: "Deleta um projeto existente pelo ID. IMPORTANTE: Liste os projetos primeiro para obter o ID correto.",
                schema: z.object({
                    projectId: z.number().describe("ID do projeto a ser deletado (obtido através do list_projects)")
                }),
            }
        );
```

## MUDANÇA 2: Atualizar this.tools.push (linha 187)

### ANTES:
```javascript
        this.tools.push(getCalendarEventsTool, createEventTool, cancelEventTool, rescheduleEventTool, createProjectTool);
```

### DEPOIS:
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

## RESUMO DAS MUDANÇAS:
1. Corrigido createProjectTool para usar `title` ao invés de `projectName` e adicionar suporte para `color`
2. Adicionado listProjectsTool - lista todos os projetos
3. Adicionado deleteProjectTool - deleta um projeto por ID
4. Atualizado tools.push para incluir os novos tools

## NOVOS TOOLS DISPONÍVEIS:
- `create_project`: Cria um novo projeto (já existia, mas corrigido)
- `list_projects`: Lista todos os projetos com IDs
- `delete_project`: Deleta um projeto pelo ID
