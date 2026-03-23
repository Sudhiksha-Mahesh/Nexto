export type Task = {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  energy: 'low' | 'medium' | 'high';
  estimated_time: number;
  tags: string[];
  status: 'todo' | 'doing' | 'done';
  created_at: number;
  /** Unix ms — bumped on every change; used for Supabase merge sync */
  updated_at: number;
  /** Unix ms — optional due date/time */
  deadline?: number;
  started_at?: number;
  completed_at?: number;
};

export type NewTaskInput = {
  title: string;
  priority: 'low' | 'medium' | 'high';
  energy: 'low' | 'medium' | 'high';
  estimated_time: number;
  tags: string[];
  deadline?: number;
};
