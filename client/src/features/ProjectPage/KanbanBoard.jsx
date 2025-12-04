import React, { useState } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

// Componente para o card de tarefa
function TaskCard({ task }) {
  return (
    <div className={styles.taskCard}>
      <p className={styles.taskTitle}>{task.title}</p>
      <p className={styles.taskDescription}>{task.description}</p>
      <div className={styles.tagContainer}>
        {task.tags.map((tag, index) => (
          <span key={index} className={styles.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

// Componente para a coluna Kanban
function KanbanColumn({ title, tasks }) {
  const columnClass = {
    'A Fazer': styles.todo,
    'Em Andamento': styles.inProgress,
    'Concluído': styles.done,
  }[title] || styles.column;

  return (
    <div className={columnClass}>
      <h3 className={styles.columnTitle}>{title} ({tasks.length})</h3>
      <div className={styles.taskList}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {/* Adicionar um espaço visual para mais tarefas */}
        <div className={styles.taskCardPlaceholder}>+ Adicionar Tarefa</div>
      </div>
    </div>
  );
}

// Componente principal do Kanban
export function KanbanBoard({ projectId }) {
  // Converte a prop projectId para número para usar no getKanbanData
  const numericProjectId = parseInt(projectId, 10);
  const [columns, setColumns] = useState(getKanbanData(numericProjectId));

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  return (
    // Removido: <div className={styles.kanbanBoardContainer}>
    // Agora, o .kanbanBoard é o contêiner de nível superior do componente.
    <div className={styles.kanbanBoard}>
      {columnTitles.map(col => (
        <KanbanColumn
          key={col.key}
          title={col.title}
          tasks={columns[col.key] || []}
        />
      ))}
    </div>
    // Removido: </div>
  );
}