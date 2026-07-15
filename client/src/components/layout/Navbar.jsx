import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/50 backdrop-blur-lg border-b border-borderColor">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none tracking-tighter">D</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Drawixa</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-textSecondary hover:text-white transition-colors">Features</a>
          <a href="#preview" className="text-sm font-medium text-textSecondary hover:text-white transition-colors">Preview</a>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="primary" className="h-10 px-6 text-sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" className="h-10 px-4 text-sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="h-10 px-4 text-sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" className="h-10 px-6 text-sm">Sign up free</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
