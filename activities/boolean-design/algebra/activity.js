"use strict";

(() => {
  const laws = [
    { name: "Identity", expression: "X + 0 = X", dual: "X · 1 = X", meaning: "OR with 0 and AND with 1 leave the variable unchanged." },
    { name: "Null or dominance", expression: "X + 1 = 1", dual: "X · 0 = 0", meaning: "OR with 1 forces 1; AND with 0 forces 0." },
    { name: "Idempotent", expression: "X + X = X", dual: "X · X = X", meaning: "Repeating the same variable does not change the result." },
    { name: "Complement", expression: "X + X′ = 1", dual: "X · X′ = 0", meaning: "A variable and its complement cover both possible states." },
    { name: "Involution", expression: "(X′)′ = X", dual: "(X′)′ = X", meaning: "Complementing a variable twice returns the original variable." },
    { name: "Absorption", expression: "X + X · Y = X", dual: "X · (X + Y) = X", meaning: "The broader term X absorbs the more restrictive term containing X." },
    { name: "Distributive", expression: "X · (Y + Z) = X·Y + X·Z", dual: "X + Y·Z = (X + Y)·(X + Z)", meaning: "Both distributive forms are valid in Boolean algebra." },
    { name: "De Morgan", expression: "(X · Y)′ = X′ + Y′", dual: "(X + Y)′ = X′ · Y′", meaning: "Complementing a product gives a sum of complements, and vice versa." }
  ];

  const grid = document.getElementById("law-grid");
  const feedback = document.getElementById("law-feedback");
  grid.innerHTML = laws.map((law, index) => `<article class="law-card"><button type="button" data-law="${index}" aria-pressed="false"><strong>${law.name}</strong><span>${law.expression}</span></button><p class="law-detail">Dual: ${law.dual}</p></article>`).join("");
  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-law]");
    if (!button) return;
    grid.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    const law = laws[Number(button.dataset.law)];
    feedback.className = "feedback";
    feedback.innerHTML = `<strong>${law.name}:</strong> ${law.meaning}<br><strong>Identity:</strong> ${law.expression}<br><strong>Dual:</strong> ${law.dual}`;
  });

  const dualityFeedback = document.getElementById("duality-feedback");
  document.getElementById("duality-form").addEventListener("submit", event => {
    event.preventDefault();
    const correct = document.getElementById("dual-choice").value === "a";
    dualityFeedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
    dualityFeedback.textContent = correct
      ? "Correct. Every dot becomes a plus and every plus becomes a dot. The variables and their complement status are unchanged."
      : "Not quite. Interchange every AND and OR operator, but do not complement the variables.";
  });
  document.getElementById("show-rule").addEventListener("click", () => {
    dualityFeedback.className = "feedback";
    dualityFeedback.textContent = "Replacement sequence: (X·Z) → (X+Z), (X·Y) → (X+Y), the outer product → a sum, and (Z+X) → (Z·X).";
  });

  const matchingForm = document.getElementById("matching-form");
  const selects = [...matchingForm.querySelectorAll("select[data-answer]")];
  const matchingFeedback = document.getElementById("matching-feedback");
  matchingForm.addEventListener("submit", event => {
    event.preventDefault();
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
      matchingFeedback.className = "feedback incorrect";
      matchingFeedback.textContent = `Complete all four matches. You have answered ${answered} of ${selects.length}.`;
    } else if (correct === selects.length) {
      matchingFeedback.className = "feedback correct";
      matchingFeedback.textContent = "All dual pairs are correct. Boolean Algebra and Duality is complete.";
      globalThis.SmartStartProgress?.complete("boolean-algebra");
    } else {
      matchingFeedback.className = "feedback incorrect";
      matchingFeedback.textContent = `${correct} of ${selects.length} matches are correct. Recheck the highlighted selections.`;
    }
  });
  document.getElementById("clear-matches").addEventListener("click", () => {
    selects.forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    matchingFeedback.className = "feedback";
    matchingFeedback.textContent = "Complete all four matches, then check your work.";
  });
})();
