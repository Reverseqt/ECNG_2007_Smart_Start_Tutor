"use strict";

(() => {
  const bits = Array(8).fill(0);
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const buttons = [...document.querySelectorAll(".byte-bit")];
  const targetValue = document.getElementById("target-value");
  const targetState = document.getElementById("target-state");
  const sumNote = document.getElementById("sum-note");
  const targets = [173, 92, 214, 45, 137, 226, 58, 191];
  let target = targets[Math.floor(Math.random() * targets.length)];

  const currentDecimal = () => parseInt(bits.join(""), 2);

  function update() {
    const binary = bits.join("");
    const decimal = parseInt(binary, 2);
    document.getElementById("byte-binary").textContent = binary;
    document.getElementById("byte-decimal").textContent = String(decimal);
    document.getElementById("byte-hex").textContent = `0x${decimal.toString(16).toUpperCase().padStart(2, "0")}`;
    buttons.forEach((button, index) => {
      button.textContent = String(bits[index]);
      button.setAttribute("aria-pressed", String(bits[index] === 1));
    });
    const set = weights.filter((_, i) => bits[i] === 1);
    sumNote.innerHTML = set.length
      ? `${set.join(" + ")} = <strong>${decimal}</strong>`
      : "No bits set, so the value is <strong>0</strong>.";
    targetState.textContent = decimal === target ? "Target reached." : "Not yet reached.";
  }

  function setTarget(value) {
    target = value;
    targetValue.textContent = String(target);
    update();
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => { bits[index] ^= 1; update(); }));
  document.getElementById("byte-clear").addEventListener("click", () => { bits.fill(0); update(); });
  document.getElementById("byte-all").addEventListener("click", () => { bits.fill(1); update(); });

  const form = document.getElementById("check-form");
  const feedback = document.getElementById("check-feedback");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const expected = { q1: "255", q2: "2" };
    const answered = Object.keys(expected).filter(k => data.get(k)).length;
    const correct = Object.entries(expected).filter(([k, v]) => data.get(k) === v).length;
    const byteOk = currentDecimal() === target;

    if (answered < 2) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (byteOk && correct === 2) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. Binary Values and Place Value is complete.";
      globalThis.SmartStartProgress?.complete("binary-values");
      return;
    }
    feedback.className = "feedback incorrect";
    if (!byteOk && correct === 2) {
      feedback.textContent = `Both questions are right, but the byte reads ${currentDecimal()} and the target is ${target}. Adjust the bits and check again.`;
    } else if (byteOk) {
      feedback.textContent = `The byte is correct, but ${2 - correct} of the 2 questions is not. Remember 8 bits give 256 patterns counting from zero.`;
    } else {
      feedback.textContent = `Not yet. The byte reads ${currentDecimal()} against a target of ${target}, and ${correct} of 2 questions are right.`;
    }
  });

  document.getElementById("new-target").addEventListener("click", () => {
    let next = target;
    while (next === target) next = targets[Math.floor(Math.random() * targets.length)];
    setTarget(next);
    feedback.className = "feedback";
    feedback.textContent = "New target set. Build it with the bits above.";
  });

  setTarget(target);
})();
