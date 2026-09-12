"use strict";

const SmartStartGates = {
  AND: { expression: "Z = X \u00b7 Y", description: "The output is 1 only when both inputs are 1.", arity: 2 },
  OR: { expression: "Z = X + Y", description: "The output is 1 when either input, or both inputs, are 1.", arity: 2 },
  NAND: { expression: "Z = (X \u00b7 Y)\u2032", description: "The output is the complement of AND; it is 0 only when both inputs are 1.", arity: 2 },
  NOR: { expression: "Z = (X + Y)\u2032", description: "The output is the complement of OR; it is 1 only when both inputs are 0.", arity: 2 },
  BUFFER: { expression: "Z = X", description: "The output follows the input without inversion.", arity: 1 },
  INVERTER: { expression: "Z = X\u2032", description: "Another name for the NOT gate; the output is the complement of the input.", arity: 1 },
  XOR: { expression: "Z = X \u2295 Y", description: "Exclusive-OR. The output is 1 when the inputs differ, and 0 when they are the same. This is the difference detector you will meet again in comparators and adders.", arity: 2 },
  XNOR: { expression: "Z = (X \u2295 Y)\u2032", description: "The complement of XOR. The output is 1 when the inputs are equal, which makes it a one-bit equality test.", arity: 2 }
};

const LABELS = {
  AND: "AND gate", OR: "OR gate", NAND: "NAND gate", NOR: "NOR gate",
  BUFFER: "Buffer", INVERTER: "Inverter", XOR: "XOR gate", XNOR: "XNOR gate"
};

const BUBBLED = new Set(["NAND", "NOR", "INVERTER", "XNOR"]);

(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function symbolMarkup(type, bubbleX) {
    const bubble = `<circle cx="${bubbleX}" cy="150" r="18"></circle>`;
    if (type === "AND" || type === "NAND") {
      return `<path d="M165 55 H235 C315 55 350 92 350 150 C350 208 315 245 235 245 H165 Z"></path>${type === "NAND" ? bubble : ""}`;
    }
    if (type === "OR" || type === "NOR") {
      return `<path d="M160 55 Q220 150 160 245 Q285 245 350 150 Q285 55 160 55 Z"></path><path d="M160 55 Q220 150 160 245" fill="none"></path>${type === "NOR" ? bubble : ""}`;
    }
    if (type === "XOR" || type === "XNOR") {
      // Same body as OR, with the extra arc that distinguishes exclusive-OR.
      return `<path d="M175 55 Q235 150 175 245 Q290 245 350 150 Q290 55 175 55 Z"></path>`
        + `<path d="M175 55 Q235 150 175 245" fill="none"></path>`
        + `<path d="M138 55 Q198 150 138 245" fill="none"></path>${type === "XNOR" ? bubble : ""}`;
    }
    if (type === "BUFFER" || type === "INVERTER") {
      return `<path d="M175 55 L350 150 L175 245 Z"></path>${type === "INVERTER" ? bubble : ""}`;
    }
    return "";
  }

  const familyGate = $("#family-gate");
  function updateFamily() {
    const type = familyGate.value;
    const data = SmartStartGates[type];
    $("#family-title").textContent = LABELS[type];
    $("#family-description").textContent = data.description;
    $("#family-formula").textContent = data.expression;
    $("#family-shape").innerHTML = symbolMarkup(type, 372);
    $$(".family-input-b").forEach(node => { node.style.display = data.arity === 1 ? "none" : ""; });
    $(".family-output").setAttribute("x1", BUBBLED.has(type) ? "390" : "350");
  }
  familyGate.addEventListener("change", updateFamily);
  updateFamily();

  // --- Part 2: identify the gate ----------------------------------------
  const names = Object.keys(SmartStartGates);
  const symbolAnswer = $("#symbol-answer");
  const expressionAnswer = $("#expression-answer");
  const feedback = $("#identify-feedback");

  function drawQuizSymbol() {
    const type = names[Math.floor(Math.random() * names.length)];
    const data = SmartStartGates[type];
    $("#quiz-shape").innerHTML = symbolMarkup(type, 372);
    $("#quiz-input-b").style.display = data.arity === 1 ? "none" : "";
    $("#quiz-output").setAttribute("x1", BUBBLED.has(type) ? "390" : "350");
    symbolAnswer.dataset.answer = type;
    symbolAnswer.value = "";
    symbolAnswer.classList.remove("correct", "incorrect");
  }

  function setExpressionQuestion() {
    const type = names[Math.floor(Math.random() * names.length)];
    $("#expression-prompt").textContent = SmartStartGates[type].expression;
    expressionAnswer.dataset.answer = type;
    expressionAnswer.value = "";
    expressionAnswer.classList.remove("correct", "incorrect");
  }

  $("#new-symbol").addEventListener("click", () => {
    drawQuizSymbol();
    feedback.className = "feedback";
    feedback.textContent = "New symbol drawn. Answer both questions, then check your work.";
  });

  $("#identify-form").addEventListener("submit", event => {
    event.preventDefault();
    const nodes = [symbolAnswer, expressionAnswer];
    let answered = 0;
    let correct = 0;
    nodes.forEach(node => {
      node.classList.remove("correct", "incorrect");
      if (node.value !== "") answered += 1;
      // BUFFER and INVERTER share an expression with nothing else, but NOT is
      // not offered here, so a direct comparison is safe.
      if (node.value === node.dataset.answer) { correct += 1; node.classList.add("correct"); }
      else if (node.value !== "") node.classList.add("incorrect");
    });
    if (answered < nodes.length) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (correct === nodes.length) {
      feedback.className = "feedback correct";
      feedback.textContent = "Both correct. The Gate Family and De Morgan is complete.";
      globalThis.SmartStartProgress?.complete("gate-family");
    } else {
      feedback.className = "feedback incorrect";
      feedback.textContent = `${correct} of ${nodes.length} correct. Compare against the selector above and try again.`;
    }
  });

  drawQuizSymbol();
  setExpressionQuestion();
})();
