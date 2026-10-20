import React, { useState, useMemo } from 'react';
import { extractCodeArtifacts } from '../../utils/codeExtractor';
import { ExtractorResult } from '../../types/devtools';
import {
  Sparkles,
  Layers,
  Code,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Cpu,
  Palette,
  Image as ImageIcon,
  Share2,
  Terminal
} from 'lucide-react';

interface CodeExtractorViewProps {
  initialCode: string;
  onSendToEditor: (fileName: string, content: string, language: 'tsx' | 'html' | 'css' | 'javascript' | 'python') => void;
}

export const CodeExtractorView: React.FC<CodeExtractorViewProps> = ({ initialCode, onSendToEditor }) => {
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [activeCategory, setActiveCategory] = useState<'all' | 'react' | 'html' | 'css' | 'js' | 'python' | 'assets'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const result: ExtractorResult = useMemo(() => {
    return extractCodeArtifacts(sourceCode);
  }, [sourceCode]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const downloadJsonReport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'devpulse-extracted-code-analysis.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-xs">
      {/* Extractor Control Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Universal Multi-Stack Code & Asset Extractor
          </h2>
          <span className="text-slate-400 text-[11px]">
            Extracts React components, HTML structure, CSS & Tailwind, JS functions, Python syntax, and media assets
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadJsonReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analysis JSON</span>
          </button>
        </div>
      </div>

      {/* Main Split: Raw Input on Top/Left, Extracted Cards Below/Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Source Code Input Panel */}
        <div className="lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Raw Source Code / Input
            </span>
            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
              {result.rawStats.lines} lines · {result.rawStats.characters} chars
            </div>
          </div>

          <textarea
            value={sourceCode}
            onChange={e => setSourceCode(e.target.value)}
            placeholder="Paste any React code, HTML, CSS, JavaScript, or Python here to inspect and extract everything..."
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-[11px] resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {/* Detected Languages Banner */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <span>Detected Stacks:</span>
            <div className="flex flex-wrap gap-1">
              {result.rawStats.languagesDetected.map(l => (
                <span key={l} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  {l}
                </span>
              ))}
              {result.rawStats.languagesDetected.length === 0 && (
                <span className="text-slate-500">None detected</span>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Artifacts View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Artifacts
            </button>
            <button
              onClick={() => setActiveCategory('react')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'react' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              React ({result.reactComponents.length})
            </button>
            <button
              onClick={() => setActiveCategory('html')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'html' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              HTML Elements ({result.htmlTags.length})
            </button>
            <button
              onClick={() => setActiveCategory('css')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'css' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              CSS & Tailwind ({result.cssRules.length + result.tailwindClasses.length})
            </button>
            <button
              onClick={() => setActiveCategory('js')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'js' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              JS Functions ({result.jsFunctions.length})
            </button>
            <button
              onClick={() => setActiveCategory('python')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'python' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python ({result.pythonItems.length})
            </button>
            <button
              onClick={() => setActiveCategory('assets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'assets' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Assets & Media ({result.assets.length})
            </button>
          </div>

          {/* Results Grid / List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 1. React Components */}
            {(activeCategory === 'all' || activeCategory === 'react') && result.reactComponents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-sky-400" />
                    Extracted React Components ({result.reactComponents.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.reactComponents.map((comp, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-sky-400 text-sm">&lt;{comp.name} /&gt;</span>
                          <span className="text-[10px] text-slate-500 font-mono">Lines {comp.lineStart}–{comp.lineEnd}</span>
                        </div>

                        {comp.props.length > 0 && (
                          <div className="text-[11px] text-slate-400 mb-2">
                            <span className="text-slate-500">Props: </span>
                            <span className="font-mono text-slate-300">{comp.props.join(', ')}</span>
                          </div>
                        )}

                        {comp.hooksUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {comp.hooksUsed.map(h => (
                              <span key={h} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                        <button
                          onClick={() => copyText(comp.code, `react-${idx}`)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedKey === `react-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `react-${idx}` ? 'Copied' : 'Copy Code'}</span>
                        </button>

                        <button
                          onClick={() => onSendToEditor(`${comp.name}.tsx`, comp.code, 'tsx')}
                          className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800/60 rounded font-medium text-[11px] transition-colors"
                        >
                          Send to Editor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Color Palette & Tailwind Classes */}
            {(activeCategory === 'all' || activeCategory === 'css') && (
              <div className="space-y-4">
                {/* Palette */}
                {result.colorPalette.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4 text-pink-400" />
                      Extracted Color Palette ({result.colorPalette.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                      {result.colorPalette.map(color => (
                        <div
                          key={color}
                          onClick={() => copyText(color, color)}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center cursor-pointer hover:border-slate-700 transition-all group"
                        >
                          <div
                            className="w-full h-8 rounded-md mb-1.5 border border-slate-700/60 shadow-inner group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-[10px] text-slate-300 block truncate">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailwind Classes */}
                {result.tailwindClasses.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-slate-300">
                        Detected Tailwind Utility Classes ({result.tailwindClasses.length})
                      </h4>
                      <button
                        onClick={() => copyText(result.tailwindClasses.join(' '), 'tw-all')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'tw-all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy All</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900 border border-slate-800 rounded-lg max-h-40 overflow-y-auto">
                      {result.tailwindClasses.map(tw => (
                        <span key={tw} className="bg-slate-950 text-indigo-300 border border-indigo-900/40 px-2 py-0.5 rounded font-mono text-[11px]">
                          {tw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CSS Rules */}
                {result.cssRules.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">
                      Extracted CSS Selectors ({result.cssRules.length})
                    </h4>
                    <div className="space-y-2">
                      {result.cssRules.map((rule, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px]">
                          <span className="text-yellow-400 font-bold">{rule.selector}</span> {'{'}
                          <div className="pl-4 text-slate-300 my-1">
                            {Object.entries(rule.properties).map(([p, v]) => (
                              <div key={p}>
                                <span className="text-cyan-400">{p}</span>: <span className="text-amber-200">{v}</span>;
                              </div>
                            ))}
                          </div>
                          {'}'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. HTML Tags */}
            {(activeCategory === 'all' || activeCategory === 'html') && result.htmlTags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-orange-400" />
                  Semantic HTML Elements ({result.htmlTags.length} unique tags)
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-medium">
                        <th className="py-2.5 px-4">Tag</th>
                        <th className="py-2.5 px-4">Occurrences</th>
                        <th className="py-2.5 px-4">Sample Classes</th>
                        <th className="py-2.5 px-4">Sample Attributes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {result.htmlTags.map(tag => (
                        <tr key={tag.tag} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-bold text-orange-400">&lt;{tag.tag}&gt;</td>
                          <td className="py-2.5 px-4 text-slate-300 tabular-nums">{tag.count}</td>
                          <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">{tag.classes.join(', ') || '-'}</td>
                          <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">{tag.sampleAttributes.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Python Items */}
            {(activeCategory === 'all' || activeCategory === 'python') && result.pythonItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Extracted Python Functions & Classes ({result.pythonItems.length})
                </h3>
                <div className="space-y-2">
                  {result.pythonItems.map((py, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">{py.code}</span>
                          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                            {py.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">Line {py.lineStart}</span>
                      </div>
                      <button
                        onClick={() => copyText(py.code, `py-${idx}`)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === `py-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. JavaScript Functions */}
            {(activeCategory === 'all' || activeCategory === 'js') && result.jsFunctions.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-yellow-400" />
                  Extracted JavaScript Functions ({result.jsFunctions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.jsFunctions.map((fn, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-yellow-300 text-xs">
                            {fn.isAsync ? 'async ' : ''}{fn.name}({fn.params.join(', ')})
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{fn.type}</span>
                        </div>
                        <pre className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto my-2">
                          {fn.code}
                        </pre>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => copyText(fn.code, `fn-${idx}`)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedKey === `fn-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Assets & Media */}
            {(activeCategory === 'all' || activeCategory === 'assets') && result.assets.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  Extracted Media & External Assets ({result.assets.length})
                </h3>
                <div className="space-y-2">
                  {result.assets.map((asset, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-purple-300">
                          {asset.type}
                        </span>
                        <span className="font-mono text-slate-300 text-xs truncate max-w-md">{asset.url}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyText(asset.url, `asset-${idx}`)}
                          className="p-1.5 text-slate-400 hover:text-white rounded"
                        >
                          {copiedKey === `asset-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
