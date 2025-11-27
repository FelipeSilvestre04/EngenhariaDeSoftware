import React, { useEffect, useState } from 'react';
import styles from './KanbanBoard.module.css';

function sampleTasksForProject(project) {
  const base = project && project.id ? project.id : 0;
  return [
    { id: `t-${base}-1`, title: 'Planejar requisitos', status: 'todo' },
    { id: `t-${base}-2`, title: 'Criar protótipo', status: 'doing' },
    { id: `t-${base}-3`, title: 'Revisão final', status: 'done' },
  ];
}

export default function KanbanBoard({ project, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (project) setTasks(sampleTasksForProject(project));
    else setTasks([]);
  }, [project]);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task = { id: `t-${Date.now()}`, title: newTitle.trim(), status: 'todo' };
    setTasks(t => [task, ...t]);
    setNewTitle('');
  };

  const moveTask = (id, toStatus) => {
    setTasks(t => t.map(x => x.id === id ? { ...x, status: toStatus } : x));
  };

  const deleteTask = (id) => setTasks(t => t.filter(x => x.id !== id));

  const columns = [
    { key: 'todo', title: 'A Fazer' },
    { key: 'doing', title: 'Desenvolvendo' },
    { key: 'done', title: 'Feito' },
  ];

  return (
    <div className={styles.board}>
      <div className={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {onClose && (
            <button className={styles.backBtn} onClick={() => onClose()} aria-label="Voltar ao chat">←</button>
          )}
          <h2>{project ? project.title : 'Quadro Kanban'}</h2>
        </div>

        <div className={styles.addTaskRow}>
          <input
            placeholder="Nova tarefa..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
          />
          <button onClick={addTask}>Adicionar</button>
        </div>
      </div>

      <div className={styles.columns}>
        {columns.map(col => (
          <div key={col.key} className={styles.column}>
            <div className={styles.colHeader}>{col.title}</div>
            <div className={styles.colBody}>
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id} className={styles.card}>
                  <div className={styles.cardTitle}>{task.title}</div>
                  <div className={styles.cardActions}>
                    {col.key !== 'todo' && (
                      <button onClick={() => moveTask(task.id, col.key === 'doing' ? 'todo' : 'doing')}>{'←'}</button>
                    )}
                    {col.key !== 'done' && (
                      <button onClick={() => moveTask(task.id, col.key === 'todo' ? 'doing' : 'done')}>{'→'}</button>
                    )}
                    <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
