import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {}
  })
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: () => 'data:image/png;base64,'
});

vi.mock('chart.js', () => {
  const defaults = { color: '#000', borderColor: '#000', font: {} };
  const Chart = { register: () => {}, defaults };
  return {
    Chart,
    ArcElement: {},
    BarElement: {},
    CategoryScale: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
    register: () => {},
    defaults
  };
});

vi.mock('react-chartjs-2', () => {
  const Bar = () => React.createElement('div', { 'data-testid': 'bar-chart' });
  const Doughnut = () => React.createElement('div', { 'data-testid': 'doughnut-chart' });
  return { Bar, Doughnut };
});
