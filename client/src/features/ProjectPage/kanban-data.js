const initialTasks = [
  { id: 1, projectId: 1, title: 'Definir arquitetura mobile', description: 'Escolher entre React Native e Flutter.', column: 'to-do', tags: ['Backend'] },
  { id: 2, projectId: 1, title: 'Design da tela de Login', description: 'Criar mockups de alta fidelidade.', column: 'in-progress', tags: ['Design'] },
  { id: 3, projectId: 2, title: 'Análise de concorrência', description: 'Analisar 3 principais concorrentes no mercado QA.', column: 'done', tags: ['Marketing'] },
  { id: 4, projectId: 2, title: 'Definir público-alvo', description: 'Segmentação demográfica e comportamental.', column: 'to-do', tags: ['Marketing'] },
  { id: 5, projectId: 3, title: 'Configurar ambiente de dev', description: 'Instalar Node, npm e configurar o Vite.', column: 'in-progress', tags: ['Frontend'] },
  { id: 6, projectId: 3, title: 'Criar serviço de projetos (Backend)', description: 'Implementar CRUD básico para projetos.', column: 'done', tags: ['Backend'] },
  { id: 7, projectId: 1, title: 'Criar feature de chat com LLM', description: 'Integrar a LangChain com o modelo Groq.', column: 'to-do', tags: ['IA', 'Backend'] },
  { id: 8, projectId: 1, title: 'Implementar autenticação Google', description: 'Fluxo OAuth2 para Google Calendar.', column: 'in-progress', tags: ['Auth'] },
];

// Mapeamento das colunas por ID do projeto
const kanbanData = initialTasks.reduce((acc, task) => {
  const { projectId } = task;
  if (!acc[projectId]) {
    acc[projectId] = {
      'to-do': [],
      'in-progress': [],
      'done': [],
    };
  }
  acc[projectId][task.column].push(task);
  return acc;
}, {});

// Exportar os dados para um projeto específico
const getKanbanData = (projectId) => {
  return kanbanData[projectId] || {
    'to-do': [{ id: 1, title: 'Exemplo de Tarefa', description: 'Comece seu projeto aqui!', column: 'to-do', tags: ['Inicio'] }],
    'in-progress': [],
    'done': [],
  };
};

export default getKanbanData;