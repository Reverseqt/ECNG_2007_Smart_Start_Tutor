"use strict";

(() => {
  const practice = document.getElementById("truth-practice");
  const selects = [...practice.querySelectorAll("select[data-answer]")];
  const feedback = document.getElementById("practice-feedback");

  practice.addEventListener("submit", event => {
    event.preventDefault();
    let answered = 0;
    let correct = 0;
    selects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value !== "") answered += 1;
      if (select.value === select.dataset.answer) { correct += 1; select.classList.add("correct"); }
      else if (select.value !== "") select.classList.add("incorrect");
    });

    if (answered < selects.length) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `You have completed ${answered} of ${selects.length} outputs. Fill in every row before checking.`;
      return;
    }
    if (correct === selects.length) {
      feedback.className = "feedback correct";
      feedback.textContent = "All four truth tables are correct. Complete the Gate Truth Tables is finished.";
      globalThis.SmartStartProgress?.complete("gate-truth-tables");
    } else {
      feedback.className = "feedback incorrect";
      feedback.textContent = `${correct} of ${selects.length} outputs are correct. Revisit the highlighted selections and try again.`;
    }
  });

  document.getElementById("clear-practice").addEventListener("click", () => {
    selects.forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    feedback.className = "feedback";
    feedback.textContent = "Complete all fourteen outputs, then check your work.";
  });
})();
