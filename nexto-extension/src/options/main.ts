import '../app.css';
import { initTheme } from '../lib/theme';
import Options from './Options.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app not found');

void (async () => {
  await initTheme();
  new Options({ target });
})();
