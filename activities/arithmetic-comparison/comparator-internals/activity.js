"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const WIDTH = 4, MASK = 15;
  const toBits = v => v.toString(2).padStart(WIDTH, "0");
  let a = 9, b = 5;

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

  function render() {
    // Subtract exactly as the hardware does: A + B' + 1.
    const total = a + ((~b) & MASK) + 1;
    const result = total & MASK;
    const carry = (total >> WIDTH) & 1;
    const zero = result === 0 ? 1 : 0;

    // The three outputs come only from the two flags.
    const lt = carry ? 0 : 1;
    const eq = zero;
    const gt = (carry && !zero) ? 1 : 0;

    paint("#cmp-a", a, true, bit => { a ^= (1 << bit); a &= MASK; render(); });
    paint("#cmp-b", b, true, bit => { b ^= (1 << bit); b &= MASK; render(); });
    paint("#cmp-r", result, false);
    $("#cmp-a-val").textContent = String(a);
    $("#cmp-b-val").textContent = String(b);
    $("#cmp-r-val").textContent = String(result);
    $("#cmp-diff").textContent = String(a - b);

    const setFlag = (id, v) => { const n = $(id); n.querySelector("strong").textContent = String(v); n.classList.toggle("on", v === 1); };
    setFlag("#cmp-flag-c", carry);
    setFlag("#cmp-flag-z", zero);
    setFlag("#out-lt", lt);
    setFlag("#out-eq", eq);
    setFlag("#out-gt", gt);

    // Cross-check the flag-derived outputs against a direct comparison.
    const truth = a < b ? "lt" : (a > b ? "gt" : "eq");
    const derived = lt ? "lt" : (gt ? "gt" : "eq");
    const agree = truth === derived;
    const words = { lt: `${a} < ${b}`, eq: `${a} = ${b}`, gt: `${a} > ${b}` };
    $("#cmp-status").textContent = agree
      ? `Carry ${carry}, Zero ${zero}. The flags say ${words[derived]}, and direct comparison agrees.`
      : `Disagreement: flags say ${words[derived]} but the values are ${words[truth]}.`;
    $("#cmp-status").classList.toggle("mismatch", !agree);
  }

  $("#cmp-lt").addEventListener("click", () => { a = 3; b = 11; render(); });
  $("#cmp-eq").addEventListener("click", () => { a = 6; b = 6; render(); });
  $("#cmp-gt").addEventListener("click", () => { a = 12; b = 4; render(); });
  render();

  const form = $("#check-form");
  const feedback = $("#check-feedback");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const q1 = data.get("q1"), q2 = data.get("q2"), q3 = data.get("q3");
    if (!q1 || !q2 || !q3) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Answer all three questions before checking.";
      return;
    }
    const correct = [q1 === "lt", q2 === "cz", q3 === "reuse"].filter(Boolean).length;
    if (correct === 3) {
      feedback.className = "feedback correct";
      feedback.textContent = "All three correct. Comparators Revisited is complete.";
      globalThis.SmartStartProgress?.complete("comparator-internals");
      return;
    }
    feedback.className = "feedback incorrect";
    feedback.textContent = `${correct} of 3 correct. Use the panel in Part 3 \u2014 set the three relationships in turn and watch which flags change.`;
  });
})();
