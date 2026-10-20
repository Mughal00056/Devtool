export type SupportedLanguage = 'tsx' | 'html' | 'css' | 'javascript' | 'python';

export interface CodeFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  isEntry?: boolean;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  files: CodeFile[];
  badge: string;
}

export interface InspectedElement {
  id: string;
  tagName: string;
  classes: string[];
  idAttr?: string;
  textContent: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
  boxModel: {
    margin: { top: number; right: number; bottom: number; left: number };
    border: { top: number; right: number; bottom: number; left: number };
    padding: { top: number; right: number; bottom: number; left: number };
    content: { width: number; height: number };
  };
  attributes: Record<string, string>;
  matchedCodeLine?: number;
  targetFileId?: string;
  parentTag?: string;
  childrenCount: number;
  xpath?: string;
}

export interface ExtractedReactComponent {
  name: string;
  type: 'functional' | 'arrow' | 'hook';
  props: string[];
  hooksUsed: string[];
  code: string;
  lineStart: number;
  lineEnd: number;
}

export interface ExtractedHtmlElement {
  tag: string;
  count: number;
  classes: string[];
  sampleAttributes: string[];
}

export interface ExtractedCssRule {
  selector: string;
  properties: Record<string, string>;
  isTailwindUtility?: boolean;
}

export interface ExtractedJsFunction {
  name: string;
  isAsync: boolean;
  params: string[];
  code: string;
  type: 'function' | 'arrow' | 'method';
}

export interface ExtractedPythonItem {
  name: string;
  type: 'function' | 'class' | 'import' | 'variable';
  docstring?: string;
  code: string;
  lineStart: number;
}

export interface ExtractedAsset {
  type: 'image' | 'svg' | 'font' | 'link' | 'data-uri';
  url: string;
  context: string;
}

export interface ExtractorResult {
  reactComponents: ExtractedReactComponent[];
  htmlTags: ExtractedHtmlElement[];
  cssRules: ExtractedCssRule[];
  tailwindClasses: string[];
  colorPalette: string[];
  jsFunctions: ExtractedJsFunction[];
  pythonItems: ExtractedPythonItem[];
  assets: ExtractedAsset[];
  rawStats: {
    lines: number;
    characters: number;
    words: number;
    languagesDetected: string[];
  };
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'system';
  message: string;
  timestamp: string;
  data?: unknown;
}

export interface PythonExecutionResult {
  output: string;
  error?: string;
  executionTimeMs: number;
  variables: Record<string, unknown>;
}
