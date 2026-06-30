'use client';

import { useState } from 'react';

interface UsePdfExport {
  downloadPdf: (jobId: string) => Promise<void>;
  isDownloading: boolean;
}

export function usePdfExport(): UsePdfExport {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = async (jobId: string): Promise<void> => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('question-paper-content');
      if (!element) throw new Error('Could not find the question paper element.');

      // Import html2pdf dynamically so it doesn't break SSR
      const html2pdf = (await import('html2pdf.js')).default;

      // Ensure the element is not constrained by its scroll container for printing
      const originalStyle = element.style.cssText;
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      element.style.position = 'static';

      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename:     `flux-paper-${jobId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, windowWidth: 1024 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();

      // Restore original styling
      element.style.cssText = originalStyle;
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadPdf, isDownloading };
}
