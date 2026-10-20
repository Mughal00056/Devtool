import React, { useState } from 'react';
import { InspectedElement } from '../../types/devtools';
import { ChevronRight, ChevronDown, Layers, Code, Hash, AtSign } from 'lucide-react';

interface DomNode {
  tag: string;
  id?: string;
  classes: string[];
  line: number;
  text?: string;
  children?: DomNode[];
}

interface DomTreeViewerProps {
  code: string;
  selectedElement: InspectedElement | null;
  onSelectNode: (line: number, tag: string) => void;
  onJumpToEditor: (line: number) => void;
}

export const DomTreeViewer: React.FC<DomTreeViewerProps> = ({
  code,
  selectedElement,
  onSelectNode,
  onJumpToEditor
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});

  // Parse JSX/HTML lines into hierarchical nodes
  const nodes: DomNode[] = [];
  const lines = code.split('\n');

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    const tagMatch = trimmed.match(/<([A-Za-z][A-Za-z0-9_-]*)/);
    if (tagMatch && !trimmed.startsWith('</') && !trimmed.startsWith('<!--')) {
      const tag = tagMatch[1];
      const classMatch = trimmed.match(/(?:className|class)=["']([^"']+)["']/);
      const idMatch = trimmed.match(/id=["']([^"']+)["']/);
      const classes = classMatch ? classMatch[1].split(' ').filter(Boolean).slice(0, 3) : [];
      
      // Look for text content
      const textMatch = trimmed.match(/>([^<]+)</);
      const text = textMatch ? textMatch[1].trim() : undefined;

      nodes.push({
        tag,
        id: idMatch ? idMatch[1] : undefined,
        classes,
        line: idx + 1,
        text: text ? text.slice(0, 30) : undefined
      });
    }
  });

  const toggleCollapse = (line: number) => {
    setCollapsedNodes(prev => ({ ...prev, [line]: !prev[line] }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white">Component & DOM Tree</span>
          <span className="text-[11px] text-slate-500 font-mono">({nodes.length} tags)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono space-y-1">
        {nodes.map(node => {
          const isSelected = selectedElement && (
            selectedElement.matchedCodeLine === node.line ||
            (selectedElement.idAttr && selectedElement.idAttr === node.id)
          );

          return (
            <div
              key={node.line}
              onClick={() => onSelectNode(node.line, node.tag)}
              className={`flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-colors group ${
                isSelected
                  ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] text-slate-500 w-6 text-right tabular-nums">
                  {node.line}
                </span>

                <span className="text-blue-400 font-bold">&lt;{node.tag}&gt;</span>

                {node.id && (
                  <span className="text-purple-400 text-[11px] flex items-center gap-0.5">
                    <Hash className="w-2.5 h-2.5" />
                    {node.id}
                  </span>
                )}

                {node.classes.length > 0 && (
                  <span className="text-slate-400 text-[10px] truncate">
                    .{node.classes.join('.')}
                  </span>
                )}

                {node.text && (
                  <span className="text-amber-200/70 text-[10px] truncate max-w-[120px]">
                    "{node.text}"
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToEditor(node.line);
                }}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded transition-opacity"
                title={`Jump to line ${node.line} in Editor`}
              >
                <Code className="w-2.5 h-2.5" />
                <span>L{node.line}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
