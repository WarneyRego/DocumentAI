import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, MessageSquare, CreditCard, Moon, Sun, LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

export function Navigation() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSignOut = () => {
    signOut(auth);
  };

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { to: '/', icon: FileText, label: 'Documentos' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/pricing', icon: CreditCard, label: 'Preço' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">DocumentAI</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(to) 
                      ? 'border-indigo-500 text-gray-900 dark:text-white' 
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}