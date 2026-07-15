import React from 'react';
import { Home, Users, LayoutTemplate, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ activeView = 'recent', onViewChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNewBoard = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: 'Untitled Board' })
      });
      const data = await res.json();
      if (res.ok) navigate(`/board/${data._id}`);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Recent Boards', id: 'recent' },
    { icon: <Users size={20} />, label: 'Shared with Me', id: 'shared' },
    { icon: <LayoutTemplate size={20} />, label: 'Templates', id: 'templates' },
    { icon: <Settings size={20} />, label: 'Settings', id: 'settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen bg-surface border-r border-borderColor flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xl leading-none">D</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Drawixa</span>
      </div>

      <button onClick={handleNewBoard} className="bg-primary hover:bg-hover text-white w-full h-12 rounded-xl flex items-center justify-center gap-2 font-medium mb-6 transition-colors shadow-md">
        <Plus size={20} />
        New Board
      </button>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange && onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeView === item.id
                ? 'bg-glass text-white font-medium'
                : 'text-textSecondary hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-borderColor pt-4 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-textSecondary hover:bg-white/5 hover:text-white transition-colors">
          <div className="w-8 h-8 rounded-full bg-highlight text-background flex items-center justify-center font-bold uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-left flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs truncate">{user?.email}</p>
          </div>
        </button>
        <button onClick={handleLogout} className="w-full text-left text-xs text-textSecondary hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/5 transition-colors">
          Log out
        </button>
      </div>
    </aside>
  );
}
