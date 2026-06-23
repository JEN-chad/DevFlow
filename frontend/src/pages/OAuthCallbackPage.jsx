import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const OAuthCallbackPage = () => {
  const { checkAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Session initialization error:', err);
        setError('Failed to authenticate with GitHub. Please try again.');
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-slate-200">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
        {error ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-semibold">Authentication Error</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <h2 className="text-lg font-semibold tracking-tight">Authenticating with GitHub...</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Synchronizing permissions and setting up your workspace environment.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
