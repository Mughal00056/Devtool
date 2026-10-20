import React, { useState, useCallback } from 'react';
import { Header, ActiveWorkspaceView } from './components/Header';
import { LivePreview } from './components/Inspector/LivePreview';
import { DomTreeViewer } from './components/Inspector/DomTreeViewer';
import { StyleInspector } from './components/Inspector/StyleInspector';
import { CodeEditor } from './components/Editor/CodeEditor';
import { CodeExtractorView } from './components/Extractor/CodeExtractorView';
import { PythonTerminalView } from './components/PythonRunner/PythonTerminalView';
import { ConsoleView } from './components/Console/ConsoleView';
import { DEFAULT_TEMPLATES } from './utils/defaultTemplates';
import { CodeFile, InspectedElement, ConsoleEntry, SupportedLanguage } from './types/devtools';
import { Sliders, Layers, Code, Terminal, Sparkles } from 'lucide-react';

export default function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [files, setFiles] = useState<CodeFile[]>(DEFAULT_TEMPLATES[0].files);
  const [activeFileId, setActiveFileId] = useState<string>(DEFAULT_TEMPLATES[0].files[0].id);
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>('split-inspector');
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<InspectedElement | null>(null);
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'dom' | 'styles' | 'code'>('styles');
  const [extractorInitialCode, setExtractorInitialCode] = useState<string>('');

  // Console entries
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([
    {
      id: 'c-1',
      type: 'system',
      message: 'DevPulse Studio Initialized. Sandbox ready.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const handleConsoleLog = useCallback((type: 'log' | 'info' | 'warn' | 'error', msg: string) => {
    setConsoleEntries(prev => [
      ...prev.slice(-100),
      {
        id: 'c-' + Math.random().toString(36).substring(2, 9),
        type,
        message: msg,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  const handleClearConsole = () => {
    setConsoleEntries([]);
  };

  const handleExecuteJs = (code: string) => {
    try {
      // Evaluate within window sandbox
      const result = eval(code);
      handleConsoleLog('log', String(result));
    } catch (err: unknown) {
      handleConsoleLog('error', err instanceof Error ? err.message : String(err));
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setFiles(template.files);
    setActiveFileId(template.files[0].id);
    setSelectedElement(null);
    setTargetLine(null);
    handleConsoleLog('info', `Switched template to "${template.title}"`);
  };

  const handleUpdateContent = (fileId: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
  };

  const handleAddNewFile = (name: string, language: SupportedLanguage) => {
    const newFile: CodeFile = {
      id: 'file-' + Date.now(),
      name,
      language,
      content: language === 'tsx'
        ? `export default function ${name.replace(/\.[^/.]+$/, "")}() {\n  return (\n    <div className="p-6 text-white">\n      <h2>New Component</h2>\n    </div>\n  );\n}`
        : language === 'python'
        ? `# Python script ${name}\ndef main():\n    print("Hello from ${name}")\n\nmain()`
        : `/* Stylesheet ${name} */\n`
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string) => {
    setFiles(prev => {
      const remaining = prev.filter(f => f.id !== id);
      if (activeFileId === id && remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleJumpToEditor = (fileId: string, line: number) => {
    const fileExists = files.some(f => f.id === fileId);
    const targetFile = fileExists ? fileId : files[0].id;
    setActiveFileId(targetFile);
    setTargetLine(line);
    setActiveView('full-editor');
  };

  const handleSendToExtractor = (code: string) => {
    setExtractorInitialCode(code);
    setActiveView('extractor');
  };

  const handleSendFromExtractorToEditor = (
    fileName: string,
    content: string,
    language: SupportedLanguage
  ) => {
    const newFile: CodeFile = {
      id: 'file-' + Date.now(),
      name: fileName,
      language,
      content
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('full-editor');
  };

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const activePythonCode = files.find(f => f.name.endsWith('.py'))?.content || '';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 3-Zone Header */}
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        templates={DEFAULT_TEMPLATES}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onTriggerRun={() => {
          handleConsoleLog('info', 'Workspace execution triggered.');
        }}
        inspectMode={inspectMode}
        onToggleInspect={setInspectMode}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-hidden p-4">
        {/* VIEW 1: SPLIT INSPECTOR (Live Preview + DOM Tree & Box Model) */}
        {activeView === 'split-inspector' && (
          <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
            {/* Left Column: Live Preview Sandbox */}
            <div className="flex-1 h-full min-w-0">
              <LivePreview
                files={files}
                inspectMode={inspectMode}
                onToggleInspect={setInspectMode}
                onElementSelected={(elem) => {
                  setSelectedElement(elem);
                  setSidebarTab('styles');
                }}
                selectedElement={selectedElement}
                onJumpToEditor={handleJumpToEditor}
                onConsoleLog={handleConsoleLog}
              />
            </div>

            {/* Right Column: Inspector Side Panel (DOM Tree, Box Model Styles, Quick Editor) */}
            <div className="lg:w-[480px] h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Side Panel Tabs */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSidebarTab('styles')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sidebarTab === 'styles'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Box Model & Styles</span>
                  </button>

                  <button
                    onClick={() => setSidebarTab('dom')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sidebarTab === 'dom'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>DOM Tree</span>
                  </button>

                  <button
                    onClick={() => setSidebarTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sidebarTab === 'code'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Live Code</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveView('full-editor')}
                  className="text-slate-400 hover:text-blue-400 text-[11px] font-medium"
                >
                  Full IDE →
                </button>
              </div>

              {/* Side Panel Content */}
              <div className="flex-1 overflow-hidden p-2">
                {sidebarTab === 'styles' && (
                  <StyleInspector
                    element={selectedElement}
                    onJumpToEditor={handleJumpToEditor}
                  />
                )}

                {sidebarTab === 'dom' && (
                  <DomTreeViewer
                    code={activeFile.content}
                    selectedElement={selectedElement}
                    onSelectNode={(line) => {
                      setTargetLine(line);
                    }}
                    onJumpToEditor={(line) => {
                      handleJumpToEditor(activeFile.id, line);
                    }}
                  />
                )}

                {sidebarTab === 'code' && (
                  <CodeEditor
                    files={files}
                    activeFileId={activeFileId}
                    onSelectFile={setActiveFileId}
                    onUpdateContent={handleUpdateContent}
                    onAddNewFile={handleAddNewFile}
                    onDeleteFile={handleDeleteFile}
                    targetLine={targetLine}
                    onRunPreview={() => {
                      handleConsoleLog('info', 'Preview refreshed');
                    }}
                    onSendToExtractor={handleSendToExtractor}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FULL CODE EDITOR (IDE) */}
        {activeView === 'full-editor' && (
          <div className="h-full">
            <CodeEditor
              files={files}
              activeFileId={activeFileId}
              onSelectFile={setActiveFileId}
              onUpdateContent={handleUpdateContent}
              onAddNewFile={handleAddNewFile}
              onDeleteFile={handleDeleteFile}
              targetLine={targetLine}
              onRunPreview={() => {
                setActiveView('split-inspector');
                handleConsoleLog('info', 'Running code in Live Inspector');
              }}
              onSendToExtractor={handleSendToExtractor}
            />
          </div>
        )}

        {/* VIEW 3: UNIVERSAL EXTRACTOR */}
        {activeView === 'extractor' && (
          <div className="h-full">
            <CodeExtractorView
              initialCode={extractorInitialCode || activeFile.content}
              onSendToEditor={handleSendFromExtractorToEditor}
            />
          </div>
        )}

        {/* VIEW 4: PYTHON RUNTIME & VARIABLE INSPECTOR */}
        {activeView === 'python' && (
          <div className="h-full">
            <PythonTerminalView
              initialCode={activePythonCode || '# Python Algorithm Sandbox\nprint("Hello from Python")'}
              onSendToEditor={(content) => {
                const pyFile = files.find(f => f.name.endsWith('.py'));
                if (pyFile) {
                  handleUpdateContent(pyFile.id, content);
                  setActiveFileId(pyFile.id);
                } else {
                  handleAddNewFile('main.py', 'python');
                }
                setActiveView('full-editor');
              }}
            />
          </div>
        )}

        {/* VIEW 5: CONSOLE */}
        {activeView === 'console' && (
          <div className="h-full">
            <ConsoleView
              entries={consoleEntries}
              onClear={handleClearConsole}
              onExecuteJs={handleExecuteJs}
            />
          </div>
        )}
      </main>
    </div>
  );
}
