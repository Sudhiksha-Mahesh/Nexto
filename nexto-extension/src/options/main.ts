import Options from './Options.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app not found');

const app = new Options({ target });

export default app;
