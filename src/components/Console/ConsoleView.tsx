import React, { useState } from 'react';
import { ConsoleEntry } from '../../types/devtools';
import { Terminal, Trash2, AlertCircle, AlertTriangle, Info, Play } from 'lucide-react';

interface ConsoleViewProps {
  entries: ConsoleEntry[];
  onClear: () => void;
  onExecuteJs: (code: string) => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ entries, onClear, onExecuteJs }) => {
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [inputCode, setInputCode] = useState('');

  const filteredEntries = entries.filter(e => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onExecuteJs(inputCode.trim());
    setInputCode('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-xs">
      {/* Control bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-white">Browser & Runtime Console</span>

          {/* Filter tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5 ml-2 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilter('log')}
              className={`px-2 py-0.5 rounded ${filter === 'log' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              Logs
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-2 py-0.5 rounded ${filter === 'warn' ? 'bg-amber-950 text-amber-400' : 'text-slate-400'}`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded ${filter === 'error' ? 'bg-rose-950 text-rose-400' : 'text-slate-400'}`}
            >
              Errors
            </button>
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          title="Clear Console"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Console Entries Stream */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 divide-y divide-slate-800/40">
        {filteredEntries.map(entry => {
          return (
            <div
              key={entry.id}
              className={`py-1.5 px-2 flex items-start gap-2.5 rounded ${
                entry.type === 'error'
                  ? 'bg-rose-950/30 text-rose-300'
                  : entry.type === 'warn'
                  ? 'bg-amber-950/20 text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-500 tabular-nums shrink-0 pt-0.5">
                {entry.timestamp}
              </span>

              {entry.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
              {entry.type === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
              {entry.type === 'log' && <span className="text-blue-500 select-none font-bold">›</span>}

              <div className="flex-1 break-all whitespace-pre-wrap select-all font-mono">
                {entry.message}
              </div>
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="text-slate-600 text-center py-8 italic font-sans text-xs">
            Console is clean. No logged messages.
          </div>
        )}
      </div>

      {/* Interactive JS Command REPL */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-slate-900 border-t border-slate-800 font-mono">
        <span className="text-blue-400 font-bold pl-2">&gt;</span>
        <input
          type="text"
          placeholder="Evaluate JavaScript expression or inspect DOM (e.g. document.title or 10 * 4)..."
          value={inputCode}
          onChange={e => setInputCode(e.target.value)}
          className="flex-1 bg-transparent text-slate-200 text-xs focus:outline-none"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-[11px]"
        >
          Eval
        </button>
      </form>
    </div>
  );
};
