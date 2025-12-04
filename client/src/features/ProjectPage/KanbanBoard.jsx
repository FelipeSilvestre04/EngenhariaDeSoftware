import React, { useState } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

// ===========================================
// Componente de Formulário para Adicionar Tarefa
// Mantido inalterado
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
// Adiciona botão de delete
// ===========================================
function TaskCard({ task, onDragStart, onDragEnd, onDelete }) {
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
        <div className={styles.cardHeader}>
            <p className={styles.taskTitle}>{task.title}</p>
            <button 
                className={styles.deleteBtn} 
                onClick={() => onDelete(task.id, task.column)}
                aria-label="Deletar tarefa"
            >
                &times;
            </button>
        </div>
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
// Passa o handler de delete
// ===========================================
function KanbanColumn({ title, tasks, columnKey, onDrop, onDragOver, onDragStart, onDragEnd, onShowForm, onDeleteTask }) {
  const columnClass = {
    'to-do': styles.todo,
    'in-progress': styles.inProgress,
    'done': styles.done,
  }[columnKey] || styles.column;

  return (
    <div 
      className={columnClass}
      onDragOver={(e) => onDragOver(e)} 
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
            onDelete={onDeleteTask} // Novo handler de delete
          />
        ))}
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
// Adiciona a função handleDeleteTask
// ===========================================
export function KanbanBoard({ projectId }) {
  const numericProjectId = parseInt(projectId, 10);
  const [columns, setColumns] = useState(getKanbanData(numericProjectId));
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [targetColumnForNewTask, setTargetColumnForNewTask] = useState('to-do'); 

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  // ... (handleDragStart, handleDragEnd, handleDragOver, handleDrop - Mantidos inalterados)
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

  const handleShowForm = (columnKey) => {
    setTargetColumnForNewTask(columnKey);
    setIsFormVisible(true);
  }

  // Função para adicionar a nova tarefa (agora async)
  const handleAddTask = (newTaskData) => {
    
    // Simulação: Encontrar o maior ID e criar um novo
    setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        
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

        newColumns[newTask.column] = [...(newColumns[newTask.column] || []), newTask];
        
        return newColumns;
    });
  }


  // ===========================================
  // NOVO: Handler para Deletar Tarefa
  // ===========================================
  const handleDeleteTask = (taskId, columnKey) => {
      if (!window.confirm("Tem certeza que deseja deletar esta tarefa?")) {
          return;
      }

      setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          const columnTasks = newColumns[columnKey] || [];
          
          // Filtra a lista para remover a tarefa com o ID correspondente
          newColumns[columnKey] = columnTasks.filter(task => task.id !== taskId);
          
          return newColumns;
      });
  };


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
          onShowForm={handleShowForm} 
          onDeleteTask={handleDeleteTask} // Passa o novo handler de delete
        />
      ))}
      
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