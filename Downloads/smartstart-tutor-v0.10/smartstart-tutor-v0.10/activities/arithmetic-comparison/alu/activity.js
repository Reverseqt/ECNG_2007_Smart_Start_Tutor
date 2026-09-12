"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const WIDTH = 4;
  const MASK = (1 << WIDTH) - 1;

  const toBits = value => value.toString(2).padStart(WIDTH, "0").split("").map(Number);
  const toValue = bits => parseInt(bits.join(""), 2);

  function bitRow(container, values, { clickable = false, onToggle = null, tone = "" } = {}) {
    container.innerHTML = "";
    values.forEach((v, i) => {
      const node = document.createElement(clickable ? "button" : "span");
      if (clickable) { node.type = "button"; node.setAttribute("aria-label", `bit ${WIDTH - 1 - i}`); }
      node.className = (clickable ? "rip-bit" : "rip-cell") + (tone ? " " + tone : "");
      node.textContent = String(v);
      if (v === 1) node.classList.add("on");
      if (clickable) node.addEventListener("click", () => onToggle(i));
      container.append(node);
    });
  }

  // ------------------------------------------------------ Part 3: the ALU
  const OPS = [
    { code: "00", name: "A AND B", cin: 0 },
    { code: "01", name: "A OR B", cin: 0 },
    { code: "10", name: "A + B", cin: 0 },
    { code: "11", name: "A \u2212 B", cin: 1 }
  ];
  let op = 0;
  let aluA = 9;
  let aluB = 5;

  function compute(a, b, operation) {
    if (operation === 0) return { result: a & b, carry: 0 };
    if (operation === 1) return { result: a | b, carry: 0 };
    const addend = operation === 2 ? b : ((~b) & MASK);
    const cin = operation === 2 ? 0 : 1;
    const total = a + addend + cin;
    return { result: total & MASK, carry: (total >> WIDTH) & 1 };
  }

  function renderAlu() {
    const { result, carry } = compute(aluA, aluB, op);
    bitRow($("#alu-a"), toBits(aluA), { clickable: true, onToggle: i => { aluA ^= (1 << (WIDTH - 1 - i)); aluA &= MASK; renderAlu(); } });
    bitRow($("#alu-b"), toBits(aluB), { clickable: true, onToggle: i => { aluB ^= (1 << (WIDTH - 1 - i)); aluB &= MASK; renderAlu(); } });
    bitRow($("#alu-r"), toBits(result));
    $("#alu-a-val").textContent = String(aluA);
    $("#alu-b-val").textContent = String(aluB);
    $("#alu-r-val").textContent = String(result);
    $("#op-name").textContent = OPS[op].name;
    $("#cin-note").textContent = String(OPS[op].cin);

    document.querySelectorAll(".func-button").forEach(button => {
      button.classList.toggle("active", Number(button.dataset.op) === op);
    });

    const setFlag = (id, value) => {
      const node = $(id);
      node.querySelector("strong").textContent = String(value);
      node.classList.toggle("on", value === 1);
    };
    setFlag("#flag-carry", carry);
    setFlag("#flag-zero", result === 0 ? 1 : 0);
    setFlag("#flag-neg", (result >> (WIDTH - 1)) & 1);

    let note;
    if (op === 0) note = `${aluA} AND ${aluB}: each column is 1 only where both inputs are 1.`;
    else if (op === 1) note = `${aluA} OR ${aluB}: each column is 1 where either input is 1.`;
    else if (op === 2) note = carry
      ? `${aluA} + ${aluB} = ${aluA + aluB}, too large for four bits. The result shows ${result} and the carry flag is set.`
      : `${aluA} + ${aluB} = ${result}.`;
    else {
      const diff = aluA - aluB;
      note = diff >= 0
        ? `${aluA} \u2212 ${aluB} = ${diff}. The carry flag is ${carry}, which for subtraction means no borrow was needed.`
        : `${aluA} \u2212 ${aluB} = ${diff}. The carry flag is ${carry}, indicating a borrow: read as two's complement the result ${toBits(result).join("")} is ${diff}.`;
    }
    $("#alu-status").textContent = note;
    $("#alu-status").classList.toggle("mismatch", op === 2 && carry === 1);
  }

  document.querySelectorAll(".func-button").forEach(button => {
    button.addEventListener("click", () => { op = Number(button.dataset.op); renderAlu(); });
  });
  renderAlu();

  // ---------------------------------------------------- Part 4: prediction
  const TARGET = 5;
  let streak = 0;
  let question = null;
  const prompt = $("#predict-prompt");
  const answerBox = $("#predict-answer");
  const feedback = $("#predict-feedback");

  function newQuestion() {
    const a = Math.floor(Math.random() * 16);
    const b = Math.floor(Math.random() * 16);
    const operation = Math.floor(Math.random() * 4);
    const { result } = compute(a, b, operation);
    question = { a, b, operation, answer: toBits(result).join("") };
    prompt.innerHTML = `A = <strong>${toBits(a).join("")}</strong> (${a}), `
      + `B = <strong>${toBits(b).join("")}</strong> (${b}), `
      + `S<sub>1</sub>S<sub>0</sub> = <strong>${OPS[operation].code}</strong> (${OPS[operation].name}). What is the four-bit result?`;
    answerBox.value = "";
  }

  $("#predict-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!question) return;
    const given = answerBox.value.trim();
    if (!/^[01]{4}$/.test(given)) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Enter exactly four binary digits, for example 0110.";
      return;
    }
    if (given === question.answer) {
      streak += 1;
      if (streak >= TARGET) {
        feedback.className = "feedback correct";
        feedback.textContent = `Correct \u2014 ${TARGET} in a row. A Simple ALU is complete.`;
        globalThis.SmartStartProgress?.complete("alu");
        question = null;
        prompt.textContent = "All five correct. Use Start again for more practice.";
        return;
      }
      feedback.className = "feedback correct";
      feedback.textContent = `Correct. Streak: ${streak} of ${TARGET}.`;
    } else {
      streak = 0;
      feedback.className = "feedback incorrect";
      feedback.textContent = `Not quite \u2014 the answer was ${question.answer}. Streak reset to 0 of ${TARGET}.`;
    }
    newQuestion();
  });

  $("#predict-restart").addEventListener("click", () => {
    streak = 0;
    feedback.className = "feedback";
    feedback.textContent = `Streak: 0 of ${TARGET}.`;
    newQuestion();
  });

  newQuestion();
  feedback.textContent = `Streak: 0 of ${TARGET}.`;
})();
