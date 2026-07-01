import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety shield for localStorage inside sandboxed iframes or private windows
try {
  const testKey = "__local_storage_shield_test__";
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  const memoryStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string): string | null => (key in memoryStore ? memoryStore[key] : null),
    setItem: (key: string, value: string): void => { memoryStore[key] = String(value); },
    removeItem: (key: string): void => { delete memoryStore[key]; },
    clear: (): void => {
      for (const k of Object.keys(memoryStore)) {
        delete memoryStore[k];
      }
    },
    key: (index: number): string | null => Object.keys(memoryStore)[index] || null,
    get length(): number { return Object.keys(memoryStore).length; }
  };
  try {
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.warn("Could not polyfill localStorage", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

