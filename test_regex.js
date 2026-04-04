const text = 'This is **bold** and *italic* text.'
console.log(
  'REGEX 1 (/\\*\\*(.*?)\\*\\*/g):',
  text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
)
console.log(
  'REGEX 2 (original code /\\\\*\\\\*(.*?)\\\\*\\\\*/g):',
  text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>'),
)
