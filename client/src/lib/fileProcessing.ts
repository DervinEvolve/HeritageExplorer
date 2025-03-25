import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source using relative URL to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read PDF file');
        }

        const arrayBuffer = e.target.result as ArrayBuffer;
        console.log('Starting PDF processing...');

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/cmaps/',
          cMapPacked: true,
          isEvalSupported: false,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .filter((item: any) => item.str && typeof item.str === 'string')
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
          console.log(`Processed page ${i}/${pdf.numPages}`);
        }

        resolve(fullText.trim());
      } catch (error) {
        console.error('PDF processing error: ', error);
        reject(error instanceof Error ? error : new Error('Failed to process PDF'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function readTextFile(file: File, onProgress: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string ?? '');
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.readAsText(file);
  });
}