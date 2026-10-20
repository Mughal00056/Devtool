import React, { useState } from 'react';
import { InspectedElement } from '../../types/devtools';
import { Copy, Check, Code, Search, Sparkles, Sliders } from 'lucide-react';

interface StyleInspectorProps {
  element: InspectedElement | null;
  onJumpToEditor: (fileId: string, line: number) => void;
}

export const StyleInspector: React.FC<StyleInspectorProps> = ({ element, onJumpToEditor }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [styleFilter, setStyleFilter] = useState('');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (!element) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
        <Sliders className="w-8 h-8 mb-2 text-slate-600" />
        <span className="text-sm font-semibold text-slate-400">No Element Inspected</span>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Enable <strong className="text-blue-400">Inspect Mode</strong> and click any element in the live preview to inspect its box model and computed CSS styles.
        </p>
      </div>
    );
  }

  const filteredStyles = Object.entries(element.computedStyles).filter(([prop, val]) => {
    if (!styleFilter) return true;
    return prop.toLowerCase().includes(styleFilter.toLowerCase()) || val.toLowerCase().includes(styleFilter.toLowerCase());
  });

  const { margin, border, padding, content } = element.boxModel;

  return (
    <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
      {/* Element Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono font-bold text-blue-400 text-sm">&lt;{element.tagName}&gt;</span>
          {element.idAttr && <span className="font-mono text-purple-400 font-semibold truncate">#{element.idAttr}</span>}
          {element.classes.length > 0 && (
            <span className="font-mono text-slate-400 truncate">.{element.classes.join('.')}</span>
          )}
        </div>

        {element.matchedCodeLine && (
          <button
            onClick={() => onJumpToEditor(element.targetFileId || '', element.matchedCodeLine || 1)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-sm transition-all whitespace-nowrap"
          >
            <Code className="w-3 h-3" />
            <span>Go to Line {element.matchedCodeLine}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Visual Box Model */}
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
            Box Model Metrics
          </span>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 text-center text-amber-300 font-mono text-[10px] relative">
            <span className="absolute top-1 left-2 text-[9px] uppercase tracking-wider text-amber-500/80">Margin</span>
            <div className="text-amber-400">{margin.top}</div>

            <div className="flex items-center justify-between my-1">
              <div className="text-amber-400">{margin.left}</div>

              {/* Border Box */}
              <div className="flex-1 mx-2 bg-yellow-950/40 border border-yellow-700/50 rounded p-2 text-yellow-300 relative">
                <span className="absolute top-0.5 left-1.5 text-[8px] uppercase tracking-wider text-yellow-500/80">Border</span>
                <div>{border.top}</div>

                <div className="flex items-center justify-between my-1">
                  <div>{border.left}</div>

                  {/* Padding Box */}
                  <div className="flex-1 mx-2 bg-emerald-950/40 border border-emerald-700/50 rounded p-2 text-emerald-300 relative">
                    <span className="absolute top-0.5 left-1.5 text-[8px] uppercase tracking-wider text-emerald-500/80">Padding</span>
                    <div>{padding.top}</div>

                    <div className="flex items-center justify-between my-1">
                      <div>{padding.left}</div>

                      {/* Content Box */}
                      <div className="bg-blue-950/70 border border-blue-600/50 rounded px-3 py-1.5 text-blue-300 font-bold">
                        {content.width} × {content.height}
                      </div>

                      <div>{padding.right}</div>
                    </div>

                    <div>{padding.bottom}</div>
                  </div>

                  <div>{border.right}</div>
                </div>

                <div>{border.bottom}</div>
              </div>

              <div className="text-amber-400">{margin.right}</div>
            </div>

            <div className="text-amber-400">{margin.bottom}</div>
          </div>
        </div>

        {/* Classes List */}
        {element.classes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Applied Classes ({element.classes.length})
              </span>
              <button
                onClick={() => copyToClipboard(element.classes.join(' '), 'classes')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedKey === 'classes' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'classes' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg max-h-28 overflow-y-auto font-mono text-[11px]">
              {element.classes.map((cls, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Computed Styles */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Computed CSS Styles
            </span>
            <div className="relative w-36">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter CSS..."
                value={styleFilter}
                onChange={e => setStyleFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 pl-6 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800/80 font-mono text-[11px]">
            {filteredStyles.map(([prop, val]) => {
              const isColor = val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl');
              return (
                <div key={prop} className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-900/60 group">
                  <span className="text-cyan-400 select-all">{prop}:</span>
                  <div className="flex items-center gap-2 overflow-hidden max-w-[60%]">
                    {isColor && (
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700 shrink-0 shadow-sm"
                        style={{ backgroundColor: val }}
                      />
                    )}
                    <span className="text-amber-200 truncate select-all">{val}</span>
                    <button
                      onClick={() => copyToClipboard(`${prop}: ${val};`, prop)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity"
                    >
                      {copiedKey === prop ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
