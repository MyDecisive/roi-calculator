import React from 'react';
import { createRoot } from 'react-dom/client';
import { RoiCalculator } from '../src';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Demo root element was not found.');
}

createRoot(root).render(
  <React.StrictMode>
    <main className="demo-shell">
      <section className="demo-copy" aria-labelledby="demo-title">
        <h1 id="demo-title">MyDecisive ROI Calculator</h1>
      </section>
      <RoiCalculator />
    </main>
  </React.StrictMode>
);
