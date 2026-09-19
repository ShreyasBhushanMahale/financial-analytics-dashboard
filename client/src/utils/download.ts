/** Saves a Blob through the browser's normal download flow, under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in some browsers; a moment later is safe.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
