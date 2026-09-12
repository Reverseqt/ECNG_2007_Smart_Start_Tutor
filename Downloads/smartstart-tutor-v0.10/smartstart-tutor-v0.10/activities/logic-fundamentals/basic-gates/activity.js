"use strict";

const SmartStartGates = {
  AND: { expression: "Z = X \u00b7 Y", description: "The output is 1 only when both inputs are 1.", arity: 2, evaluate: (a, b) => a & b },
  OR: { expression: "Z = X + Y", description: "The output is 1 when either input, or both inputs, are 1.", arity: 2, evaluate: (a, b) => a | b },
  NOT: { expression: "Z = X\u2032", description: "The output is the complement of the input.", arity: 1, evaluate: a => Number(!a) },
  NAND: { expression: "Z = (X \u00b7 Y)\u2032", description: "The output is the complement of AND; it is 0 only when both inputs are 1.", arity: 2, evaluate: (a, b) => Number(!(a & b)) },
  NOR: { expression: "Z = (X + Y)\u2032", description: "The output is the complement of OR; it is 1 only when both inputs are 0.", arity: 2, evaluate: (a, b) => Number(!(a | b)) },
  BUFFER: { expression: "Z = X", description: "The output follows the input without inversion.", arity: 1, evaluate: a => a },
  INVERTER: { expression: "Z = X\u2032", description: "Another name for the NOT gate; the output is the complement of the input.", arity: 1, evaluate: a => Number(!a) }
};

(() => {
  const $ = selector => document.querySelector(selector);

  // SVG elements do not reflect the .hidden IDL property the way HTML elements
  // do, so `svgNode.hidden = true` silently does nothing. Set the content
  // attribute directly instead. Paired with the svg [hidden] rule in site.css.
  const setHidden = (node, isHidden) => {
    if (isHidden) node.setAttribute("hidden", "");
    else node.removeAttribute("hidden");
  };

  const basicGate = $("#basic-gate");
  const inputX = $("#input-x");
  const inputY = $("#input-y");
  const inputYRow = $("#input-y-row");
  let x = 0;
  let y = 0;

  function setSwitch(button, value) {
    button.setAttribute("aria-checked", String(Boolean(value)));
    button.querySelector("span").textContent = String(value);
  }

  function toggleSwitch(button, key) {
    if (button.disabled) return;
    if (key === "x") x = Number(!x);
    if (key === "y") y = Number(!y);
    setSwitch(inputX, x);
    setSwitch(inputY, y);
    update();
  }

  inputX.addEventListener("click", () => toggleSwitch(inputX, "x"));
  inputY.addEventListener("click", () => toggleSwitch(inputY, "y"));
  basicGate.addEventListener("change", update);

  function truthRows(type) {
    const data = SmartStartGates[type];
    if (data.arity === 1) return [[0, data.evaluate(0)], [1, data.evaluate(1)]];
    return [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => [a, b, data.evaluate(a, b)]);
  }

  function update() {
    const type = basicGate.value;
    const data = SmartStartGates[type];
    const output = data.evaluate(x, y);
    const unary = data.arity === 1;

    inputY.disabled = unary;
    inputYRow.classList.toggle("disabled", unary);
    setHidden($(".signal-y"), unary);

    ["AND", "OR", "NOT"].forEach(name => setHidden($("#shape-" + name.toLowerCase()), name !== type));
    $("#basic-expression").textContent = data.expression;
    $("#gate-name").textContent = `${type} gate`;
    $("#basic-result").textContent = unary ? `${type} ${x} gives ${output}.` : `${x} ${type} ${y} gives ${output}.`;

    $(".signal-x").classList.toggle("active", Boolean(x));
    $(".signal-y").classList.toggle("active", Boolean(y));
    $(".output-signal").classList.toggle("active", Boolean(output));

    const rows = truthRows(type);
    $("#basic-caption").textContent = `${type} gate truth table`;
    setHidden($("#basic-y-head"), unary);
    $("#basic-table-body").innerHTML = rows.map(row => {
      const current = unary ? row[0] === x : row[0] === x && row[1] === y;
      return unary
        ? `<tr class="${current ? "current" : ""}"><td>${row[0]}</td><td hidden></td><td>${row[1]}</td></tr>`
        : `<tr class="${current ? "current" : ""}"><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`;
    }).join("");
  }

  setSwitch(inputX, x);
  setSwitch(inputY, y);
  update();

  // --- Part 2: predict the output ---------------------------------------
  const prompt = document.getElementById("predict-prompt");
  const predictFeedback = document.getElementById("predict-feedback");
  const TARGET = 5;
  let streak = 0;
  let question = null;

  function newQuestion() {
    const types = ["AND", "OR", "NOT"];
    const type = types[Math.floor(Math.random() * types.length)];
    const data = SmartStartGates[type];
    const a = Math.round(Math.random());
    const b = Math.round(Math.random());
    question = { type, a, b, answer: data.arity === 1 ? data.evaluate(a) : data.evaluate(a, b) };
    prompt.textContent = data.arity === 1
      ? `A NOT gate has input X = ${a}. What is Z?`
      : `An ${type} gate has inputs X = ${a} and Y = ${b}. What is Z?`;
  }

  function answer(value) {
    if (!question) return;
    if (value === question.answer) {
      streak += 1;
      if (streak >= TARGET) {
        predictFeedback.className = "feedback correct";
        predictFeedback.textContent = `Correct \u2014 ${TARGET} in a row. The Three Basic Gates is complete.`;
        globalThis.SmartStartProgress?.complete("logic-gates");
        question = null;
        prompt.textContent = "All five correct. Use Start again for more practice.";
        return;
      }
      predictFeedback.className = "feedback correct";
      predictFeedback.textContent = `Correct. Streak: ${streak} of ${TARGET}.`;
    } else {
      streak = 0;
      predictFeedback.className = "feedback incorrect";
      predictFeedback.textContent = `Not quite \u2014 the answer was ${question.answer}. Streak reset to 0 of ${TARGET}.`;
    }
    newQuestion();
  }

  document.querySelectorAll("[data-predict]").forEach(button => {
    button.addEventListener("click", () => answer(Number(button.dataset.predict)));
  });

  document.getElementById("predict-restart").addEventListener("click", () => {
    streak = 0;
    predictFeedback.className = "feedback";
    predictFeedback.textContent = `Streak: 0 of ${TARGET}.`;
    newQuestion();
  });

  newQuestion();
  predictFeedback.textContent = `Streak: 0 of ${TARGET}.`;
})();
