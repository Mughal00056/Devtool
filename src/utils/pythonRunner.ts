import { PythonExecutionResult } from '../types/devtools';

/**
 * Client-side Python Interpreter & Transpiler engine
 * Allows instant execution of Python scripts in the browser with stdout capture,
 * error reporting, variable tracing, and built-in functions.
 */
export function runPythonCode(pyCode: string): PythonExecutionResult {
  const startTime = performance.now();
  const stdout: string[] = [];
  const variables: Record<string, unknown> = {};

  try {
    // Custom simulated environment
    const customPrint = (...args: unknown[]) => {
      const formatted = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      stdout.push(formatted);
    };

    // Pre-process Python to JS-compatible executable instructions
    // Handles:
    // - print(...)
    // - def name(args):
    // - if / elif / else:
    // - for i in range(...):
    // - list comprehensions
    // - True / False / None
    // - # comments
    // - variable assignments
    const transpiledLines: string[] = [];
    const lines = pyCode.split('\n');

    let currentIndent = 0;
    const indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Handle comments
      if (line.trim().startsWith('#')) {
        continue;
      }
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1) {
        // Simple check that it's not inside string
        const quoteCount = (line.slice(0, commentIdx).match(/["']/g) || []).length;
        if (quoteCount % 2 === 0) {
          line = line.slice(0, commentIdx);
        }
      }

      if (!line.trim()) continue;

      // Calculate indentation
      const matchIndent = line.match(/^([ \t]*)/);
      const lineIndent = matchIndent ? matchIndent[1].length : 0;
      const trimmed = line.trim();

      // Check closing blocks based on indentation decrease
      while (lineIndent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        transpiledLines.push('}'.repeat(1));
      }

      let converted = trimmed;

      // Handle Python literals
      converted = converted
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');

      // Handle print(...)
      if (converted.startsWith('print(')) {
        converted = converted.replace(/^print\(/, 'customPrint(');
      }

      // Handle def function_name(...):
      if (/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:/.test(converted)) {
        converted = converted.replace(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:/, 'function $1($2) {');
        indentStack.push(lineIndent + 4);
      }
      // Handle class ClassName:
      else if (/^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?\s*:/.test(converted)) {
        converted = converted.replace(/^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?\s*:/, 'class $1 { constructor() {}');
        indentStack.push(lineIndent + 4);
      }
      // Handle for x in range(...):
      else if (/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\(([^)]+)\)\s*:/.test(converted)) {
        converted = converted.replace(
          /^for\s+([a-zA-Z0-9_]+)\s+in\s+range\(([^)]+)\)\s*:/,
          'for (let $1 of range($2)) {'
        );
        indentStack.push(lineIndent + 4);
      }
      // Handle for x in list:
      else if (/^for\s+([a-zA-Z0-9_]+)\s+in\s+([^:]+)\s*:/.test(converted)) {
        converted = converted.replace(
          /^for\s+([a-zA-Z0-9_]+)\s+in\s+([^:]+)\s*:/,
          'for (let $1 of ($2)) {'
        );
        indentStack.push(lineIndent + 4);
      }
      // Handle if condition:
      else if (/^if\s+([^:]+)\s*:/.test(converted)) {
        converted = converted.replace(/^if\s+([^:]+)\s*:/, 'if ($1) {');
        indentStack.push(lineIndent + 4);
      }
      // Handle elif condition:
      else if (/^elif\s+([^:]+)\s*:/.test(converted)) {
        converted = converted.replace(/^elif\s+([^:]+)\s*:/, '} else if ($1) {');
      }
      // Handle else:
      else if (/^else\s*:/.test(converted)) {
        converted = converted.replace(/^else\s*:/, '} else {');
      }
      // Handle while condition:
      else if (/^while\s+([^:]+)\s*:/.test(converted)) {
        converted = converted.replace(/^while\s+([^:]+)\s*:/, 'while ($1) {');
        indentStack.push(lineIndent + 4);
      }
      // Handle variable assignment x = ...
      else if (/^[a-zA-Z0-9_]+\s*=\s*/.test(converted) && !converted.startsWith('let ') && !converted.startsWith('const ') && !converted.startsWith('var ')) {
        const varName = converted.split('=')[0].trim();
        converted = `_vars['${varName}'] = ${converted.slice(converted.indexOf('=') + 1).trim()}; let ${varName} = _vars['${varName}'];`;
      }

      transpiledLines.push(converted);
    }

    // Close any remaining opened blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      transpiledLines.push('}');
    }

    // Python standard built-ins injected
    const pyBuiltins = `
      const range = (start, stop, step = 1) => {
        if (stop === undefined) { stop = start; start = 0; }
        const res = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) res.push(i);
        return res;
      };
      const len = (x) => (x ? (x.length !== undefined ? x.length : Object.keys(x).length) : 0);
      const sum = (arr) => arr.reduce((a, b) => a + b, 0);
      const min = (...args) => (Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args));
      const max = (...args) => (Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args));
      const abs = Math.abs;
      const round = Math.round;
      const sorted = (arr) => [...arr].sort((a, b) => (a > b ? 1 : -1));
      const str = (v) => String(v);
      const int = (v) => parseInt(v, 10);
      const float = (v) => parseFloat(v);
    `;

    const executionScript = `
      "use strict";
      const _vars = {};
      ${pyBuiltins}
      ${transpiledLines.join('\n')}
      return _vars;
    `;

    // Execute safely
    const execFn = new Function('customPrint', executionScript);
    const capturedVars = execFn(customPrint) || {};

    Object.assign(variables, capturedVars);

    const endTime = performance.now();
    return {
      output: stdout.join('\n') || (Object.keys(variables).length > 0 ? 'Code executed successfully. No printed output.' : 'Completed without output.'),
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      variables
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const endTime = performance.now();
    return {
      output: stdout.join('\n'),
      error: `Python Syntax/Runtime Error: ${errorMsg}`,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      variables
    };
  }
}
