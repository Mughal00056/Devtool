import React, { useState, useRef, useEffect } from 'react';
import { CodeFile, SupportedLanguage } from '../../types/devtools';
import { highlightCode } from '../../utils/prismHelper';
import {
  Copy,
  Check,
  Download,
  Search,
  Replace,
  Play,
  FileCode,
  Sparkles,
  Plus,
  Trash2,
  Maximize2,
  FileText
} from 'lucide-react';

interface CodeEditorProps {
  files: CodeFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onUpdateContent: (fileId: string, content: string) => void;
  onAddNewFile: (name: string, language: SupportedLanguage) => void;
  onDeleteFile: (id: string) => void;
  targetLine?: number | null;
  onRunPreview: () => void;
  onSendToExtractor: (code: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpdateContent,
  onAddNewFile,
  onDeleteFile,
  targetLine,
  onRunPreview,
  onSendToExtractor
}) => {
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileLang, setNewFileLang] = useState<SupportedLanguage>('tsx');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Jump to specific line when requested by inspector
  useEffect(() => {
    if (targetLine && textareaRef.current && activeFile) {
      const lines = activeFile.content.split('\n');
      let charIndex = 0;
      for (let i = 0; i < Math.min(targetLine - 1, lines.length); i++) {
        charIndex += lines[i].length + 1; // +1 for newline
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charIndex, charIndex + (lines[targetLine - 1]?.length || 0));

      // Scroll into view
      const lineHeight = 21; // roughly 21px
      textareaRef.current.scrollTop = Math.max(0, (targetLine - 5) * lineHeight);
      if (preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }
  }, [targetLine, activeFileId, activeFile]);

  // Sync scroll between textarea and syntax highlight pre
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchReplace = () => {
    if (!searchQuery || !activeFile) return;
    const updated = activeFile.content.replaceAll(searchQuery, replaceQuery);
    onUpdateContent(activeFile.id, updated);
  };

  const formatCodeSimple = () => {
    if (!activeFile) return;
    // Simple indentation beautifier
    const lines = activeFile.content.split('\n');
    let indentLevel = 0;
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      const pad = '  '.repeat(indentLevel);
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || (trimmed.startsWith('<') && !trimmed.endsWith('/>') && !trimmed.startsWith('</') && !trimmed.includes('</'))) {
        indentLevel++;
      }
      return pad + trimmed;
    }).join('\n');
    onUpdateContent(activeFile.id, formatted);
  };

  const lines = activeFile ? activeFile.content.split('\n') : [];
  const highlightedCode = activeFile ? highlightCode(activeFile.content, activeFile.language) : '';

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 bg-slate-900 border-b border-slate-800 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 py-1.5 overflow-x-auto no-scrollbar">
          {files.map(file => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-950 text-white border-slate-700 font-semibold shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${
                  file.language === 'tsx' ? 'text-sky-400' :
                  file.language === 'python' ? 'text-amber-400' :
                  file.language === 'css' ? 'text-blue-400' :
                  file.language === 'html' ? 'text-orange-400' : 'text-emerald-400'
                }`} />
                <span className="whitespace-nowrap">{file.name}</span>
                {files.length > 1 && !file.isEntry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Create New File"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">New</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 pl-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1.5 rounded text-slate-400 hover:text-white transition-colors ${searchOpen ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800'}`}
            title="Search & Replace"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={formatCodeSimple}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Format Code"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSendToExtractor(activeFile?.content || '')}
            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-medium transition-colors flex items-center gap-1"
            title="Extract React, HTML, CSS, JS, Python from this file"
          >
            <span>Extract Artifacts</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy Content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRunPreview}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold transition-all ml-1"
            title="Run / Reload Preview"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Search & Replace Drawer */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
          <input
            type="text"
            placeholder="Find text..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 w-44"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={e => setReplaceQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 w-44"
          />
          <button
            onClick={handleSearchReplace}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1 text-[11px]"
          >
            <Replace className="w-3 h-3" />
            <span>Replace All</span>
          </button>
        </div>
      )}

      {/* Editor Main Canvas with Gutter */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-[13px] leading-[21px]">
        {/* Gutter / Line Numbers */}
        <div className="w-12 bg-slate-950/80 border-r border-slate-800/80 py-4 select-none text-right pr-3 text-slate-600 font-mono text-xs overflow-hidden">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isTarget = targetLine === lineNum;
            return (
              <div
                key={i}
                className={`${isTarget ? 'text-blue-400 font-bold bg-blue-500/20 -mr-3 pr-3 rounded-l' : ''}`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Editor Area with Syntax Highlighting Overlay */}
        <div className="flex-1 relative overflow-hidden bg-slate-950">
          {/* Syntax Highlight View (Behind) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-4 m-0 overflow-auto font-mono pointer-events-none whitespace-pre text-slate-300"
            dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
          />

          {/* Transparent Input Textarea (Front) */}
          <textarea
            ref={textareaRef}
            spellCheck="false"
            value={activeFile?.content || ''}
            onChange={e => onUpdateContent(activeFile.id, e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 p-4 m-0 bg-transparent text-transparent caret-blue-400 font-mono resize-none focus:outline-none overflow-auto whitespace-pre selection:bg-blue-600/40"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Language: <strong className="text-slate-200 uppercase">{activeFile?.language}</strong></span>
          <span>·</span>
          <span>Lines: <strong className="text-slate-200 tabular-nums">{lines.length}</strong></span>
          <span>·</span>
          <span>Characters: <strong className="text-slate-200 tabular-nums">{activeFile?.content.length || 0}</strong></span>
        </div>

        {targetLine && (
          <div className="text-blue-400 font-medium">
            Inspected Line: {targetLine}
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Code File</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">File Name</label>
              <input
                type="text"
                placeholder="e.g. Component.tsx or utils.py"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Language</label>
              <select
                value={newFileLang}
                onChange={e => setNewFileLang(e.target.value as SupportedLanguage)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="tsx">React (TSX / JSX)</option>
                <option value="python">Python (.py)</option>
                <option value="javascript">JavaScript (.js)</option>
                <option value="html">HTML (.html)</option>
                <option value="css">CSS (.css)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFileName.trim()) {
                    onAddNewFile(newFileName.trim(), newFileLang);
                    setNewFileName('');
                    setShowAddModal(false);
                  }
                }}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
