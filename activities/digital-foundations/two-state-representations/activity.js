"use strict";

const technologyStates = [
  ["Pneumatic logic", "Fluid at low pressure", "Fluid at high pressure"],
  ["Relay logic", "Circuit open", "Circuit closed"],
  ["Fibre optics", "Light off", "Light on"],
  ["Dynamic memory", "Capacitor discharged", "Capacitor charged"],
  ["Non-volatile memory", "Fuse blown", "Fuse intact"],
  ["Bipolar memory", "Electrons trapped", "Electrons released"],
  ["Bubble memory", "No magnetic bubble", "Bubble present"],
  ["Magnetic tape or disk", "Flux direction north", "Flux direction south"],
  ["Polymer memory", "Molecule in state A", "Molecule in state B"],
  ["Read-only compact disc", "No pit", "Pit"],
  ["Rewritable compact disc", "Dye in crystalline state", "Dye in non-crystalline state"]
];

(() => {
  const select = document.getElementById("technology");
  technologyStates.forEach(([name], index) => select.add(new Option(name, String(index))));
  function update() {
    const [, zero, one] = technologyStates[Number(select.value)];
    document.getElementById("state-zero").textContent = zero;
    document.getElementById("state-one").textContent = one;
  }
  select.addEventListener("change", update);
  update();

  const form = document.getElementById("check-form");
  const feedback = document.getElementById("check-feedback");
  const answers = [...form.querySelectorAll("select[data-answer]")];

  form.addEventListener("submit", event => {
    event.preventDefault();
    let answered = 0;
    let correct = 0;
    answers.forEach(node => {
      node.classList.remove("correct", "incorrect");
      if (node.value !== "") answered += 1;
      if (node.value === node.dataset.answer) { correct += 1; node.classList.add("correct"); }
      else if (node.value !== "") node.classList.add("incorrect");
    });
    if (answered < answers.length) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `You have matched ${answered} of ${answers.length}. Complete every row before checking.`;
      return;
    }
    if (correct === answers.length) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. Representing Two States is complete.";
      globalThis.SmartStartProgress?.complete("two-state-representations");
    } else {
      feedback.className = "feedback incorrect";
      feedback.textContent = `${correct} of ${answers.length} correct. Use the selector above to check the ones you missed.`;
    }
  });

  document.getElementById("clear-check").addEventListener("click", () => {
    answers.forEach(node => { node.value = ""; node.classList.remove("correct", "incorrect"); });
    feedback.className = "feedback";
    feedback.textContent = "Match all five conditions, then check your work.";
  });
})();
