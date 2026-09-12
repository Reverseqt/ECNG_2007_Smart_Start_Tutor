"use strict";

(() => {
  const slider = document.getElementById("width");
  const widthValue = document.getElementById("width-value");
  const widthName = document.getElementById("width-name");
  const widthResult = document.getElementById("width-result");
  const patternList = document.getElementById("pattern-list");

  const NAMES = { 1: "One bit.", 4: "Four bits is a nibble.", 8: "Eight bits is a byte." };

  function update() {
    const n = Number(slider.value);
    const count = 2 ** n;
    widthValue.textContent = `${n} ${n === 1 ? "bit" : "bits"}`;
    widthName.textContent = NAMES[n] || "";
    widthResult.innerHTML = `${n} ${n === 1 ? "bit gives" : "bits give"} <strong>2<sup>${n}</sup> = ${count}</strong> distinct patterns.`;
    // Listing every pattern stops being useful well before 256 of them.
    if (n <= 4) {
      patternList.innerHTML = Array.from({ length: count },
        (_, i) => `<code>${i.toString(2).padStart(n, "0")}</code>`).join("");
    } else {
      patternList.innerHTML = `<p class="source-note">Too many to list: ${count} patterns, from <code>${"0".repeat(n)}</code> to <code>${"1".repeat(n)}</code>.</p>`;
    }
  }

  slider.addEventListener("input", update);
  update();

  const form = document.getElementById("check-form");
  const feedback = document.getElementById("check-feedback");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const expected = { q1: "two", q2: "eight", q3: "32" };
    const answered = Object.keys(expected).filter(k => data.get(k)).length;
    const correct = Object.entries(expected).filter(([k, v]) => data.get(k) === v).length;
    if (answered < 3) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `You have answered ${answered} of 3. Complete every question before checking.`;
      return;
    }
    if (correct === 3) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. Bits is complete.";
      globalThis.SmartStartProgress?.complete("bits");
    } else {
      feedback.className = "feedback incorrect";
      feedback.textContent = `${correct} of 3 correct. Use the slider above to check the pattern count.`;
    }
  });

  document.getElementById("clear-check").addEventListener("click", () => {
    form.reset();
    feedback.className = "feedback";
    feedback.textContent = "Answer all three questions, then check your work.";
  });
})();
