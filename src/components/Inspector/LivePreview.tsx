import React, { useRef, useEffect, useState, useCallback } from 'react';
import { InspectedElement, CodeFile } from '../../types/devtools';
import { RefreshCw, Monitor, Tablet, Smartphone, Crosshair, ExternalLink, Code } from 'lucide-react';

interface LivePreviewProps {
  files: CodeFile[];
  inspectMode: boolean;
  onToggleInspect: (active: boolean) => void;
  onElementSelected: (element: InspectedElement | null) => void;
  selectedElement: InspectedElement | null;
  onJumpToEditor: (fileId: string, line: number) => void;
  onConsoleLog: (type: 'log' | 'info' | 'warn' | 'error', msg: string) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  inspectMode,
  onToggleInspect,
  onElementSelected,
  selectedElement,
  onJumpToEditor,
  onConsoleLog
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [hoveredRect, setHoveredRect] = useState<{ top: number; left: number; width: number; height: number; tag: string } | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const appTsx = files.find(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'))?.content || '';
  const indexHtml = files.find(f => f.name.endsWith('.html'))?.content || '';
  const customCss = files.find(f => f.name.endsWith('.css'))?.content || '';
  const scriptJs = files.find(f => f.name.endsWith('.js') && !f.name.endsWith('.tsx'))?.content || '';

  // Generate bundled HTML for the sandboxed iframe
  const generatePreviewDoc = useCallback(() => {
    // If App.tsx exists, we transpile it with Babel standalone or compile JSX into React execution
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        background-color: #020617;
        color: #f8fafc;
      }
      ${customCss}
      /* Inspector hover outline */
      .devpulse-inspect-hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
      }
      .devpulse-inspect-selected {
        outline: 2px solid #2563eb !important;
        outline-offset: -2px !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25) !important;
      }
    </style>
  </head>
  <body>
    <div id="root">
      ${!appTsx && indexHtml ? indexHtml : ''}
    </div>

    <script>
      // Forward console logs to devtools
      const _origLog = console.log;
      const _origWarn = console.warn;
      const _origErr = console.error;
      window.console.log = function(...args) {
        _origLog(...args);
        window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      };
      window.console.warn = function(...args) {
        _origWarn(...args);
        window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      };
      window.console.error = function(...args) {
        _origErr(...args);
        window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      };
    </script>

    <script type="text/babel">
      try {
        ${appTsx ? `
          ${appTsx.replace(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/, 'function $1')}
          ${appTsx.includes('function Dashboard') ? 'const MainComp = Dashboard;' :
            appTsx.includes('function ProductStudio') ? 'const MainComp = ProductStudio;' :
            appTsx.includes('function App') ? 'const MainComp = App;' :
            appTsx.includes('function PythonVisualizer') ? 'const MainComp = PythonVisualizer;' :
            'const MainComp = () => <div className="p-8 text-center text-slate-400">Component ready</div>;'
          }
          const rootEl = document.getElementById('root');
          if (rootEl && typeof MainComp !== 'undefined') {
            const root = ReactDOM.createRoot(rootEl);
            root.render(<MainComp />);
          }
        ` : ''}
      } catch (err) {
        console.error("React Render Error:", err.message);
        document.getElementById('root').innerHTML = '<div style="color:#ef4444;padding:24px;font-family:monospace;background:#450a0a;border:1px solid #991b1b;border-radius:8px;margin:16px;">Render Error: ' + err.message + '</div>';
      }
    </script>

    <script>
      ${scriptJs}
    </script>
  </body>
</html>`;
  }, [appTsx, indexHtml, customCss, scriptJs]);

  const reloadIframe = () => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generatePreviewDoc());
      doc.close();
    }
  };

  useEffect(() => {
    reloadIframe();
  }, [generatePreviewDoc]);

  // Message listener for console and elements
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        onConsoleLog(e.data.level, e.data.message);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  // Inspect mode element hover & click binding
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let hoverTimeout: number | undefined;

    const setupInspectorListeners = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      const handleMouseOver = (e: MouseEvent) => {
        if (!inspectMode) return;
        e.stopPropagation();
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target.id === 'root') return;

        const rect = target.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();

        setHoveredRect({
          top: iframeRect.top + rect.top,
          left: iframeRect.left + rect.left,
          width: rect.width,
          height: rect.height,
          tag: target.tagName.toLowerCase() + (target.className ? '.' + target.className.split(' ')[0] : '')
        });

        doc.querySelectorAll('.devpulse-inspect-hover').forEach(el => el.classList.remove('devpulse-inspect-hover'));
        target.classList.add('devpulse-inspect-hover');
      };

      const handleMouseOut = () => {
        if (!inspectMode) return;
        setHoveredRect(null);
      };

      const handleClick = (e: MouseEvent) => {
        if (!inspectMode) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (!target) return;

        doc.querySelectorAll('.devpulse-inspect-selected').forEach(el => el.classList.remove('devpulse-inspect-selected'));
        target.classList.add('devpulse-inspect-selected');

        const win = iframe.contentWindow;
        const computed = win ? win.getComputedStyle(target) : ({} as CSSStyleDeclaration);
        const rect = target.getBoundingClientRect();

        // Parse box model
        const parsePx = (val: string) => parseFloat(val) || 0;
        const boxModel = {
          margin: {
            top: parsePx(computed.marginTop),
            right: parsePx(computed.marginRight),
            bottom: parsePx(computed.marginBottom),
            left: parsePx(computed.marginLeft)
          },
          border: {
            top: parsePx(computed.borderTopWidth),
            right: parsePx(computed.borderRightWidth),
            bottom: parsePx(computed.borderBottomWidth),
            left: parsePx(computed.borderLeftWidth)
          },
          padding: {
            top: parsePx(computed.paddingTop),
            right: parsePx(computed.paddingRight),
            bottom: parsePx(computed.paddingBottom),
            left: parsePx(computed.paddingLeft)
          },
          content: {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };

        // Extract attributes
        const attributes: Record<string, string> = {};
        for (let i = 0; i < target.attributes.length; i++) {
          const attr = target.attributes[i];
          attributes[attr.name] = attr.value;
        }

        // Selected computed styles subset
        const relevantStyles: Record<string, string> = {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
          padding: `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`,
          margin: `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily,
          borderRadius: computed.borderRadius,
          border: `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`,
          flexDirection: computed.flexDirection,
          justifyContent: computed.justifyContent,
          alignItems: computed.alignItems,
          boxShadow: computed.boxShadow !== 'none' ? computed.boxShadow : 'none'
        };

        // Find matching line in code
        let targetFileId = files[0]?.id;
        let matchedLine = 1;

        const targetTag = target.tagName.toLowerCase();
        const targetClass = target.className.split(' ').filter(c => !c.startsWith('devpulse'))[0] || '';
        const targetId = target.id;

        // Search through files
        for (const file of files) {
          const fileLines = file.content.split('\n');
          for (let l = 0; l < fileLines.length; l++) {
            const lineText = fileLines[l];
            if (targetId && lineText.includes(targetId)) {
              matchedLine = l + 1;
              targetFileId = file.id;
              break;
            }
            if (targetClass && lineText.includes(targetClass)) {
              matchedLine = l + 1;
              targetFileId = file.id;
              break;
            }
            if (lineText.toLowerCase().includes(`<${targetTag}`)) {
              matchedLine = l + 1;
              targetFileId = file.id;
              break;
            }
          }
          if (matchedLine > 1) break;
        }

        const inspected: InspectedElement = {
          id: 'elem-' + Math.random().toString(36).substring(2, 9),
          tagName: target.tagName.toLowerCase(),
          classes: target.className.split(' ').filter(c => !c.startsWith('devpulse')),
          idAttr: target.id || undefined,
          textContent: target.innerText ? target.innerText.slice(0, 80) : '',
          rect: {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          computedStyles: relevantStyles,
          boxModel,
          attributes,
          matchedCodeLine: matchedLine,
          targetFileId,
          childrenCount: target.children.length,
          parentTag: target.parentElement ? target.parentElement.tagName.toLowerCase() : undefined
        };

        onElementSelected(inspected);
      };

      doc.body.addEventListener('mouseover', handleMouseOver);
      doc.body.addEventListener('mouseout', handleMouseOut);
      doc.body.addEventListener('click', handleClick, true);

      return () => {
        doc.body.removeEventListener('mouseover', handleMouseOver);
        doc.body.removeEventListener('mouseout', handleMouseOut);
        doc.body.removeEventListener('click', handleClick, true);
      };
    };

    const interval = setInterval(() => {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState === 'complete') {
        clearInterval(interval);
        setupInspectorListeners();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [inspectMode, files, onElementSelected]);

  const deviceWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]'
  }[device];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Viewport Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleInspect(!inspectMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              inspectMode
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Inspect Element (Select to inspect in preview)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Inspect Mode {inspectMode ? '(Active)' : ''}</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Device Toggles */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded ${device === 'desktop' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'}`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded ${device === 'tablet' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'}`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded ${device === 'mobile' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'}`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedElement && selectedElement.matchedCodeLine && (
            <button
              onClick={() => onJumpToEditor(selectedElement.targetFileId || files[0].id, selectedElement.matchedCodeLine || 1)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 rounded-md text-xs font-medium transition-all"
            >
              <Code className="w-3 h-3" />
              <span>Jump to Code (L{selectedElement.matchedCodeLine})</span>
            </button>
          )}

          <button
            onClick={reloadIframe}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Reload Preview Frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950 p-3 flex justify-center items-start overflow-auto relative">
        <div className={`h-full transition-all duration-200 ${deviceWidthClass} bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl relative flex flex-col`}>
          <iframe
            ref={iframeRef}
            title="Live Preview Sandbox"
            className="w-full flex-1 border-0 bg-slate-950"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />

          {/* Hover overlay hint */}
          {hoveredRect && inspectMode && (
            <div
              className="pointer-events-none fixed z-50 bg-blue-500/10 border-2 border-blue-400 rounded transition-all"
              style={{
                top: hoveredRect.top,
                left: hoveredRect.left,
                width: hoveredRect.width,
                height: hoveredRect.height
              }}
            >
              <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[11px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                {hoveredRect.tag} · {Math.round(hoveredRect.width)}×{Math.round(hoveredRect.height)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
