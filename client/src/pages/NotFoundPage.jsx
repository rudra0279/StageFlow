import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-7xl font-black text-cyan-400 font-mono">404</h1>
      <h2 className="text-2xl font-bold text-white mt-2">Stage View Not Found</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The requested event or stage link could not be located in the current schedule.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="primary" icon={Home}>
          Return to StagePilot Home
        </Button>
      </Link>
    </div>
  );
};
