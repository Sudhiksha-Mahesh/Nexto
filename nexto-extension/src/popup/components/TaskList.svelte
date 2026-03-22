<script lang="ts">
  import type { Task } from '../../types/task';
  import { taskStore } from '../../store/tasks';
  import TaskItem from './TaskItem.svelte';

  function openTasks(tasks: Task[]): Task[] {
    return tasks
      .filter((t) => t.status !== 'done')
      .slice()
      .sort((a, b) => b.created_at - a.created_at);
  }

  $: list = openTasks($taskStore.tasks);
</script>

<section class="mt-3">
  <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks</h2>

  {#if list.length === 0}
    <p class="rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-4 text-center text-xs text-slate-500">
      No open tasks. Add one above.
    </p>
  {:else}
    <ul class="flex flex-col gap-2">
      {#each list as task (task.id)}
        <li>
          <TaskItem {task} />
        </li>
      {/each}
    </ul>
  {/if}
</section>
