import React, { useState } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

// ===========================================
// Componente de Formulário para Adicionar Tarefa
// ===========================================
function AddTaskForm({ onAddTask, onCancel, initialColumnKey }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Converte a string de tags em um array (separado por vírgula ou espaço)
    const tags = tagsInput.split(/[,\s]+/).map(tag => tag.trim()).filter(tag => tag.length > 0);

    onAddTask({
      title,
      description,
      tags,
      column: initialColumnKey,
    });
    // Fecha o formulário
    onCancel();
  };

  return (
    <div className={styles.taskFormOverlay}>
        <div className={styles.taskFormCard}>
            <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
            <h4 className={styles.formTitle}>Nova Tarefa em: {initialColumnKey === 'to-do' ? 'A Fazer' : initialColumnKey}</h4>
            <form onSubmit={handleSubmit} className={styles.taskForm}>
                <label className={styles.formLabel}>
                    Título:
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className={styles.formInput}
                    />
                </label>
                <label className={styles.formLabel}>
                    Descrição:
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.formTextarea}
                    />
                </label>
                <label className={styles.formLabel}>
                    Tags (separadas por vírgula ou espaço):
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className={styles.formInput}
                    />
                </label>
                <button type="submit" className={styles.submitBtn}>Adicionar</button>
            </form>
        </div>
    </div>
  );
}

// ===========================================
// Componente para o card de tarefa
// ===========================================
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

// ===========================================
// Componente para a coluna Kanban
// ===========================================
function KanbanColumn({ title, tasks, columnKey, onDrop, onDragOver, onDragStart, onDragEnd, onShowForm }) {
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
        {/* Usamos onShowForm para abrir o modal de adição de tarefa */}
        <div 
            className={styles.taskCardPlaceholder} 
            onClick={() => onShowForm(columnKey)}
        >
            + Adicionar Tarefa
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Componente principal do Kanban
// ===========================================
export function KanbanBoard({ projectId }) {
  const numericProjectId = parseInt(projectId, 10);
  // Usa o estado para gerenciar as tarefas, permitindo a mutação
  const [columns, setColumns] = useState(getKanbanData(numericProjectId));
  
  // Novo estado para controlar a visibilidade do formulário de adição
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [targetColumnForNewTask, setTargetColumnForNewTask] = useState('to-do'); // Padrão 'to-do'

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  // ===========================================
  // Handlers D&D (Mantidos da implementação anterior)
  // ===========================================
  const handleDragStart = (e, taskId, sourceColumn) => {
    e.dataTransfer.setData("taskId", taskId.toString());
    e.dataTransfer.setData("sourceColumn", sourceColumn);
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(styles.dragging);
  }

  const handleDragOver = (e) => {
    e.preventDefault();
  }

  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault();

    const taskId = parseInt(e.dataTransfer.getData("taskId"), 10);
    const sourceColumnKey = e.dataTransfer.getData("sourceColumn");
    
    if (sourceColumnKey === targetColumnKey) return;

    setColumns(prevColumns => {
      const newColumns = JSON.parse(JSON.stringify(prevColumns));
      
      const sourceTasks = newColumns[sourceColumnKey] || [];
      const taskIndex = sourceTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) return prevColumns;

      const [movedTask] = sourceTasks.splice(taskIndex, 1);
      
      movedTask.column = targetColumnKey;
      
      newColumns[targetColumnKey] = newColumns[targetColumnKey] || [];
      newColumns[targetColumnKey].push(movedTask);
      
      return newColumns;
    });
  };

  // ===========================================
  // Handlers de Adição de Tarefa (Novos)
  // ===========================================
  
  // Função para abrir o formulário
  const handleShowForm = (columnKey) => {
    setTargetColumnForNewTask(columnKey);
    setIsFormVisible(true);
  }

  // Função para adicionar a nova tarefa ao estado
  const handleAddTask = (newTaskData) => {
    setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        
        // Encontra o maior ID atual (simulando um auto-incremento)
        // Isso é crucial para evitar duplicatas de chaves no React (key={task.id})
        let maxId = 0;
        Object.keys(newColumns).forEach(colKey => {
            newColumns[colKey].forEach(task => {
                if (task.id > maxId) {
                    maxId = task.id;
                }
            });
        });

        const newId = maxId + 1;
        
        const newTask = {
            id: newId,
            projectId: numericProjectId,
            title: newTaskData.title,
            description: newTaskData.description,
            column: newTaskData.column,
            tags: newTaskData.tags,
        };

        // Adiciona a nova tarefa na coluna correta
        newColumns[newTask.column] = [...(newColumns[newTask.column] || []), newTask];
        
        return newColumns;
    });
  }

  return (
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
          onShowForm={handleShowForm} // Passa o handler para mostrar o form
        />
      ))}
      
      {/* Renderiza o formulário de adição se estiver visível */}
      {isFormVisible && (
        <AddTaskForm
          onAddTask={handleAddTask}
          onCancel={() => setIsFormVisible(false)}
          initialColumnKey={targetColumnForNewTask}
        />
      )}
    </div>
  );
}