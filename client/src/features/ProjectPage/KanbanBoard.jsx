import React, { useState, useEffect } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

// ===========================================
// Componente de Formulário (Base para Adicionar e Editar)
// ===========================================
function TaskForm({ onSubmit, onCancel, initialData = {}, isEditing = false, initialColumnKey = 'to-do' }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [tagsInput, setTagsInput] = useState(initialData.tags ? initialData.tags.join(', ') : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput.split(/[,\s]+/).map(tag => tag.trim()).filter(tag => tag.length > 0);

    const data = {
      id: initialData.id,
      title,
      description,
      tags,
      // Mantém a coluna original ao editar
      column: initialData.column || initialColumnKey,
    };

    onSubmit(data);
  };

  return (
    <div className={styles.taskFormOverlay}>
      <div className={styles.taskFormCard}>
        <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        <h4 className={styles.formTitle}>
          {isEditing ? `Editar Tarefa: ${initialData.title}` : `Nova Tarefa em: ${initialColumnKey === 'to-do' ? 'A Fazer' : initialColumnKey}`}
        </h4>
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
          <button type="submit" className={styles.submitBtn}>
            {isEditing ? 'Salvar Alterações' : 'Adicionar Tarefa'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// Componente para o card de tarefa
// Habilita a edição e mantém o delete
// ===========================================
function TaskCard({ task, onDragStart, onDragEnd, onDelete, onEditStart }) {

  // Previne a propagação do clique ao arrastar ou clicar no delete
  const handleCardClick = (e) => {
    // Evita abrir o modal se o delete for clicado
    if (e.target.closest(`.${styles.deleteBtn}`)) {
      return;
    }
    onEditStart(task);
  };

  return (
    <div
      className={styles.taskCard}
      // Removido o evento onClick do div principal para o clique ir para o handleCardClick
      // O draggable já está definido aqui
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.column)}
      onDragEnd={onDragEnd}
      data-task-id={task.id}
      data-column={task.column}
    >
      {/* Usamos onMouseDown/onMouseUp para capturar o clique do card, permitindo a edição,
        mas o D&D usa onDragStart/onDragEnd que tem prioridade. */}
      <div className={styles.cardEditableContent} onClick={handleCardClick}>
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
    </div>
  );
}

// ===========================================
// Componente para a coluna Kanban
// Passa o handler de start edit
// ===========================================
function KanbanColumn({ title, tasks, columnKey, onDrop, onDragOver, onDragStart, onDragEnd, onShowForm, onDeleteTask, onEditStart }) {
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
            onDelete={onDeleteTask}
            onEditStart={onEditStart} // Novo handler para iniciar a edição
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
// Adiciona lógica de edição
// ===========================================
export function KanbanBoard({ projectId }) {
  const numericProjectId = parseInt(projectId, 10);
  const [columns, setColumns] = useState(getKanbanData(numericProjectId));

  // Controle do Formulário de Adição
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [targetColumnForNewTask, setTargetColumnForNewTask] = useState('to-do');

  // NOVO: Controle da Tarefa de Edição
  const [editingTask, setEditingTask] = useState(null); // Armazena o objeto da tarefa sendo editada

  // Recarrega os dados do kanban quando o projectId mudar
  useEffect(() => {
    setColumns(getKanbanData(numericProjectId));
  }, [numericProjectId]);

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  // ===========================================
  // Lógica de Edição (Novo)
  // ===========================================

  // Inicia a edição
  const handleEditStart = (task) => {
    setEditingTask(task);
  };

  // Salva as alterações
  const handleEditTask = (updatedTaskData) => {
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const columnKey = updatedTaskData.column;

      const columnTasks = newColumns[columnKey] || [];

      const taskIndex = columnTasks.findIndex(task => task.id === updatedTaskData.id);

      if (taskIndex !== -1) {
        // Atualiza a tarefa com os novos dados
        columnTasks[taskIndex] = {
          ...columnTasks[taskIndex],
          ...updatedTaskData,
        };
      }

      return newColumns;
    });
    setEditingTask(null); // Fecha o modal de edição
  };


  // ===========================================
  // Handlers D&D (Mantidos)
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
  // Handlers Adição/Exclusão (Adaptados)
  // ===========================================
  const handleShowAddForm = (columnKey) => {
    setTargetColumnForNewTask(columnKey);
    setIsAddFormVisible(true);
  }

  const handleAddTask = (newTaskData) => {

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
    setIsAddFormVisible(false);
  }


  const handleDeleteTask = (taskId, columnKey) => {
    if (!window.confirm("Tem certeza que deseja deletar esta tarefa?")) {
      return;
    }

    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const columnTasks = newColumns[columnKey] || [];

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
          onShowForm={handleShowAddForm}
          onDeleteTask={handleDeleteTask}
          onEditStart={handleEditStart} // Passando o novo handler
        />
      ))}

      {/* Renderiza o Formulário de Adição */}
      {isAddFormVisible && (
        <TaskForm
          onSubmit={handleAddTask}
          onCancel={() => setIsAddFormVisible(false)}
          initialColumnKey={targetColumnForNewTask}
          isEditing={false}
        />
      )}

      {/* NOVO: Renderiza o Formulário de Edição */}
      {editingTask && (
        <TaskForm
          onSubmit={handleEditTask}
          onCancel={() => setEditingTask(null)}
          initialData={editingTask}
          isEditing={true}
        />
      )}
    </div>
  );
}