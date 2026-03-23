<script lang="ts">
  import { authState, signInWithEmail, signOutAuth, signUpWithEmail } from '../../lib/auth';
  import { taskStore } from '../../store/tasks';

  let email = '';
  let password = '';
  let busy = false;
  let message = '';
  let messageType: 'info' | 'error' = 'info';

  function setError(msg: string): void {
    message = msg;
    messageType = 'error';
  }

  function setInfo(msg: string): void {
    message = msg;
    messageType = 'info';
  }

  async function handleSignIn(): Promise<void> {
    busy = true;
    message = '';
    const res = await signInWithEmail(email.trim(), password);
    busy = false;
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInfo('Signed in. Syncing tasks…');
    await taskStore.hydrate();
    password = '';
  }

  async function handleSignUp(): Promise<void> {
    busy = true;
    message = '';
    const res = await signUpWithEmail(email.trim(), password);
    busy = false;
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInfo('Account created. Check your email if confirmation is required, then sign in.');
  }

  async function handleSignOut(): Promise<void> {
    busy = true;
    message = '';
    await signOutAuth();
    busy = false;
    await taskStore.hydrate();
    setInfo('Signed out. Showing local tasks.');
    password = '';
  }

  $: canSubmit = email.trim().length > 3 && password.length >= 6;
</script>

{#if $authState.status !== 'disabled'}
  <section class="mb-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-card dark:border-slate-700 dark:bg-slate-900">
    {#if $authState.status === 'signed_in'}
      <div class="flex items-center justify-between gap-2">
        <p class="min-w-0 text-[11px] text-slate-600 dark:text-slate-300">
          Signed in as
          <span class="font-medium text-slate-900 dark:text-slate-100">{$authState.user.email ?? 'User'}</span>
        </p>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          on:click={() => void handleSignOut()}
          disabled={busy}
        >
          Sign out
        </button>
      </div>
    {:else}
      <p class="mb-2 text-[11px] text-slate-600 dark:text-slate-300">
        Sign in to keep separate task data per account.
      </p>
      <div class="grid grid-cols-1 gap-2">
        <input
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          type="email"
          placeholder="Email"
          bind:value={email}
          disabled={busy}
        />
        <input
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          type="password"
          placeholder="Password (min 6)"
          bind:value={password}
          disabled={busy}
        />
      </div>
      <div class="mt-2 flex gap-1.5">
        <button
          type="button"
          class="flex-1 rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          on:click={() => void handleSignIn()}
          disabled={busy || !canSubmit}
        >
          Sign in
        </button>
        <button
          type="button"
          class="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          on:click={() => void handleSignUp()}
          disabled={busy || !canSubmit}
        >
          Sign up
        </button>
      </div>
    {/if}
    {#if message}
      <p class="mt-2 text-[10px] {messageType === 'error' ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}">
        {message}
      </p>
    {/if}
  </section>
{/if}
