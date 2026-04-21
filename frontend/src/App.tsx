import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/LoginPage';
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { CorporationProvider } from '@/store/useCorporationStore';
import { TabProvider } from '@/store/useTabStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        const err = error as { response?: { status?: number } };
        const status = err?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CorporationProvider>
        <TabProvider>
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <MainLayout />
                  </AuthGuard>
                }
              />
            </Routes>
          </BrowserRouter>
        </TabProvider>
      </CorporationProvider>
    </QueryClientProvider>
  );
}

export default App;
