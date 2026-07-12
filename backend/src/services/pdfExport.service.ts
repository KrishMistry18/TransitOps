/**
 * Minimal dependency-free PDF generator for tabular reports (Req 10.8).
 * Avoids adding a PDF library dependency for a single simple use case — writes
 * raw PDF syntax (one page, monospace text lines) directly.
 */
export function buildSimplePdf(title: string, headers: string[], rows: string[][]): Buffer {
  const lines: string[] = [title, '', headers.join('  |  ')];
  lines.push('-'.repeat(Math.min(100, lines[2].length)));
  for (const row of rows) {
    lines.push(row.join('  |  '));
  }

  const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const fontSize = 9;
  const leading = 12;
  const startY = 780;
  let contentStream = `BT /F1 ${fontSize} Tf ${leading} TL 40 ${startY} Td\n`;
  for (const line of lines) {
    contentStream += `(${escapeText(line)}) Tj T*\n`;
  }
  contentStream += 'ET';

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'); // 2
  objects.push('<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>'); // 3
  objects.push(`<< /Length ${Buffer.byteLength(contentStream, 'utf-8')} >>\nstream\n${contentStream}\nendstream`); // 4
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'); // 5

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}
