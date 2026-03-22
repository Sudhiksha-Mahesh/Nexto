<script lang="ts">
  import { onMount } from 'svelte';
  import { taskStore } from '../store/tasks';
  import TaskForm from './components/TaskForm.svelte';
  import TaskList from './components/TaskList.svelte';
  import ActiveTask from './components/ActiveTask.svelte';

  onMount(() => {
    void taskStore.hydrate();
  });
</script>

<div class="w-full p-4">
  <header class="mb-3 border-b border-slate-200 pb-3">
    <h1 class="text-lg font-semibold tracking-tight text-slate-900">Nexto</h1>
    <p class="text-xs text-slate-500">Order, without effort.</p>
  </header>

  <TaskForm />

  <TaskList />

  <ActiveTask />
</div>
