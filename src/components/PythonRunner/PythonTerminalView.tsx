import React, { useState } from 'react';
import { runPythonCode } from '../../utils/pythonRunner';
import { PythonExecutionResult } from '../../types/devtools';
import { Play, Terminal, Sparkles, Copy, Check, RefreshCw, Code, Variable } from 'lucide-react';

interface PythonTerminalViewProps {
  initialCode: string;
  onSendToEditor: (content: string) => void;
}

export const PythonTerminalView: React.FC<PythonTerminalViewProps> = ({ initialCode, onSendToEditor }) => {
  const [pyCode, setPyCode] = useState(initialCode);
  const [replInput, setReplInput] = useState('');
  const [execResult, setExecResult] = useState<PythonExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = () => {
    const res = runPythonCode(pyCode);
    setExecResult(res);
  };

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    // Run REPL line
    let codeToRun = replInput.trim();
    if (!codeToRun.startsWith('print(') && !codeToRun.includes('=')) {
      codeToRun = `print(${codeToRun})`;
    }
    const res = runPythonCode(codeToRun);
    setExecResult(prev => ({
      output: (prev ? prev.output + '\n>>> ' + replInput + '\n' : '>>> ' + replInput + '\n') + res.output,
      error: res.error,
      executionTimeMs: res.executionTimeMs,
      variables: { ...(prev?.variables || {}), ...res.variables }
    }));
    setReplInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-xs">
      {/* Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Python Runtime & Variable Inspector</span>
          <span className="text-slate-500 font-mono text-[11px]">(In-browser Python Engine)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendToEditor(pyCode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Open in IDE</span>
          </button>

          <button
            onClick={handleExecute}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Python</span>
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Python Code Input */}
        <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">main.py</span>
            <span className="text-[10px] text-slate-500 font-mono">{pyCode.split('\n').length} lines</span>
          </div>

          <textarea
            value={pyCode}
            onChange={e => setPyCode(e.target.value)}
            spellCheck="false"
            className="flex-1 w-full p-4 bg-slate-950 text-slate-200 font-mono text-xs resize-none focus:outline-none"
            placeholder="# Write Python code here...
def calculate(n):
    return [i**2 for i in range(n)]

print(calculate(10))"
          />
        </div>

        {/* Stdout Output & Variable Table */}
        <div className="lg:w-1/2 flex flex-col bg-slate-950 overflow-hidden">
          {/* Terminal Output */}
          <div className="flex-1 flex flex-col border-b border-slate-800">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Standard Output (stdout)
              </span>

              {execResult && (
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  Execution: <strong className="text-emerald-400">{execResult.executionTimeMs} ms</strong>
                </span>
              )}
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 select-text bg-[#090d16]">
              {execResult ? (
                <>
                  {execResult.output && (
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {execResult.output}
                    </div>
                  )}
                  {execResult.error && (
                    <div className="text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded">
                      {execResult.error}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-600 italic">Click "Run Python" to execute script and capture terminal output.</div>
              )}
            </div>

            {/* REPL Quick Line Input */}
            <form onSubmit={handleReplSubmit} className="flex items-center gap-2 p-2 bg-slate-900 border-t border-slate-800 font-mono">
              <span className="text-emerald-400 font-bold pl-2">&gt;&gt;&gt;</span>
              <input
                type="text"
                placeholder="Type expression (e.g. sum(range(100))) and press Enter"
                value={replInput}
                onChange={e => setReplInput(e.target.value)}
                className="flex-1 bg-transparent text-slate-100 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Eval
              </button>
            </form>
          </div>

          {/* Live Variables Inspector */}
          <div className="h-44 flex flex-col bg-slate-900/60 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5">
              <Variable className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                Python Runtime Variable Inspector
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
              {execResult && Object.keys(execResult.variables).length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                      <th className="py-1 px-2">Variable</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.entries(execResult.variables).map(([name, val]) => (
                      <tr key={name} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-2 font-bold text-cyan-300">{name}</td>
                        <td className="py-1.5 px-2 text-slate-400 text-[10px]">
                          {Array.isArray(val) ? 'list' : typeof val}
                        </td>
                        <td className="py-1.5 px-2 text-amber-200 truncate max-w-xs select-all">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-slate-600 text-center py-4">No top-level variables captured yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
