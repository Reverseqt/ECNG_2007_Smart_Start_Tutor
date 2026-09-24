import * as pdfjsLib from './vendor/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.mjs';

async function initDatasheetViewer() {
  const metadataPath = '../../docs/tests/p2b-fixtures/mock_datasheet.json';
  const metadataResponse = await fetch(metadataPath);

  if (!metadataResponse.ok) {
    throw new Error(`Failed to load JSON metadata (${metadataResponse.status}) at ${metadataPath}`);
  }

  const metadata = await metadataResponse.json();

  // Validate documentPath before calling PDF.js
  if (!metadata.documentPath) {
    throw new Error('mock_datasheet.json is missing the "documentPath" key.');
  }

  const pageMeta = metadata.pages[0];

  // Modern PDF.js ES module syntax requires { url: ... }
  const loadingTask = pdfjsLib.getDocument({ url: metadata.documentPath });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageMeta.pageNumber);

  const scale = 1.25;
  const viewport = page.getViewport({ scale });
  const canvas = document.getElementById('pdf-canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  const overlayLayer = document.getElementById('overlay-layer');
  overlayLayer.innerHTML = '';

  pageMeta.parameters.forEach(param => {
    const spot = document.createElement('div');
    spot.className = 'hotspot';
    spot.style.left = `${param.bbox.x * scale}px`;
    spot.style.top = `${param.bbox.y * scale}px`;
    spot.style.width = `${param.bbox.width * scale}px`;
    spot.style.height = `${param.bbox.height * scale}px`;

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.innerText = `${param.name}: ${param.value}`;
    spot.appendChild(tooltip);

    overlayLayer.appendChild(spot);
  });
}

initDatasheetViewer().catch(err => {
  console.error('Error initializing PDF.js viewer prototype:', err);
  const container = document.getElementById('viewer-container');
  if (container) {
    container.innerHTML = `<p style="color: red; padding: 10px;"><b>Error:</b> ${err.message}</p>`;
  }
});