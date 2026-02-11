'use client';

import { useState, useCallback } from 'react';

const codeBlocks: Record<string, string> = {
  curl: `# Remove background from image
curl -X POST https://api.clearcut.ai/v1/remove-bg \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image_file=@input.jpg" \\
  -F "size=auto" \\
  --output output.png`,
  python: `import requests

response = requests.post(
    'https://api.clearcut.ai/v1/remove-bg',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    files={'image_file': open('input.jpg', 'rb')},
    data={'size': 'auto'}
)

with open('output.png', 'wb') as f:
    f.write(response.content)`,
  node: `const axios = require('axios');
const fs = require('fs');

const form = new FormData();
form.append('image_file', fs.createReadStream('input.jpg'));

axios.post('https://api.clearcut.ai/v1/remove-bg', form, {
    headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        ...form.getHeaders()
    },
    responseType: 'stream'
}).then(response => {
    response.data.pipe(fs.createWriteStream('output.png'));
});`,
  php: `<?php

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.clearcut.ai/v1/remove-bg');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'image_file' => new CURLFile('input.jpg')
]);

$response = curl_exec($ch);
file_put_contents('output.png', $response);`,
};

const tabs = [
  { key: 'curl', label: 'cURL' },
  { key: 'python', label: 'Python' },
  { key: 'node', label: 'Node.js' },
  { key: 'php', label: 'PHP' },
];

function highlightCode(code: string, lang: string) {
  if (lang === 'curl') {
    return code
      .replace(/(#[^\n]*)/g, '<span class="text-text-dim">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-accent-2">$1</span>');
  }
  if (lang === 'python') {
    return code
      .replace(/\b(import|with|as)\b/g, '<span class="text-accent">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-accent-2">$1</span>')
      .replace(/\b(open|write)\b(?=\()/g, '<span class="text-code-fn">$1</span>');
  }
  if (lang === 'node') {
    return code
      .replace(/\b(const|new)\b/g, '<span class="text-accent">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-accent-2">$1</span>')
      .replace(/\b(require|createReadStream|post|pipe|createWriteStream)\b(?=[\(.])/g, '<span class="text-code-fn">$1</span>');
  }
  if (lang === 'php') {
    return code
      .replace(/(<\?php|\btrue\b|\bnew\b)/g, '<span class="text-accent">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-accent-2">$1</span>')
      .replace(/\b(curl_init|curl_setopt|curl_exec|file_put_contents)\b/g, '<span class="text-code-fn">$1</span>');
  }
  return code;
}

export default function CodeBlock() {
  const [codeTab, setCodeTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeBlocks[codeTab] || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [codeTab]);

  return (
    <div className="pb-25">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-surface-light border-b border-border">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`px-4 py-2 text-[13px] font-medium border-none rounded-md cursor-pointer transition-all duration-300 font-[inherit] ${codeTab === t.key ? 'bg-surface text-text' : 'bg-transparent text-text-muted hover:text-text'}`}
                onClick={() => setCodeTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            className={`px-4 py-2 text-[13px] font-medium rounded-md cursor-pointer transition-all duration-300 flex items-center gap-1.5 font-[inherit] ${
              copied
                ? 'bg-accent-2 text-bg border-accent-2 border'
                : 'bg-surface border border-border text-text hover:bg-surface-hover'
            }`}
            onClick={copyCode}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          <pre className="m-0 font-mono text-sm leading-relaxed text-text">
            <code dangerouslySetInnerHTML={{ __html: highlightCode(codeBlocks[codeTab] || '', codeTab) }} />
          </pre>
        </div>
      </div>
    </div>
  );
}
