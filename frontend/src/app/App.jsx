import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './queryClient';
import { AuthProvider } from '../context/AuthContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { router } from './router';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <RouterProvider router={router} />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
