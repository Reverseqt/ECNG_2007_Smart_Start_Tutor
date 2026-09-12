"use strict";

(() => {
  const rows = Array.from({ length: 8 }, (_, index) => {
    const x = (index >> 2) & 1;
    const y = (index >> 1) & 1;
    const z = index & 1;
    const xz = x & z;
    const xy = x & y;
    const product = xz & xy;
    const sum = z | x;
    const f = product | sum;
    const dual = (x | z) | ((x | y) & (z & x));
    return { index, x, y, z, xz, xy, product, sum, f, dual };
  });

  const rowSelector = document.getElementById("row-selector");
  const explanation = document.getElementById("row-explanation");
  rowSelector.innerHTML = rows.map(row => `<button type="button" data-index="${row.index}">${row.index}: ${row.x}${row.y}${row.z}</button>`).join("");
  rowSelector.addEventListener("click", event => {
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    rowSelector.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    const row = rows[Number(button.dataset.index)];
    document.querySelectorAll("tr[data-row]").forEach(tr => tr.classList.toggle("highlight", Number(tr.dataset.row) === row.index));
    explanation.innerHTML = `<strong>Row ${row.index}: X=${row.x}, Y=${row.y}, Z=${row.z}</strong><br>X·Z=${row.xz}; X·Y=${row.xy}; (X·Z)·(X·Y)=${row.product}; Z+X=${row.sum}; therefore F=${row.product}+${row.sum}=${row.f}.`;
  });

  const outputSelect = (answer, label) => `<select data-answer="${answer}" aria-label="${label}"><option value="">?</option><option value="0">0</option><option value="1">1</option></select>`;
  document.getElementById("function-body").innerHTML = rows.map(row => `<tr data-row="${row.index}"><td>${row.index}</td><td>${row.x}</td><td>${row.y}</td><td>${row.z}</td><td>${row.xz}</td><td>${row.xy}</td><td>${row.product}</td><td>${row.sum}</td><td>${outputSelect(row.f, `F for row ${row.index}`)}</td></tr>`).join("");
  document.getElementById("dual-body").innerHTML = rows.map(row => `<tr data-row="${row.index}"><td>${row.index}</td><td>${row.x}</td><td>${row.y}</td><td>${row.z}</td><td>${row.f}</td><td>${outputSelect(row.dual, `Dual output for row ${row.index}`)}</td></tr>`).join("");

  function checkForm(form, feedback, successMessage, progressId) {
    const selects = [...form.querySelectorAll("select[data-answer]")];
    let answered = 0;
    let correct = 0;
    selects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value) answered += 1;
      if (select.value === select.dataset.answer) {
        correct += 1;
        select.classList.add("correct");
      } else if (select.value) select.classList.add("incorrect");
    });
    if (answered < selects.length) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `Complete every row. You have answered ${answered} of ${selects.length}.`;
      return false;
    }
    if (correct === selects.length) {
      feedback.className = "feedback correct";
      feedback.textContent = successMessage;
      if (progressId) globalThis.SmartStartProgress?.complete(progressId);
      return true;
    }
    feedback.className = "feedback incorrect";
    feedback.textContent = `${correct} of ${selects.length} rows are correct. Review the highlighted selections.`;
    return false;
  }

  const functionForm = document.getElementById("function-form");
  const functionFeedback = document.getElementById("function-feedback");
  functionForm.addEventListener("submit", event => {
    event.preventDefault();
    checkForm(functionForm, functionFeedback, "All F outputs are correct. Continue to the dual comparison.", null);
  });
  document.getElementById("clear-function").addEventListener("click", () => {
    functionForm.querySelectorAll("select").forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    functionFeedback.className = "feedback";
    functionFeedback.textContent = "Complete all eight F outputs, then check your work.";
  });

  const dualForm = document.getElementById("dual-form");
  const dualFeedback = document.getElementById("dual-feedback");
  dualForm.addEventListener("submit", event => {
    event.preventDefault();
    checkForm(dualForm, dualFeedback, "Every dual output is correct. For this particular example, the dual expression is equivalent to the original and produces the same output column. Compound Truth Tables is complete.", "boolean-truth-tables");
  });
  document.getElementById("reveal-comparison").addEventListener("click", () => {
    dualFeedback.className = "feedback";
    dualFeedback.textContent = "Both expressions simplify to X + Z, so the dual expression used in this example is equivalent to the original and produces the same output for every input row.";
  });
})();
