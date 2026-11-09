export class PrintWindowBlockedError extends Error {
  constructor() { super('The print window was blocked'); this.name = 'PrintWindowBlockedError'; }
}

/** Reserve the print window during the user's click, before async rendering. */
export function openA4PrintWindow(title: string, preparing: string, cancel: string, onCancel: () => void): Window {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new PrintWindowBlockedError();
  try {
    const doc = printWindow.document;
    doc.open(); doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'); doc.close();
    doc.title = title;
    const style = doc.createElement('style');
    style.textContent = `body { margin:0; min-height:100vh; display:grid; place-items:center; background:#f6f1dc; color:#2c2416; font:16px system-ui,sans-serif; }
      main { width:min(420px,calc(100vw - 48px)); padding:24px; border-radius:8px; background:#fcfcfc; box-shadow:0 8px 32px #0002; }
      progress { width:100%; accent-color:#0078ba; } button { min-height:40px; padding:0 16px; border:1px solid #888; border-radius:6px; background:#fff; cursor:pointer; }`;
    doc.head.appendChild(style);
    const main = doc.createElement('main');
    const text = doc.createElement('p'); text.dataset.printProgressText = 'true'; text.textContent = preparing;
    const progress = doc.createElement('progress'); progress.dataset.printProgress = 'true';
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = cancel;
    button.addEventListener('click', () => { onCancel(); printWindow.close(); });
    main.append(text, progress, button); doc.body.appendChild(main);
    return printWindow;
  } catch (error) { printWindow.close(); throw error; }
}

export function updateA4PrintProgress(printWindow: Window | null, text: string, current: number, total: number): void {
  if (!printWindow || printWindow.closed) return;
  try {
    const label = printWindow.document.querySelector<HTMLElement>('[data-print-progress-text]');
    const progress = printWindow.document.querySelector<HTMLProgressElement>('[data-print-progress]');
    if (label) label.textContent = text;
    if (progress && total > 0) { progress.max = total; progress.value = current; }
  } catch {
    // The user may have navigated or closed the reserved window during rendering.
  }
}

/** Opens the browser's print UI with only the already-rendered A4 pages. */
export function printA4Pages(pages: Array<{ blob: Blob }>, title: string, printLabel: string, reservedWindow?: Window): Promise<void> {
  // This must run synchronously in the click handler to preserve popup permission.
  const printWindow = reservedWindow || window.open('', '_blank');
  if (!printWindow || printWindow.closed) throw new PrintWindowBlockedError();

  const urls: string[] = [];
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    urls.forEach(url => URL.revokeObjectURL(url));
  };
  try {
    const doc = printWindow.document;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
    doc.close();
    doc.title = title;
    const style = doc.createElement('style');
    style.textContent = `
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; padding: 0; width: 210mm; background: #fff; }
      .print-page { width: 210mm; height: 297mm; margin: 0; padding: 0;
        overflow: hidden; break-after: page; page-break-after: always; }
      .print-page:last-child { break-after: auto; page-break-after: auto; }
      .print-page img { display: block; width: 100%; height: 100%; }
      .print-tools { position: sticky; top: 0; padding: 12px; background: #fcfcfc; text-align: right; }
      .print-tools button { min-height: 40px; padding: 0 16px; border: 0; border-radius: 6px;
        background: #0078ba; color: #fff; font: 600 14px system-ui, sans-serif; cursor: pointer; }
      .print-tools button:disabled { opacity: .5; cursor: default; }
      @media print { .print-tools { display: none; } }
      @media screen { html, body { margin: 0 auto; background: #e5e3dc; } }
    `;
    doc.head.appendChild(style);
    // If the browser suppresses the automatic dialog, this remains a direct
    // user-gesture fallback and is never included in the printed pages.
    const tools = doc.createElement('div'); tools.className = 'print-tools';
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = printLabel; button.disabled = true;
    button.addEventListener('click', () => printWindow.print());
    tools.appendChild(button); doc.body.appendChild(tools);
    const images = pages.map((page, index) => {
      const section = doc.createElement('section'); section.className = 'print-page';
      const image = doc.createElement('img'); image.alt = `${index + 1}`;
      const url = URL.createObjectURL(page.blob); urls.push(url); image.src = url;
      section.appendChild(image); doc.body.appendChild(section);
      return image;
    });
    printWindow.addEventListener('beforeunload', cleanup, { once: true });
    printWindow.addEventListener('afterprint', () => { cleanup(); printWindow.close(); }, { once: true });
    return Promise.all(images.map(image => image.decode())).then(() => {
      if (printWindow.closed) { cleanup(); return; }
      button.disabled = false;
      printWindow.focus();
      printWindow.print();
    }).catch(error => { cleanup(); if (!printWindow.closed) { printWindow.close(); throw error; } });
  } catch (error) {
    cleanup(); printWindow.close(); throw error;
  }
}
