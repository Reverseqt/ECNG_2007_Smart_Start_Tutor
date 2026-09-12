"use strict";

const SmartStartSub = (() => {
  const WIDTH = 4, MASK = 15;
  // The hardware: result = A + (B XOR SUB) + SUB, keeping WIDTH bits.
  function operate(a, b, sub) {
    const addend = sub ? ((~b) & MASK) : b;
    const total = a + addend + sub;
    return { result: total & MASK, carry: (total >> WIDTH) & 1, addend };
  }
  return { WIDTH, MASK, operate };
})();

(() => {
  const $ = selector => document.querySelector(selector);
  const { WIDTH, MASK, operate } = SmartStartSub;
  const toBits = v => v.toString(2).padStart(WIDTH, "0");

  function paint(id, value, clickable, onToggle) {
    const container = $(id);
    container.innerHTML = "";
    toBits(value).split("").forEach((bit, i) => {
      const node = document.createElement(clickable ? "button" : "span");
      if (clickable) { node.type = "button"; node.setAttribute("aria-label", `bit ${WIDTH - 1 - i}`); }
      node.className = clickable ? "rip-bit" : "rip-cell";
      node.textContent = bit;
      if (bit === "1") node.classList.add("on");
      if (clickable) node.addEventListener("click", () => onToggle(WIDTH - 1 - i));
      container.append(node);
    });
  }

  // -------------------------------------------- Part 1: two's complement
  let tcB = 5;
  function renderTwos() {
    const inv = (~tcB) & MASK;
    const negv = (inv + 1) & MASK;
    paint("#tc-b", tcB, true, bit => { tcB ^= (1 << bit); tcB &= MASK; renderTwos(); });
    paint("#tc-inv", inv, false);
    paint("#tc-neg", negv, false);
    $("#tc-b-val").textContent = String(tcB);
    $("#tc-neg-val").textContent = String(negv);
    $("#tc-status").textContent = tcB === 0
      ? "Negating 0 gives 0000 again: inverting gives 1111 and adding 1 carries off the end. Zero has one representation, which is part of why two's complement is preferred."
      : `B = ${tcB}. Inverting gives ${toBits(inv)}, adding 1 gives ${toBits(negv)}. Read as two's complement that is \u2212${tcB}.`;
  }
  renderTwos();

  // ------------------------------------------- Part 3: adder-subtractor
  let a = 9, b = 5, sub = 0;
  function renderLive() {
    const { result, carry, addend } = operate(a, b, sub);
    paint("#sub-a", a, true, bit => { a ^= (1 << bit); a &= MASK; renderLive(); });
    paint("#sub-b", b, true, bit => { b ^= (1 << bit); b &= MASK; renderLive(); });
    paint("#sub-x", addend, false);
    paint("#sub-r", result, false);
    $("#sub-a-val").textContent = String(a);
    $("#sub-b-val").textContent = String(b);
    $("#sub-r-val").textContent = String(result);
    $("#sub-op").innerHTML = sub ? "A &minus; B" : "A + B";
    $("#sub-cin").textContent = String(sub);

    const setFlag = (id, v) => { const n = $(id); n.querySelector("strong").textContent = String(v); n.classList.toggle("on", v === 1); };
    setFlag("#sub-flag-c", carry);
    setFlag("#sub-flag-z", result === 0 ? 1 : 0);

    let note;
    if (!sub) {
      note = carry
        ? `${a} + ${b} = ${a + b}, too large for four bits. The result shows ${result} and the carry out marks the overflow.`
        : `${a} + ${b} = ${result}. B passed through the XOR gates unchanged because SUB is 0.`;
    } else {
      const diff = a - b;
      note = carry
        ? `${a} \u2212 ${b} = ${diff}. Carry out is 1, so no borrow was needed and ${a} \u2265 ${b}.`
        : `${a} \u2212 ${b} = ${diff}. Carry out is 0, so a borrow was needed: ${a} < ${b}, and the result ${toBits(result)} reads as ${diff} in two's complement.`;
    }
    $("#sub-status").textContent = note;
    $("#sub-status").classList.toggle("mismatch", sub ? carry === 0 : carry === 1);
  }

  const subNode = $("#sub-ctl");
  subNode.addEventListener("click", () => {
    sub = Number(!sub);
    subNode.setAttribute("aria-checked", String(Boolean(sub)));
    subNode.querySelector("span").textContent = String(sub);
    renderLive();
  });
  $("#sub-demo").addEventListener("click", () => {
    a = 3; b = 9;
    if (!sub) subNode.click(); else renderLive();
  });
  renderLive();

  // ------------------------------------------------------------ Part 5
  const TARGET = 4;
  let streak = 0, question = null;
  const feedback = $("#predict-feedback");

  function newQuestion() {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    const s = Math.round(Math.random());
    const { result, carry } = operate(x, y, s);
    question = { x, y, s, result: toBits(result), carry: String(carry) };
    $("#predict-prompt").innerHTML = `A = <strong>${toBits(x)}</strong> (${x}), B = <strong>${toBits(y)}</strong> (${y}), `
      + `SUB = <strong>${s}</strong>. What is the four-bit result and the carry out?`;
    $("#predict-result").value = "";
    $("#predict-carry").value = "";
  }

  $("#predict-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!question) return;
    const r = $("#predict-result").value.trim();
    const c = $("#predict-carry").value;
    if (!/^[01]{4}$/.test(r) || c === "") {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Give four binary digits for the result and choose a carry out.";
      return;
    }
    if (r === question.result && c === question.carry) {
      streak += 1;
      if (streak >= TARGET) {
        feedback.className = "feedback correct";
        feedback.textContent = `Correct \u2014 ${TARGET} in a row. Subtractors is complete.`;
        globalThis.SmartStartProgress?.complete("subtractor");
        question = null;
        $("#predict-prompt").textContent = "All four correct. Use Start again for more practice.";
        return;
      }
      feedback.className = "feedback correct";
      feedback.textContent = `Correct. Streak: ${streak} of ${TARGET}.`;
    } else {
      streak = 0;
      feedback.className = "feedback incorrect";
      const op = question.s ? `${question.x} \u2212 ${question.y}` : `${question.x} + ${question.y}`;
      feedback.textContent = `Not quite \u2014 ${op} gives result ${question.result} with carry out ${question.carry}. Streak reset.`;
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
