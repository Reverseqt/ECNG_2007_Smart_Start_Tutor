"use strict";

(() => {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    index,
    bits: [(index >> 2) & 1, (index >> 1) & 1, index & 1]
  }));
  const variables = ["A", "B", "C"];

  function minterm(row) {
    return row.bits.map((bit, i) => bit ? variables[i] : `${variables[i]}′`).join(" · ");
  }
  function maxterm(row) {
    return `(${row.bits.map((bit, i) => bit ? `${variables[i]}′` : variables[i]).join(" + ")})`;
  }

  const selector = document.getElementById("term-selector");
  selector.innerHTML = rows.map(row => `<button type="button" data-index="${row.index}">${row.index}</button>`).join("");
  function selectRow(index) {
    const row = rows[index];
    selector.querySelectorAll("button").forEach(button => button.classList.toggle("active", Number(button.dataset.index) === index));
    document.getElementById("selected-row").innerHTML = `<td>${index}</td>${row.bits.map(bit => `<td>${bit}</td>`).join("")}`;
    document.getElementById("minterm-title").textContent = `Minterm m${index}`;
    document.getElementById("minterm-expression").textContent = minterm(row);
    document.getElementById("maxterm-title").textContent = `Maxterm M${index}`;
    document.getElementById("maxterm-expression").textContent = maxterm(row);
  }
  selector.addEventListener("click", event => {
    const button = event.target.closest("button[data-index]");
    if (button) selectRow(Number(button.dataset.index));
  });
  selectRow(0);

  const outputs = Array(8).fill(0);
  const outputGrid = document.getElementById("output-grid");
  outputGrid.innerHTML = rows.map(row => `<label>m${row.index}<span>${row.bits.join("")}</span><button type="button" data-output="${row.index}" aria-pressed="false">0</button></label>`).join("");

  function updateCanonicalResults() {
    const ones = rows.filter(row => outputs[row.index] === 1);
    const zeros = rows.filter(row => outputs[row.index] === 0);
    document.getElementById("sigma-result").textContent = ones.length ? `F = Σm(${ones.map(row => row.index).join(",")})` : "F = 0";
    document.getElementById("sop-result").textContent = ones.length ? `F = ${ones.map(minterm).join(" + ")}` : "F = 0";
    document.getElementById("pi-result").textContent = zeros.length ? `F = ΠM(${zeros.map(row => row.index).join(",")})` : "F = 1";
    document.getElementById("pos-result").textContent = zeros.length ? `F = ${zeros.map(maxterm).join(" · ")}` : "F = 1";
  }
  outputGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-output]");
    if (!button) return;
    const index = Number(button.dataset.output);
    outputs[index] = Number(!outputs[index]);
    button.textContent = String(outputs[index]);
    button.classList.toggle("on", Boolean(outputs[index]));
    button.setAttribute("aria-pressed", String(Boolean(outputs[index])));
    updateCanonicalResults();
  });
  updateCanonicalResults();

  const targetMinterms = new Set([1, 3, 4, 5, 6, 7]);
  const targetMaxterms = new Set([0, 2]);
  const makeChoices = (containerId, prefix) => {
    const container = document.getElementById(containerId);
    container.innerHTML = rows.map(row => `<label><input type="checkbox" value="${row.index}"> ${prefix}${row.index} (${row.bits.join("")})</label>`).join("");
  };
  makeChoices("minterm-choices", "m");
  makeChoices("maxterm-choices", "M");

  function selectedSet(containerId) {
    return new Set([...document.querySelectorAll(`#${containerId} input:checked`)].map(input => Number(input.value)));
  }
  function setsEqual(a, b) {
    return a.size === b.size && [...a].every(value => b.has(value));
  }

  const challengeForm = document.getElementById("challenge-form");
  const feedback = document.getElementById("challenge-feedback");
  challengeForm.addEventListener("submit", event => {
    event.preventDefault();
    const mintermsCorrect = setsEqual(selectedSet("minterm-choices"), targetMinterms);
    const maxtermsCorrect = setsEqual(selectedSet("maxterm-choices"), targetMaxterms);
    const simplifiedCorrect = document.getElementById("simplified-choice").value === "x+z";
    const correctCount = [mintermsCorrect, maxtermsCorrect, simplifiedCorrect].filter(Boolean).length;
    if (correctCount === 3) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct: F = Σm(1,3,4,5,6,7) = ΠM(0,2), and the function simplifies to X + Z. Minterms, Maxterms, SOP and POS is complete.";
      globalThis.SmartStartProgress?.complete("canonical-forms");
    } else {
      const issues = [];
      if (!mintermsCorrect) issues.push("SOP rows");
      if (!maxtermsCorrect) issues.push("POS rows");
      if (!simplifiedCorrect) issues.push("simplified expression");
      feedback.className = "feedback incorrect";
      feedback.textContent = `Recheck the ${issues.join(", ")}. Remember: SOP uses output-1 rows; POS uses output-0 rows.`;
    }
  });
  document.getElementById("reset-challenge").addEventListener("click", () => {
    challengeForm.querySelectorAll("input[type=checkbox]").forEach(input => { input.checked = false; });
    document.getElementById("simplified-choice").value = "";
    feedback.className = "feedback";
    feedback.textContent = "Select the SOP rows, the POS rows and the simplified expression.";
  });
})();
