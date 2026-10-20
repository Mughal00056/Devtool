import {
  ExtractorResult,
  ExtractedReactComponent,
  ExtractedHtmlElement,
  ExtractedCssRule,
  ExtractedJsFunction,
  ExtractedPythonItem,
  ExtractedAsset
} from '../types/devtools';

export function extractCodeArtifacts(rawSource: string): ExtractorResult {
  const lines = rawSource.split('\n');
  const characters = rawSource.length;
  const words = rawSource.trim() ? rawSource.trim().split(/\s+/).length : 0;
  const languagesDetected: string[] = [];

  // Detect languages present in the snippet
  if (/<[a-zA-Z][\w:-]*(\s+[^>]*)?>/.test(rawSource)) languagesDetected.push('HTML');
  if (/(\bimport\s+React\b|className=|useState|useEffect|<[A-Z][a-zA-Z0-9]*)/.test(rawSource)) languagesDetected.push('React / JSX');
  if (/[.#][\w-]+\s*\{[^}]*\}/.test(rawSource) || /@media|@keyframes/.test(rawSource)) languagesDetected.push('CSS');
  if (/(\bfunction\b|\bconst\b|\blet\b|=>|async\s+function|console\.log)/.test(rawSource)) languagesDetected.push('JavaScript');
  if (/(\bdef\s+\w+\s*\(|\bclass\s+\w+[\s:(]|\bimport\s+\w+|\bfrom\s+\w+\s+import|print\(|elif\b)/.test(rawSource)) languagesDetected.push('Python');

  // 1. React Components & Hooks
  const reactComponents: ExtractedReactComponent[] = [];
  const compRegex = /(?:export\s+(?:default\s+)?)?(?:function\s+([A-Z][a-zA-Z0-9]*)|const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:React\.memo\()?(?:\([^)]*\)|[a-zA-Z0-9_]+)?\s*=>)/g;
  let compMatch;

  while ((compMatch = compRegex.exec(rawSource)) !== null) {
    const name = compMatch[1] || compMatch[2];
    if (!name) continue;

    // Estimate line start
    const index = compMatch.index;
    const lineStart = rawSource.slice(0, index).split('\n').length;

    // Search for component block
    const snippetFromIndex = rawSource.slice(index, index + 2500);
    const hooksFound = new Set<string>();
    const hookMatches = snippetFromIndex.matchAll(/\b(use[A-Z][a-zA-Z0-9]*)\b/g);
    for (const hm of hookMatches) {
      hooksFound.add(hm[1]);
    }

    // Extract props
    const propsList: string[] = [];
    const propsMatch = snippetFromIndex.match(/\(\s*\{([^}]+)\}\s*:[^)]*\)|\(\s*\{([^}]+)\}\s*\)/);
    if (propsMatch) {
      const destructured = (propsMatch[1] || propsMatch[2] || '').split(',').map(s => s.trim().split('=')[0].trim()).filter(Boolean);
      propsList.push(...destructured);
    }

    // Capture approximate component code block
    const codeLines = snippetFromIndex.split('\n').slice(0, 35).join('\n');
    const lineEnd = lineStart + Math.min(35, codeLines.split('\n').length);

    reactComponents.push({
      name,
      type: compMatch[1] ? 'functional' : 'arrow',
      props: propsList,
      hooksUsed: Array.from(hooksFound),
      code: codeLines,
      lineStart,
      lineEnd
    });
  }

  // 2. HTML Tags & Attributes
  const htmlTagsMap = new Map<string, { count: number; classes: Set<string>; attributes: Set<string> }>();
  const tagRegex = /<([a-z1-6]+)([\s\S]*?)>/gi;
  let tagMatch;

  while ((tagMatch = tagRegex.exec(rawSource)) !== null) {
    const tag = tagMatch[1].toLowerCase();
    if (tag.startsWith('!') || tag.startsWith('/')) continue;
    
    // ignore JS keywords that might look like tags in comparison
    if (['if', 'for', 'while', 'switch', 'return'].includes(tag)) continue;

    const attrString = tagMatch[2] || '';
    if (!htmlTagsMap.has(tag)) {
      htmlTagsMap.set(tag, { count: 0, classes: new Set(), attributes: new Set() });
    }
    const record = htmlTagsMap.get(tag)!;
    record.count++;

    // extract classes/classNames
    const classMatch = attrString.match(/(?:class|className)=["']([^"']+)["']/i);
    if (classMatch) {
      classMatch[1].split(/\s+/).filter(Boolean).forEach(c => record.classes.add(c));
    }

    // extract attribute names
    const attrNames = attrString.match(/([a-zA-Z0-9_-]+)(?:=|$|\s)/g);
    if (attrNames) {
      attrNames.forEach(a => {
        const clean = a.replace(/[=\s]/g, '').trim();
        if (clean && clean !== 'class' && clean !== 'className') {
          record.attributes.add(clean);
        }
      });
    }
  }

  const htmlTags: ExtractedHtmlElement[] = Array.from(htmlTagsMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      classes: Array.from(data.classes).slice(0, 15),
      sampleAttributes: Array.from(data.attributes).slice(0, 10)
    }))
    .sort((a, b) => b.count - a.count);

  // 3. CSS Rules & Tailwind Classes
  const cssRules: ExtractedCssRule[] = [];
  const cssBlockRegex = /([^{}]+)\{([^}]+)\}/g;
  let cssMatch;

  while ((cssMatch = cssBlockRegex.exec(rawSource)) !== null) {
    const selector = cssMatch[1].trim();
    if (selector.includes('@keyframes') || selector.includes('@media')) continue;
    
    // Avoid capturing JS object literals
    if (selector.includes('return') || selector.includes('const') || selector.includes('let')) continue;

    const body = cssMatch[2].trim();
    const props: Record<string, string> = {};
    body.split(';').forEach(decl => {
      const [prop, val] = decl.split(':').map(s => s.trim());
      if (prop && val) props[prop] = val;
    });

    if (Object.keys(props).length > 0 && selector.length < 80) {
      cssRules.push({
        selector,
        properties: props
      });
    }
  }

  // Extract Tailwind classes
  const tailwindSet = new Set<string>();
  const classAttrRegex = /(?:class|className)=["'`]([^"'`]+)["'`]/g;
  let cMatch;
  while ((cMatch = classAttrRegex.exec(rawSource)) !== null) {
    const tokens = cMatch[1].split(/\s+/);
    tokens.forEach(t => {
      const token = t.trim();
      if (token && (
        token.startsWith('flex') || token.startsWith('grid') || token.startsWith('p-') ||
        token.startsWith('px-') || token.startsWith('py-') || token.startsWith('m-') ||
        token.startsWith('bg-') || token.startsWith('text-') || token.startsWith('border-') ||
        token.startsWith('rounded') || token.startsWith('shadow') || token.startsWith('w-') ||
        token.startsWith('h-') || token.startsWith('gap-') || token.startsWith('items-') ||
        token.startsWith('justify-') || token.includes(':')
      )) {
        tailwindSet.add(token);
      }
    });
  }
  const tailwindClasses = Array.from(tailwindSet);

  // Extract Color Palette
  const colorSet = new Set<string>();
  const hexMatches = rawSource.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g) || [];
  hexMatches.forEach(c => colorSet.add(c.toLowerCase()));
  const rgbMatches = rawSource.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+\s*)?\)/gi) || [];
  rgbMatches.forEach(c => colorSet.add(c.toLowerCase()));
  const colorPalette = Array.from(colorSet).slice(0, 16);

  // 4. JavaScript Functions
  const jsFunctions: ExtractedJsFunction[] = [];
  const jsFnRegex = /(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*=>)/g;
  let jsMatch;
  while ((jsMatch = jsFnRegex.exec(rawSource)) !== null) {
    const name = jsMatch[1] || jsMatch[2];
    if (!name || name.charAt(0) === name.charAt(0).toUpperCase()) {
      // capital names are usually React components handled above
      continue;
    }
    const isAsync = jsMatch[0].includes('async');
    const rawParams = jsMatch[3] || jsMatch[4] || '';
    const params = rawParams.split(',').map(p => p.trim()).filter(Boolean);

    const startIdx = jsMatch.index;
    const codeSnippet = rawSource.slice(startIdx, startIdx + 300).split('\n').slice(0, 8).join('\n');

    jsFunctions.push({
      name,
      isAsync,
      params,
      code: codeSnippet,
      type: jsMatch[1] ? 'function' : 'arrow'
    });
  }

  // 5. Python Structure
  const pythonItems: ExtractedPythonItem[] = [];
  const pyDefRegex = /^[ \t]*(def|class|import|from)\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?([^\n]*)/gm;
  let pyMatch;
  while ((pyMatch = pyDefRegex.exec(rawSource)) !== null) {
    const typeKeyword = pyMatch[1];
    const name = pyMatch[2];
    const lineStart = rawSource.slice(0, pyMatch.index).split('\n').length;
    const lineCode = pyMatch[0].trim();

    let type: ExtractedPythonItem['type'] = 'function';
    if (typeKeyword === 'class') type = 'class';
    else if (typeKeyword === 'import' || typeKeyword === 'from') type = 'import';

    pythonItems.push({
      name,
      type,
      code: lineCode,
      lineStart
    });
  }

  // 6. Assets & Media
  const assets: ExtractedAsset[] = [];
  // Images
  const imgRegex = /(?:src|href)=["'](https?:\/\/[^"']+\.(?:png|jpe?g|svg|webp|gif|ico))["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(rawSource)) !== null) {
    assets.push({
      type: imgMatch[1].endsWith('.svg') ? 'svg' : 'image',
      url: imgMatch[1],
      context: imgMatch[0]
    });
  }
  // Data URIs
  const dataUriRegex = /["'](data:image\/[^;]+;base64,[^"']+)["']/g;
  let dataMatch;
  while ((dataMatch = dataUriRegex.exec(rawSource)) !== null) {
    assets.push({
      type: 'data-uri',
      url: dataMatch[1].slice(0, 80) + '...',
      context: 'Base64 Inline Image'
    });
  }
  // Fonts
  const fontRegex = /(?:https?:\/\/fonts\.googleapis\.com\/css2?[^"'\s]+)/gi;
  let fontMatch;
  while ((fontMatch = fontRegex.exec(rawSource)) !== null) {
    assets.push({
      type: 'font',
      url: fontMatch[0],
      context: 'Google Fonts Stylesheet'
    });
  }
  // External Links
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(rawSource)) !== null) {
    if (!linkMatch[1].match(/\.(png|jpe?g|svg|webp|gif|css)$/)) {
      assets.push({
        type: 'link',
        url: linkMatch[1],
        context: 'External Link'
      });
    }
  }

  return {
    reactComponents,
    htmlTags,
    cssRules,
    tailwindClasses,
    colorPalette,
    jsFunctions,
    pythonItems,
    assets: assets.slice(0, 30),
    rawStats: {
      lines: lines.length,
      characters,
      words,
      languagesDetected
    }
  };
}
