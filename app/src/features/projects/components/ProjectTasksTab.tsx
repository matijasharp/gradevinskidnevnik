import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { fetchProjectTasks, toggleProjectTask, deleteProjectTask, createProjectTask } from '../../../lib/data';
import type { ProjectTask } from '../../../lib/data';
import type { Project } from '../../../shared/types';
import { Button, Card } from '../../../shared/ui';
import { cn } from '../../../lib/utils';

export default function ProjectTasksTab({ project, currentUser, orgMembers = [], readonly = false, company }: {
  project: Project;
  currentUser: any;
  orgMembers: any[];
  readonly?: boolean;
  company: any;
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const brandColor = company?.brandColor || '#3b82f6';
  const isAdmin = currentUser?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const t = await fetchProjectTasks(project.id);
      setTasks(t);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleToggle = async (task: ProjectTask) => {
    try {
      await toggleProjectTask({ taskId: task.id, done: !task.done });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
    } catch { /* silent */ }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteProjectTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch { /* silent */ }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !currentUser) return;
    setSaving(true);
    try {
      const task = await createProjectTask({
        projectId: project.id,
        title: newTitle.trim(),
        assignedTo: newAssignedTo || undefined,
        createdBy: currentUser.id
      });
      setTasks(prev => [...prev, task]);
      setNewTitle('');
      setNewAssignedTo('');
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Task list */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Zadaci</h3>
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema zadataka.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <Card key={task.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggle(task)}
                    className="w-4 h-4 rounded border-zinc-300 cursor-pointer flex-shrink-0"
                    style={{ accentColor: brandColor }}
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", task.done && "line-through text-zinc-400")}>
                      {task.title}
                    </p>
                    {task.assignedToName && (
                      <p className="text-xs text-zinc-400">{task.assignedToName}</p>
                    )}
                  </div>
                </div>
                {!readonly && isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add task form — admin only, not readonly */}
      {!readonly && isAdmin && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj zadatak</h3>
          <Card className="space-y-3 p-4">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Novi zadatak..."
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <select
              value={newAssignedTo}
              onChange={e => setNewAssignedTo(e.target.value)}
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">Bez dodjele</option>
              {orgMembers.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || saving}
              style={{ backgroundColor: brandColor }}
              className="w-full text-white border-none"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
              Dodaj zadatak
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
