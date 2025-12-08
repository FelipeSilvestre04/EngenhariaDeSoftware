import React, { useState, useEffect } from 'react';
import styles from './Kanban.module.css';
import getKanbanData from './kanban-data';

const API_URL = '/api/tasks';

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
      column: initialData.column || initialColumnKey,
    };

    onSubmit(data);
  };

  return (
    <div className={styles.taskFormOverlay}>
      <div className={styles.taskFormCard}>
        <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        <h4 className={styles.formTitle}>
          {isEditing ? `Editar Tarefa: ${initialData.title}` : `Nova Tarefa`}
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
// ===========================================
function TaskCard({ task, onDragStart, onDragEnd, onDelete, onEditStart }) {
  const handleCardClick = (e) => {
    if (e.target.closest(`.${styles.deleteBtn}`)) {
      return;
    }
    onEditStart(task);
  };

  return (
    <div
      className={styles.taskCard}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, task.column)}
      onDragEnd={onDragEnd}
      data-task-id={task.id}
      data-column={task.column}
    >
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
          {task.tags && task.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================== 
// Componente para a coluna Kanban
// ===========================================
function KanbanColumn({ title, tasks, columnKey, onDrop, onDragOver, onDragStart, onDragEnd, onShowForm, onDeleteTask, onEditStart }) {
  const statusClass = {
    'to-do': styles.todo,
    'in-progress': styles.inProgress,
    'done': styles.done,
  }[columnKey] || '';

  return (
      <div
        // 2. APLIQUE AS DUAS CLASSES: A padrão (.column) + a de status
        className={`${styles.column} ${statusClass}`} 
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
            onEditStart={onEditStart}
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
// ===========================================
export function KanbanBoard({ projectId }) {
  const numericProjectId = parseInt(projectId, 10);

  const [columns, setColumns] = useState({ 'to-do': [], 'in-progress': [], 'done': [] });
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [targetColumnForNewTask, setTargetColumnForNewTask] = useState('to-do');
  const [editingTask, setEditingTask] = useState(null);

  const columnTitles = [
    { key: 'to-do', title: 'A Fazer' },
    { key: 'in-progress', title: 'Em Andamento' },
    { key: 'done', title: 'Concluído' },
  ];

  // Busca tarefas da API
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}?projectId=${numericProjectId}`);

      if (!response.ok) {
        throw new Error('API falhou');
      }

      const tasks = await response.json();

      // Organiza tarefas por coluna
      const organized = {
        'to-do': tasks.filter(t => t.column === 'to-do'),
        'in-progress': tasks.filter(t => t.column === 'in-progress'),
        'done': tasks.filter(t => t.column === 'done'),
      };

      setColumns(organized);
      setUsingFallback(false);
      console.log('✅ Tarefas carregadas da API:', tasks.length);
    } catch (err) {
      // Fallback: usa dados locais
      const localData = getKanbanData(numericProjectId);
      setColumns(localData);
      setUsingFallback(true);
      console.warn('⚠️ Usando tarefas locais:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carrega tarefas ao montar e quando projectId muda
  useEffect(() => {
    fetchTasks();

    // Auto-refresh a cada 3 segundos
    const intervalId = setInterval(fetchTasks, 3000);

    return () => clearInterval(intervalId);
  }, [numericProjectId]);

  // Handlers
  const handleEditStart = (task) => {
    setEditingTask(task);
  };

  const handleEditTask = async (updatedTaskData) => {
    try {
      const payload = {
        projectId: numericProjectId,        
        currentColumn: editingTask.column,  
        ...updatedTaskData                  
      };

      const response = await fetch(`${API_URL}/${updatedTaskData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchTasks(); // Recarrega tarefas
      }
    } catch (err) {
      console.error('Erro ao editar tarefa:', err);
    }

    setEditingTask(null);
  };

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

  const handleDrop = async (e, targetColumnKey) => {
    e.preventDefault();

    const taskId = parseInt(e.dataTransfer.getData("taskId"), 10);
    const sourceColumnKey = e.dataTransfer.getData("sourceColumn");

    if (sourceColumnKey === targetColumnKey) return;

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
                column: targetColumnKey, // Para onde vai
                currentColumn: sourceColumnKey, // Onde estava (para achar no DB)
                projectId: numericProjectId
          })
      });

      if (response.ok) {
        await fetchTasks(); // Recarrega tarefas
      }
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
    }
  };

  const handleShowAddForm = (columnKey) => {
    setTargetColumnForNewTask(columnKey);
    setIsAddFormVisible(true);
  }

  const handleAddTask = async (newTaskData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: numericProjectId,
          ...newTaskData
        })
      });

      if (response.ok) {
        await fetchTasks(); // Recarrega tarefas
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
    }

    setIsAddFormVisible(false);
  }

  const handleDeleteTask = async (taskId, columnKey) => {
    if (!window.confirm("Tem certeza que deseja deletar esta tarefa?")) {
      return;
    }

    try {
      const params = new URLSearchParams({
            projectId: numericProjectId,
            currentColumn: columnKey
        });
      
      const response = await fetch(`${API_URL}/${taskId}?${params.toString()}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTasks(); // Recarrega tarefas
      }
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.kanbanBoard} style={{ textAlign: 'center', padding: '50px' }}>
        <p>Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className={styles.kanbanBoard}>
      {usingFallback && (
        <div style={{ textAlign: 'center', padding: '10px', background: '#fff3cd', marginBottom: '20px', borderRadius: '4px' }}>
          ⚠️ API offline - usando dados locais
        </div>
      )}

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
          onEditStart={handleEditStart}
        />
      ))}

      {isAddFormVisible && (
        <TaskForm
          onSubmit={handleAddTask}
          onCancel={() => setIsAddFormVisible(false)}
          initialColumnKey={targetColumnForNewTask}
          isEditing={false}
        />
      )}

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