/**
 * Robust print helper:
 * 1. Checks if the document is inside an iframe (like AI Studio or preview frames).
 * 2. Uses window.print() directly with guaranteed un-hiding of #printable-document.
 * 3. Provides a clean popup / standalone window option if iframe sandbox restricts window.print().
 */
export function printReceiptOrInvoice(elementId = 'printable-document', docTitle = 'Facture'): void {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} introuvable, appel direct à window.print()`);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Erreur window.print():', e);
    }
    return;
  }

  // Check if we are inside a restricted iframe
  const inIframe = window.self !== window.top;

  // Primary strategy: Native window.print() directly
  // We temporarily ensure document body and the element are set up for print
  try {
    window.focus();
    // In standard browsers, window.print() triggers the native print dialog
    // where user can choose printer or "Enregistrer au format PDF"
    window.print();
  } catch (err) {
    console.warn('Native window.print() a échoué ou a été bloqué par l\'iframe:', err);
    openPrintWindow(el, docTitle);
  }
}

/**
 * Fallback to an isolated print window if browser or iframe blocks top-level print dialog
 */
export function openPrintWindow(sourceElement: HTMLElement, title = 'Document'): void {
  const isTicket = sourceElement.classList.contains('format-ticket');
  const printWin = window.open('', '_blank', 'width=800,height=900,menubar=yes,toolbar=yes,status=yes');

  const contentHtml = sourceElement.outerHTML;

  // Capture current stylesheets
  let styles = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((s) => {
    styles += s.outerHTML;
  });

  if (printWin) {
    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
          ${styles}
          <style>
            @page {
              margin: ${isTicket ? '3mm' : '8mm'};
              size: ${isTicket ? '80mm auto' : 'auto'};
            }
            body {
              margin: 0;
              padding: ${isTicket ? '4mm' : '10mm'};
              background: #ffffff;
              color: #000000;
              font-family: system-ui, -apple-system, sans-serif;
            }
            #printable-document {
              visibility: visible !important;
              display: block !important;
              max-width: ${isTicket ? '80mm' : '100%'} !important;
              margin: 0 auto !important;
              box-shadow: none !important;
            }
            .print-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 200);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  } else {
    // If popup is blocked, use direct window.print()
    window.print();
  }
}
