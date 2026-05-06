import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '14px',
            fontFamily: '"DM Sans", sans-serif',
          },
          success: { iconTheme: { primary: '#14b8a6', secondary: '#f0fdfa' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff1f2' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)