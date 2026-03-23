<script lang="ts">
  import { theme, toggleTheme } from '../lib/theme';
</script>

<main class="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
  <div class="mx-auto max-w-lg">
    <header class="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Nexto — Options</h1>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure Nexto here as features land (Supabase sync, defaults, shortcuts).
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={$theme === 'dark' ? 'Light mode' : 'Dark mode'}
        on:click={() => void toggleTheme()}
      >
        {#if $theme === 'dark'}
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        {:else}
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        {/if}
      </button>
    </header>
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Theme is saved in extension storage and shared with the popup.
    </p>
  </div>
</main>
