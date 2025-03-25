import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source directly from the node_modules path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;