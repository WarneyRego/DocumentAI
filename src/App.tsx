import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/auth';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { DocumentEditor } from './components/docs/DocumentEditor';
import { ChatSupport } from './components/chat/ChatSupport';
import { Pricing } from './components/pricing/Pricing';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigation } from './components/layout/Navigation';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser]);

  if (!user) {
    return (
      <ThemeProvider>
        <AuthForm />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/editor" element={<DocumentEditor />} />
              <Route path="/chat" element={<ChatSupport />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

// Add default export
export default App;