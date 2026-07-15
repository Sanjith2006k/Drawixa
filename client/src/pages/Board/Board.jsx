import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Share2, Loader2, Copy, Check } from 'lucide-react';
import { Canvas } from '../../components/board/Canvas';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { Button } from '../../components/ui/Button';
import { BoardProvider } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';

function BoardInner({ board, id, user, participants, handleCopyCode, copied }) {
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('template');

  const avatarColors = ['#1B4EF5', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#00C7BE', '#FFCC00'];

  return (
    <BoardProvider>
      <BoardContent
        board={board} id={id} user={user} participants={participants}
        handleCopyCode={handleCopyCode} copied={copied}
        avatarColors={avatarColors} templateParam={templateParam}
      />
    </BoardProvider>
  );
}

function BoardContent({ board, id, user, participants, handleCopyCode, copied, avatarColors, templateParam }) {
  const [participantsList, setParticipantsList] = useState(participants);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <header className="absolute top-0 left-0 w-full h-14 bg-surface/80 backdrop-blur-md border-b border-borderColor z-50 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:bg-hover transition-colors">
            <span className="text-white font-bold text-lg leading-none">D</span>
          </Link>
          <div>
            <h1 className="text-white font-medium text-sm leading-tight">{board.title}</h1>
            <p className="text-[10px] text-textSecondary">Auto-saving</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2">
              {participantsList.map((p, i) => (
                <div key={p.socketId} title={p.userName}
                  className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: avatarColors[i % avatarColors.length], zIndex: participantsList.length - i }}>
                  {p.userName.charAt(0)}
                </div>
              ))}
            </div>
            {participantsList.length > 0 && (
              <span className="text-xs text-textSecondary">{participantsList.length} online</span>
            )}
          </div>

          <div className="w-px h-7 bg-borderColor" />

          <div className="h-8 px-3 text-xs bg-white/5 border border-white/10 rounded-lg flex items-center text-white gap-2">
            <span className="text-textSecondary">Code:</span>
            <span className="font-mono font-bold tracking-widest">{board.partyCode}</span>
          </div>

          <Button variant="secondary" className="h-8 px-3 text-xs gap-1.5" onClick={handleCopyCode}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </header>

      <Canvas boardId={id} initialData={board.canvasData} onParticipantsUpdate={setParticipantsList} templateParam={templateParam} />
      <Toolbar />
    </div>
  );
}

export function Board() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/boards/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) setBoard(data);
        else navigate('/dashboard');
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [id, user.token, navigate]);

  const handleCopyCode = () => {
    if (!board) return;
    navigator.clipboard.writeText(board.partyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-textSecondary">Loading board...</p>
      </div>
    );
  }

  return (
    <BoardInner board={board} id={id} user={user} participants={[]} handleCopyCode={handleCopyCode} copied={copied} />
  );
}
