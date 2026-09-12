"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const WIDTH = 4;

  const toBits = v => v.toString(2).padStart(WIDTH, "0");
  const neg = v => (v < 0 ? "\u2212" + Math.abs(v) : String(v));

  // Decoders. u is the pattern read as plain unsigned.
  const asSignMagnitude = u => { const m = u & 7; return ((u >> 3) & 1) ? -m : m; };
  const asTwos = u => (u >= 8 ? u - 16 : u);
  const asExcess = (u, bias) => u - bias;

  // Encoders, returning null where the value is not representable.
  function encodeSignMagnitude(v) {
    if (v < -7 || v > 7) return null;
    const m = Math.abs(v);
    return ((v < 0 ? 8 : 0) | m);
  }
  function encodeTwos(v) { return (v < -8 || v > 7) ? null : (v & 15); }
  function encodeExcess(v, bias) { const u = v + bias; return (u < 0 || u > 15) ? null : u; }

  // ------------------------------------------------ Part 2: the explorer
  let pattern = 0;
  let bias = 7;

  function renderBits() {
    const container = $("#sn-bits");
    container.innerHTML = "";
    toBits(pattern).split("").forEach((bit, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rip-bit" + (bit === "1" ? " on" : "") + (i === 0 ? " msb" : "");
      button.textContent = bit;
      button.setAttribute("aria-label", `bit ${WIDTH - 1 - i}`);
      button.addEventListener("click", () => { pattern ^= (1 << (WIDTH - 1 - i)); render(); });
      container.append(button);
    });
  }

  function render() {
    renderBits();
    const bits = toBits(pattern);
    const sm = asSignMagnitude(pattern);
    const tc = asTwos(pattern);
    const ex = asExcess(pattern, bias);

    $("#sn-unsigned").textContent = String(pattern);
    $("#sn-sm").innerHTML = (pattern === 8 ? "\u22120" : (pattern === 0 ? "+0" : (sm < 0 ? "\u2212" : "+") + Math.abs(sm)));
    $("#sn-tc").innerHTML = neg(tc);
    $("#sn-ex").innerHTML = neg(ex);

    $("#sn-sm-work").textContent = `sign ${bits[0]}, magnitude ${bits.slice(1)} = ${pattern & 7}`;
    $("#sn-tc-work").textContent = `${bits[0] === "1" ? "\u22128 + " : ""}${(pattern & 7)} = ${tc}`;
    $("#sn-ex-work").textContent = `${pattern} \u2212 ${bias} = ${ex}`;

    const notes = [];
    if (pattern === 0 || pattern === 8) notes.push("This pattern is one of sign-magnitude's two zeros.");
    if (pattern === 8) notes.push("Two's complement uses it for \u22128, the one value with no positive counterpart.");
    $("#sn-status").textContent = notes.length
      ? notes.join(" ")
      : `Pattern ${bits} means ${pattern} unsigned, ${neg(sm)} in sign-magnitude, ${neg(tc)} in two's complement and ${neg(ex)} in excess-${bias}.`;

    $("#sn-bias-note").textContent = bias === 8
      ? "With a bias of 8 the encoding is exactly two's complement with the top bit inverted \u2014 compare the two columns as you toggle the leftmost bit."
      : "A bias of 2\u207F\u207B\u00b9 \u2212 1 is the rule IEEE 754 uses, which for 8 exponent bits gives 127.";
  }

  $("#sn-bias").addEventListener("change", event => { bias = Number(event.target.value); render(); });
  $("#sn-clear").addEventListener("click", () => { pattern = 0; render(); });
  $("#sn-all").addEventListener("click", () => { pattern = 15; render(); });
  render();

  // ---------------------------------------- Part 4: adding in each scheme
  let scheme = "tc";
  function renderArith() {
    const a = -3, b = 5;
    const encode = scheme === "tc" ? encodeTwos : encodeSignMagnitude;
    const decode = scheme === "tc" ? asTwos : asSignMagnitude;
    const pa = encode(a), pb = encode(b);
    const raw = pa + pb;
    const result = raw & 15;
    const carry = raw > 15 ? 1 : 0;
    const got = decode(result);
    const works = got === (a + b);

    $("#arith-work").innerHTML = `
      <div class="sum-line"><span>${neg(a)}</span><code>${toBits(pa)}</code></div>
      <div class="sum-line"><span>+ ${b}</span><code>${toBits(pb)}</code></div>
      <div class="sum-line total"><span>=</span><code>${toBits(result)}</code>${carry ? '<em>carry out of the top bit discarded</em>' : ""}</div>
      <div class="sum-line reading"><span>reads as</span><strong>${neg(got)}</strong></div>`;

    $("#arith-status").textContent = works
      ? `Correct. ${neg(a)} + ${b} = ${a + b}, and a plain four-bit adder produced it with no special handling at all.`
      : `Wrong. ${neg(a)} + ${b} should be ${a + b}, but the adder produced ${neg(got)}. Sign-magnitude cannot be added like this \u2014 the hardware would first have to compare magnitudes, decide whether to add or subtract, and work out the sign of the answer separately.`;
    $("#arith-status").classList.toggle("mismatch", !works);

    document.querySelectorAll("[data-scheme]").forEach(button => {
      button.classList.toggle("active", button.dataset.scheme === scheme);
    });
  }
  document.querySelectorAll("[data-scheme]").forEach(button => {
    button.addEventListener("click", () => { scheme = button.dataset.scheme; renderArith(); });
  });
  renderArith();

  // ------------------------------------------------------- Part 5: check
  const TASKS = [
    { value: -5, scheme: "two's complement", encode: v => encodeTwos(v) },
    { value: -6, scheme: "sign-magnitude", encode: v => encodeSignMagnitude(v) },
    { value: 3, scheme: "excess-7", encode: v => encodeExcess(v, 7) },
    { value: -2, scheme: "two's complement", encode: v => encodeTwos(v) },
    { value: -4, scheme: "excess-7", encode: v => encodeExcess(v, 7) },
    { value: 7, scheme: "sign-magnitude", encode: v => encodeSignMagnitude(v) }
  ];
  let task = TASKS[0];

  function renderTask() {
    $("#task-value").innerHTML = neg(task.value);
    $("#task-scheme").textContent = task.scheme;
    $("#task-answer").value = "";
  }
  renderTask();

  const form = $("#check-form");
  const feedback = $("#check-feedback");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const given = $("#task-answer").value.trim();
    const data = new FormData(form);
    const q1 = data.get("q1"), q2 = data.get("q2"), q3 = data.get("q3");

    if (!/^[01]{4}$/.test(given) || !q1 || !q2 || !q3) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Enter four binary digits and answer all three questions before checking.";
      return;
    }
    const expected = toBits(task.encode(task.value));
    const encodeOk = given === expected;
    const quizOk = q1 === "sm" && q2 === "b" && q3 === "order";

    if (encodeOk && quizOk) {
      feedback.className = "feedback correct";
      feedback.textContent = "All correct. Signed Number Representations is complete.";
      globalThis.SmartStartProgress?.complete("signed-numbers");
      return;
    }
    feedback.className = "feedback incorrect";
    if (!encodeOk && !quizOk) feedback.textContent = `The encoding is not right yet, and at least one question is wrong. ${neg(task.value)} in ${task.scheme} is not ${given}.`;
    else if (!encodeOk) feedback.textContent = `The questions are right. But ${neg(task.value)} in ${task.scheme} is not ${given} \u2014 check the table in Part 3.`;
    else feedback.textContent = "The encoding is right. Review Part 3 for the questions: look at how many zeros each scheme has and at the order of the columns.";
  });

  $("#task-new").addEventListener("click", () => {
    let next = task;
    while (next === task) next = TASKS[Math.floor(Math.random() * TASKS.length)];
    task = next;
    renderTask();
    feedback.className = "feedback";
    feedback.textContent = "New value set. Encode it, then check your work.";
  });

  $("#clear-check").addEventListener("click", () => {
    form.reset();
    $("#task-answer").value = "";
    feedback.className = "feedback";
    feedback.textContent = "Encode the value and answer all three questions, then check your work.";
  });
})();
