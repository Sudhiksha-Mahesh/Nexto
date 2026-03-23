import '../app.css';
import './popup.css';
import { initTheme } from '../lib/theme';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app not found');

void (async () => {
  await initTheme();
  new App({ target });
})();
