import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

const rootElement = document.getElementById('root')!;

if (!rootElement) {
  throw new Error('Root element not found');
}

const reactRoot = ReactDOM.createRoot(rootElement);

reactRoot.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
