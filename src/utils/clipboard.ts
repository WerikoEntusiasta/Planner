/**
 * Copies text to clipboard reliably across HTTPS, HTTP, and iframe environments.
 * Uses Clipboard API if available, with a fallback to document.execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available (HTTPS / localhost / allowed contexts)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText failed, falling back to execCommand:', err);
    }
  }

  // 2. Fallback to document.execCommand('copy') using a temporary textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Position out of viewport and make invisible
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch (fallbackErr) {
    console.error('[Clipboard] Fallback execCommand copy failed:', fallbackErr);
    return false;
  }
}
