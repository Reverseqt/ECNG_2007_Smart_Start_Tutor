import * as pdfjsLib from './vendor/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.mjs';

let currentMetadata = null;
let currentDatasheet = null;
let currentPageIndex = 0;
let pdfDoc = null;

async function loadDatasheet(datasheetId = "SN74LS00") {
  const metadataPath = '../../docs/tests/p2b-fixtures/mock_datasheet.json';
  const response = await fetch(metadataPath);
  if (!response.ok) throw new Error(`HTTP ${response.status} loading metadata`);

  currentMetadata = await response.json();
  currentDatasheet = currentMetadata.datasheets.find(d => d.datasheetId === datasheetId);
  
  if (!currentDatasheet) throw new Error(`Datasheet ${datasheetId} not found`);

  // Load the PDF file
  const loadingTask = pdfjsLib.getDocument({ url: currentDatasheet.documentPath });
  pdfDoc = await loadingTask.promise;

  // Populate Page Dropdown Options
  const pageSelect = document.getElementById('page-select');
  pageSelect.innerHTML = '';
  currentDatasheet.pages.forEach((p, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `Page ${p.pageNumber}`;
    pageSelect.appendChild(opt);
  });

  document.getElementById('total-pages').innerText = pdfDoc.numPages;
  
  // Render initial page (Page 0 in metadata array)
  currentPageIndex = 0;
  await renderPage(currentPageIndex);
}

async function renderPage(pageIndex) {
  if (!currentDatasheet || !pdfDoc) return;

  const pageMeta = currentDatasheet.pages[pageIndex];
  const page = await pdfDoc.getPage(pageMeta.pageNumber);

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

  // Update Page Label Indicator
  document.getElementById('current-page-num').innerText = pageMeta.pageNumber;
  document.getElementById('page-select').value = pageIndex;

  // Render Overlays for THIS specific page
  const overlayLayer = document.getElementById('overlay-layer');
  overlayLayer.innerHTML = '';
  overlayLayer.style.width = `${viewport.width}px`;
  overlayLayer.style.height = `${viewport.height}px`;

  pageMeta.parameters.forEach(param => {
    const spot = document.createElement('div');
    spot.className = 'hotspot';
    spot.style.left = `${param.bbox.x * scale}px`;
    spot.style.top = `${param.bbox.y * scale}px`;
    spot.style.width = `${param.bbox.width * scale}px`;
    spot.style.height = `${param.bbox.height * scale}px`;

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.innerText = `${param.symbol || param.id}: ${param.value}`;
    spot.appendChild(tooltip);

    overlayLayer.appendChild(spot);
  });
}

// Event Listeners for Page Navigation Controls
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    renderPage(currentPageIndex);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentPageIndex < currentDatasheet.pages.length - 1) {
    currentPageIndex++;
    renderPage(currentPageIndex);
  }
});

document.getElementById('page-select').addEventListener('change', (e) => {
  currentPageIndex = parseInt(e.target.value, 10);
  renderPage(currentPageIndex);
});

document.getElementById('datasheet-select').addEventListener('change', (e) => {
  loadDatasheet(e.target.value);
});

// Initialize on page load
loadDatasheet('SN74LS00').catch(err => console.error('Viewer Error:', err));