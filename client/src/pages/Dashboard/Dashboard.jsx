import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { GlassCard } from '../../components/ui/GlassCard';
import { Search, Layout, Key, Trash2, Users, LayoutTemplate, Settings as SettingsIcon, FileText, Grid3x3, AlignJustify, Circle, Pencil, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [activeView, setActiveView] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isErrorMsg, setIsErrorMsg] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBoards = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/boards', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setBoards(data);
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  };

  useEffect(() => { fetchBoards(); }, [user.token]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode) return;
    try {
      const res = await fetch('http://localhost:5000/api/boards/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ partyCode: joinCode })
      });
      const data = await res.json();
      if (res.ok) navigate(`/board/${data.boardId}`);
      else setJoinError(data.message || 'Invalid Party Code');
    } catch (err) {
      setJoinError('Server error');
    }
  };

  const handleDelete = async (e, boardId) => {
    e.stopPropagation();
    if (!confirm('Delete this board permanently?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) setBoards(boards.filter(b => b._id !== boardId));
    } catch (err) {
      console.error('Error deleting board:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg('Password updated successfully!');
        setIsErrorMsg(false);
        setOldPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg(data.message || 'Error changing password');
        setIsErrorMsg(true);
      }
    } catch (err) {
      setPasswordMsg('Server error');
      setIsErrorMsg(true);
    }
  };

  const handleUpdateTitle = async (boardId) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        setBoards(boards.map(b => b._id === boardId ? { ...b, title: editTitle } : b));
      }
    } catch (err) {
      console.error('Error updating title:', err);
    }
    setEditingId(null);
  };

  const handleNewBoardWithTemplate = async (templateId) => {
    try {
      const res = await fetch('http://localhost:5000/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ title: `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Notes` })
      });
      const data = await res.json();
      if (res.ok) navigate(`/board/${data._id}?template=${templateId}`);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  // Filter boards
  const ownedBoards = boards.filter(b => b.owner === user._id || b.owner === user.id);
  const sharedBoards = boards.filter(b => b.owner !== user._id && b.owner !== user.id);
  const filteredBoards = activeView === 'shared' ? sharedBoards : ownedBoards;
  const searchedBoards = searchQuery
    ? filteredBoards.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredBoards;

  const viewTitles = {
    recent: 'Recent Boards',
    shared: 'Shared with Me',
    templates: 'Templates',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-20 border-b border-borderColor flex items-center justify-between px-8 bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white">{viewTitles[activeView]}</h1>
          
          {(activeView === 'recent' || activeView === 'shared') && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary w-4 h-4" />
                <Input
                  type="text" placeholder="Search..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-44 h-10 rounded-xl bg-surface border-borderColor focus:border-primary text-sm"
                />
              </div>
              <form onSubmit={handleJoin} className="flex items-center gap-2">
                <Input
                  type="text" placeholder="Party Code"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  className="w-32 h-10 rounded-xl bg-surface border-borderColor focus:border-primary uppercase text-center font-mono tracking-widest text-sm"
                  maxLength={6}
                />
                <Button type="submit" variant="primary" className="h-10 px-4 text-sm gap-2">
                  <Key size={16} /> Join
                </Button>
              </form>
              {joinError && <span className="text-red-400 text-xs">{joinError}</span>}
            </div>
          )}
        </header>

        <div className="p-8">
          {/* Templates View */}
          {activeView === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[
                { id: 'blank', icon: <FileText className="w-10 h-10" />, label: 'Blank Canvas', desc: 'Start from scratch' },
                { id: 'ruled', icon: <AlignJustify className="w-10 h-10" />, label: 'Ruled Notebook', desc: 'A4 lined paper with margin' },
                { id: 'grid', icon: <Grid3x3 className="w-10 h-10" />, label: 'Grid Paper', desc: 'Engineering grid paper' },
                { id: 'dotted', icon: <Circle className="w-10 h-10" />, label: 'Dotted Paper', desc: 'Bullet journal style' },
                { id: 'cornell', icon: <LayoutTemplate className="w-10 h-10" />, label: 'Cornell Notes', desc: 'Structured note-taking' },
              ].map((t) => (
                <GlassCard
                  key={t.id}
                  className="p-6 cursor-pointer hover:border-primary transition-all group"
                  onClick={() => handleNewBoardWithTemplate(t.id)}
                >
                  <div className="text-textSecondary group-hover:text-primary transition-colors mb-4">{t.icon}</div>
                  <h3 className="text-white font-medium mb-1">{t.label}</h3>
                  <p className="text-xs text-textSecondary">{t.desc}</p>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <div className="max-w-lg">
              <GlassCard className="p-6 mb-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><SettingsIcon size={18} /> Account</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-textSecondary">Name</label>
                    <p className="text-white">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-textSecondary">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-textSecondary">Total Boards</label>
                    <p className="text-white">{boards.length}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Key size={18} /> Change Password</h3>
                {passwordMsg && (
                  <div className={`mb-4 p-3 rounded-xl text-sm text-center border ${isErrorMsg ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    {passwordMsg}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-textSecondary px-1">Current Password</label>
                    <div className="relative">
                      <Input 
                        type={showSettingsPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-white transition-colors p-1"
                      >
                        {showSettingsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-textSecondary px-1">New Password</label>
                    <div className="relative">
                      <Input 
                        type={showSettingsPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" className="w-full mt-2">
                    Update Password
                  </Button>
                </form>
              </GlassCard>
            </div>
          )}

          {/* Board Grid (Recent / Shared) */}
          {(activeView === 'recent' || activeView === 'shared') && (
            <>
              {searchedBoards.length === 0 ? (
                <div className="text-center mt-20 text-textSecondary">
                  <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">{activeView === 'shared' ? 'No shared boards' : 'No boards yet'}</p>
                  <p className="text-sm">{activeView === 'shared' ? 'Ask a friend to share their Party Code!' : 'Create a new board or pick a template to get started!'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchedBoards.map((board) => (
                    <GlassCard
                      key={board._id}
                      className="p-0 overflow-hidden group cursor-pointer hover:border-primary transition-colors"
                      onClick={() => navigate(`/board/${board._id}`)}
                    >
                      <div className="h-40 bg-surface flex items-center justify-center border-b border-borderColor group-hover:bg-glass transition-colors relative">
                        <div className="text-textSecondary opacity-30 group-hover:text-primary transition-colors">
                          <Layout className="w-12 h-12" />
                        </div>
                        {board.partyCode && (
                          <span className="absolute bottom-3 right-3 text-[10px] font-mono bg-background/80 text-textSecondary px-2 py-1 rounded-md border border-borderColor">
                            {board.partyCode}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 truncate pr-2">
                          {editingId === board._id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onBlur={() => handleUpdateTitle(board._id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateTitle(board._id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              onClick={e => e.stopPropagation()}
                              className="bg-surface border border-primary rounded px-2 py-0.5 mb-1 text-white font-medium text-sm w-full outline-none"
                            />
                          ) : (
                            <h3 className="text-white font-medium mb-1 truncate">{board.title}</h3>
                          )}
                          <p className="text-xs text-textSecondary">{new Date(board.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="text-textSecondary hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(board._id);
                              setEditTitle(board.title);
                            }}
                            title="Rename board"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="text-textSecondary hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDelete(e, board._id)}
                            title="Delete board"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
