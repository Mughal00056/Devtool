import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import { SupportedLanguage } from '../types/devtools';

export function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return '';

  let grammar = Prism.languages.markup;
  let langId = 'markup';

  switch (language) {
    case 'tsx':
      grammar = Prism.languages.tsx || Prism.languages.jsx || Prism.languages.javascript;
      langId = 'tsx';
      break;
    case 'javascript':
      grammar = Prism.languages.javascript;
      langId = 'javascript';
      break;
    case 'css':
      grammar = Prism.languages.css;
      langId = 'css';
      break;
    case 'html':
      grammar = Prism.languages.markup;
      langId = 'markup';
      break;
    case 'python':
      grammar = Prism.languages.python;
      langId = 'python';
      break;
    default:
      grammar = Prism.languages.markup;
  }

  try {
    return Prism.highlight(code, grammar, langId);
  } catch (err) {
    console.error('Highlight error', err);
    // Escape HTML as fallback
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
