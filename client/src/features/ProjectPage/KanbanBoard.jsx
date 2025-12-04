import React, { useState } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

// Componente para o card de tarefa - Habilita arrasto
function TaskCard({ task, onDragStart, onDragEnd }) {
  return (
    <div 
      className={styles.taskCard}
      // Habilita o elemento para ser arrastável
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.column)}
      onDragEnd={onDragEnd}
      // Adicionado data-task-id e data-column para acessibilidade
      data-task-id={task.id}
      data-column={task.column}
    >
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

// Componente para a coluna Kanban - Define alvos de drop
function KanbanColumn({ title, tasks, columnKey, onDrop, onDragOver, onDragStart, onDragEnd }) {
  const columnClass = {
    'to-do': styles.todo,
    'in-progress': styles.inProgress,
    'done': styles.done,
  }[columnKey] || styles.column;

  return (
    <div 
      className={columnClass}
      // Permite que outros elementos sejam "arrastados por cima"
      onDragOver={(e) => onDragOver(e)} 
      // Recebe o drop
      onDrop={(e) => onDrop(e, columnKey)}
    >
      <h3 className={styles.columnTitle}>{title} ({tasks.length})</h3>
      <div className={styles.taskList}>
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {/* Adicionar um espaço visual para mais tarefas */}
        <div className={styles.taskCardPlaceholder}>+ Adicionar Tarefa</div>
      </div>
    </div>
  );
}

// Componente principal do Kanban
export function KanbanBoard({ projectId }) {
  const numericProjectId = parseInt(projectId, 10);
  // Usa o estado para gerenciar as tarefas, permitindo a mutação
  const [columns, setColumns] = useState(getKanbanData(numericProjectId));

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  // Handler para o início do arrasto
  const handleDragStart = (e, taskId, sourceColumn) => {
    // Armazena os dados no objeto de transferência de dados
    e.dataTransfer.setData("taskId", taskId.toString());
    e.dataTransfer.setData("sourceColumn", sourceColumn);
    
    // Adiciona classe para feedback visual (opacidade)
    e.currentTarget.classList.add(styles.dragging);
  };

  // Handler para o final do arrasto (limpeza)
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(styles.dragging);
  }

  // Handler para permitir o drop na coluna
  const handleDragOver = (e) => {
    e.preventDefault();
  }

  // Handler para o drop
  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault();

    const taskId = parseInt(e.dataTransfer.getData("taskId"), 10);
    const sourceColumnKey = e.dataTransfer.getData("sourceColumn");
    
    if (sourceColumnKey === targetColumnKey) return; // Evita drop na mesma coluna

    setColumns(prevColumns => {
      // Clonagem profunda para garantir que a mutação seja percebida pelo React
      const newColumns = JSON.parse(JSON.stringify(prevColumns));
      
      // 1. Encontra e remove a tarefa da coluna de origem
      const sourceTasks = newColumns[sourceColumnKey] || [];
      const taskIndex = sourceTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) return prevColumns;

      const [movedTask] = sourceTasks.splice(taskIndex, 1);
      
      // 2. Atualiza a propriedade 'column' da tarefa movida
      movedTask.column = targetColumnKey;
      
      // 3. Adiciona a tarefa à coluna de destino
      newColumns[targetColumnKey] = newColumns[targetColumnKey] || [];
      newColumns[targetColumnKey].push(movedTask);
      
      return newColumns;
    });
  };

  return (
    // Agora, o .kanbanBoard é o contêiner de nível superior do componente.
    <div className={styles.kanbanBoard}>
      {columnTitles.map(col => (
        <KanbanColumn
          key={col.key}
          title={col.title}
          tasks={columns[col.key] || []}
          columnKey={col.key} 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}