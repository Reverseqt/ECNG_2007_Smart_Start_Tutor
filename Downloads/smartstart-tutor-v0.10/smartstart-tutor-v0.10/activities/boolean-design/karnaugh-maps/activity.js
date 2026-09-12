"use strict";
(() => {
  const gray = [0, 1, 3, 2];
  const mintermAt = (row, col) => (gray[row] << 2) | gray[col];
  const cellOrder = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => mintermAt(row, col)));
  const ones = new Set([0,1,2,4,7,8,9,11,13,14,15]);
  const primeImplicants = [
    { id: "P1", cells: [0,1,8,9], expression: "X′Y′" },
    { id: "P2", cells: [9,11,13,15], expression: "WZ" },
    { id: "P3", cells: [0,2], expression: "W′X′Z′" },
    { id: "P4", cells: [14,15], expression: "WXY" },
    { id: "P5", cells: [7,15], expression: "XYZ" },
    { id: "P6", cells: [0,4], expression: "W′Y′Z′" }
  ];
  const found = new Set();

  function mapMarkup(idPrefix, showValues) {
    let html = `<div class="kmap-corner">WX<br>YZ</div>`;
    gray.forEach(value => { html += `<div class="kmap-axis">${value.toString(2).padStart(2,"0")}</div>`; });
    cellOrder.forEach((row, rowIndex) => {
      html += `<div class="kmap-axis">${gray[rowIndex].toString(2).padStart(2,"0")}</div>`;
      row.forEach(minterm => {
        const value = showValues ? Number(ones.has(minterm)) : "";
        html += `<button class="kmap-cell" id="${idPrefix}-${minterm}" data-minterm="${minterm}" type="button"><span class="minterm">m${minterm}</span><span class="value">${value}</span><span class="group-tags"></span></button>`;
      });
    });
    return html;
  }

  const adjacencyMap = document.getElementById("adjacency-map");
  adjacencyMap.innerHTML = mapMarkup("adj", false);
  const adjacencyDescription = document.getElementById("adjacency-description");

  function coordinates(minterm) {
    for (let r=0; r<4; r++) for (let c=0; c<4; c++) if (cellOrder[r][c] === minterm) return [r,c];
    return [0,0];
  }
  function adjacentMinterms(minterm) {
    const [r,c] = coordinates(minterm);
    return [cellOrder[(r+3)%4][c], cellOrder[(r+1)%4][c], cellOrder[r][(c+3)%4], cellOrder[r][(c+1)%4]];
  }
  function selectAdjacency(minterm) {
    adjacencyMap.querySelectorAll(".kmap-cell").forEach(cell => cell.classList.remove("selected","adjacent"));
    adjacencyMap.querySelector(`[data-minterm="${minterm}"]`)?.classList.add("selected");
    const adjacent = adjacentMinterms(minterm);
    adjacent.forEach(value => adjacencyMap.querySelector(`[data-minterm="${value}"]`)?.classList.add("adjacent"));
    adjacencyDescription.textContent = `m${minterm} is adjacent to m${adjacent.join(", m")}.`;
  }
  adjacencyMap.addEventListener("click", event => { const cell = event.target.closest(".kmap-cell"); if (cell) selectAdjacency(Number(cell.dataset.minterm)); });
  document.getElementById("clear-adjacency").addEventListener("click", () => { adjacencyMap.querySelectorAll(".kmap-cell").forEach(cell => cell.classList.remove("selected","adjacent")); adjacencyDescription.textContent = "Select a cell to begin."; });

  const piMap = document.getElementById("pi-map");
  piMap.innerHTML = mapMarkup("pi", true);
  const selected = new Set();
  piMap.addEventListener("click", event => {
    const cell = event.target.closest(".kmap-cell"); if (!cell) return;
    const m = Number(cell.dataset.minterm);
    if (!ones.has(m)) return;
    selected.has(m) ? selected.delete(m) : selected.add(m);
    cell.classList.toggle("selected", selected.has(m));
  });

  const piList = document.getElementById("pi-list");
  function renderPiList() {
    piList.innerHTML = primeImplicants.map(pi => `<article class="pi-item ${found.has(pi.id) ? "found" : ""}"><span class="pi-badge">${pi.id}</span><div><strong>${pi.cells.map(m=>`m${m}`).join(", ")}</strong><div class="pi-expression">${pi.expression}</div></div><span>${found.has(pi.id) ? "Found" : "Not found"}</span></article>`).join("");
    piMap.querySelectorAll(".group-tags").forEach(tagBox => { tagBox.innerHTML = ""; });
    primeImplicants.filter(pi => found.has(pi.id)).forEach(pi => pi.cells.forEach(m => {
      const box = piMap.querySelector(`[data-minterm="${m}"] .group-tags`);
      if (box) box.insertAdjacentHTML("beforeend", `<span class="group-tag">${pi.id}</span>`);
    }));
  }
  renderPiList();
  function sameSet(a, b) { return a.size === b.length && b.every(value => a.has(value)); }
  const piFeedback = document.getElementById("pi-feedback");
  function clearSelection() { selected.clear(); piMap.querySelectorAll(".kmap-cell").forEach(cell => cell.classList.remove("selected")); }
  document.getElementById("clear-group").addEventListener("click", clearSelection);
  document.getElementById("check-group").addEventListener("click", () => {
    if (!selected.size) { piFeedback.className="feedback incorrect"; piFeedback.textContent="Select all cells in one group first."; return; }
    const match = primeImplicants.find(pi => sameSet(selected, pi.cells));
    if (!match) { piFeedback.className="feedback incorrect"; piFeedback.textContent="That selection is not one of the six largest valid groups. Check adjacency, wrap-around and group size."; return; }
    if (found.has(match.id)) { piFeedback.className="feedback"; piFeedback.textContent=`${match.id} was already found.`; clearSelection(); return; }
    found.add(match.id); renderPiList(); clearSelection();
    piFeedback.className="feedback correct"; piFeedback.textContent=`Correct: ${match.id} gives ${match.expression}. ${found.size} of ${primeImplicants.length} prime implicants found.`;
  });
  document.getElementById("reveal-groups").addEventListener("click", () => { primeImplicants.forEach(pi=>found.add(pi.id)); renderPiList(); clearSelection(); piFeedback.className="feedback"; piFeedback.textContent="All six original prime implicants are shown. Revealing them does not complete the activity; use the completion check below."; });

  document.getElementById("kmap-check").addEventListener("submit", event => {
    event.preventDefault();
    const questionsCorrect = document.getElementById("wrap-choice").value === "edge" && document.getElementById("group-choice").value === "power";
    const groupsComplete = found.size === primeImplicants.length;
    const feedback = document.getElementById("kmap-feedback");
    if (questionsCorrect && groupsComplete) {
      feedback.className="feedback correct"; feedback.textContent="Correct. You identified the six recovered prime implicants and the key K-map adjacency rules. Karnaugh Maps is complete.";
      globalThis.SmartStartProgress?.complete("karnaugh-maps");
    } else {
      feedback.className="feedback incorrect";
      feedback.textContent = `${groupsComplete ? "The groups are complete." : `Find all six prime implicants (${found.size}/6 found).`} ${questionsCorrect ? "The questions are correct." : "Recheck the wrap-around and valid group-size questions."}`;
    }
  });
})();