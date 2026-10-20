import React from 'react';
import { ProjectTemplate } from '../types/devtools';
import { Code2, Play, Sparkles, FolderOpen, Crosshair } from 'lucide-react';

export type ActiveWorkspaceView = 'split-inspector' | 'full-editor' | 'extractor' | 'python' | 'console';

interface HeaderProps {
  activeView: ActiveWorkspaceView;
  onChangeView: (view: ActiveWorkspaceView) => void;
  templates: ProjectTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onTriggerRun: () => void;
  inspectMode: boolean;
  onToggleInspect: (active: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onChangeView,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onTriggerRun,
  inspectMode,
  onToggleInspect
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-xs shrink-0 select-none">
      {/* Zone 1: Brand title wordmark (single line, no subtitle pill) */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="text-base font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50" />
          DevPulse Studio
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links / view modes */}
      <nav className="flex items-center gap-2 font-medium">
        <button
          onClick={() => onChangeView('split-inspector')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeView === 'split-inspector'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Live Inspector
        </button>

        <button
          onClick={() => onChangeView('full-editor')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeView === 'full-editor'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Code Editor
        </button>

        <button
          onClick={() => onChangeView('extractor')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeView === 'extractor'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Multi-Stack Extractor
        </button>

        <button
          onClick={() => onChangeView('python')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeView === 'python'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Python Runtime
        </button>

        <button
          onClick={() => onChangeView('console')}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            activeView === 'console'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Console
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster (Template selector + Run button) */}
      <div className="flex items-center gap-3 shrink-0">
        <select
          value={selectedTemplateId}
          onChange={e => onSelectTemplate(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 whitespace-nowrap"
        >
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <button
          onClick={onTriggerRun}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute</span>
        </button>
      </div>
    </header>
  );
};
