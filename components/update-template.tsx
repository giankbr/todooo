import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function UpdateTemplate({ onSubmit }) {
  const [tasks, setTasks] = useState([{ description: '', completed: false }]);
  const [project, setProject] = useState('');

  const addTask = () => {
    setTasks([...tasks, { description: '', completed: false }]);
  };

  const updateTask = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      project,
      tasks: tasks.filter((task) => task.description.trim() !== ''),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-medium">Project Name</label>
        <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. CMS Krimum" required />
      </div>

      <div className="space-y-2">
        <label className="font-medium">Tasks</label>
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox checked={task.completed} onCheckedChange={(checked) => updateTask(index, 'completed', checked)} />
            <Input value={task.description} onChange={(e) => updateTask(index, 'description', e.target.value)} placeholder="Task description" className="flex-1" />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addTask}>
          Add Task
        </Button>
      </div>

      <Button type="submit">Submit Update</Button>
    </form>
  );
}
