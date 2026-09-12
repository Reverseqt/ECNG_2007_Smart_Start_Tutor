"use strict";

(() => {
  const $ = selector => document.querySelector(selector);

  // --- Part 2: K-map groupings -------------------------------------------
  const GROUPS = {
    c: { cells: [1, 3, 5, 7], note: "These four cells are every square where C = 1. Across them A takes both values and B takes both values, so both drop out. The group contributes the single literal C." },
    ab: { cells: [6, 7], note: "These two cells are where A = 1 and B = 1. Between them C takes both values, so C drops out. The group contributes A\u00b7B." },
    none: { cells: [], note: "Pick a grouping to see what it contributes." }
  };

  function highlight(key) {
    const group = GROUPS[key];
    document.querySelectorAll("[data-cell]").forEach(cell => {
      cell.classList.toggle("grouped", group.cells.includes(Number(cell.dataset.cell)));
    });
    $("#group-note").textContent = group.note;
  }
  document.querySelectorAll("[data-group]").forEach(button => {
    button.addEventListener("click", () => highlight(button.dataset.group));
  });
  highlight("none");

  // --- Part 3: the synthesised circuit ------------------------------------
  const state = { a: 0, b: 0, c: 0 };
  const SPEC = new Set([1, 3, 5, 6, 7]);

  function updateCircuit() {
    const and = state.a & state.b;
    const f = and | state.c;
    const minterm = (state.a << 2) | (state.b << 1) | state.c;
    const required = SPEC.has(minterm) ? 1 : 0;

    $("#w-a").classList.toggle("active", Boolean(state.a));
    $("#w-b").classList.toggle("active", Boolean(state.b));
    $("#w-c").classList.toggle("active", Boolean(state.c));
    $("#w-ab").classList.toggle("active", Boolean(and));
    $("#w-f").classList.toggle("active", Boolean(f));
    $("#spec-value").textContent = String(required);

    // The circuit is only correct if it agrees with the spec on every row.
    const agree = f === required;
    $("#synth-status").textContent = agree
      ? `m${minterm}: the circuit gives F = ${f}, and the specification requires ${required}. They agree.`
      : `m${minterm}: the circuit gives F = ${f} but the specification requires ${required}. That would be a synthesis error.`;
    $("#synth-status").classList.toggle("mismatch", !agree);
  }

  [["a", "#in-a"], ["b", "#in-b"], ["c", "#in-c"]].forEach(([key, sel]) => {
    const node = $(sel);
    node.addEventListener("click", () => {
      state[key] = Number(!state[key]);
      node.setAttribute("aria-checked", String(Boolean(state[key])));
      node.querySelector("span").textContent = String(state[key]);
      updateCircuit();
    });
  });
  updateCircuit();

  // --- Part 4: synthesise G = Sum m(0,1,2,3,4,6) --------------------------
  const G = new Set([0, 1, 2, 3, 4, 6]);
  const body = $("#g-body");
  body.innerHTML = [...Array(8).keys()].map(i => {
    const a = (i >> 2) & 1, b = (i >> 1) & 1, c = i & 1;
    const answer = G.has(i) ? 1 : 0;
    return `<tr><td>m<sub>${i}</sub></td><td>${a}</td><td>${b}</td><td>${c}</td>`
      + `<td><select data-answer="${answer}" aria-label="G for minterm ${i}"><option value="">?</option><option>0</option><option>1</option></select></td></tr>`;
  }).join("");

  const form = $("#check-form");
  const feedback = $("#check-feedback");
  const selects = [...body.querySelectorAll("select[data-answer]")];

  form.addEventListener("submit", event => {
    event.preventDefault();
    let answered = 0, correct = 0;
    selects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value !== "") answered += 1;
      if (select.value === select.dataset.answer) { correct += 1; select.classList.add("correct"); }
      else if (select.value !== "") select.classList.add("incorrect");
    });
    const expr = new FormData(form).get("expr");

    if (answered < selects.length || !expr) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `Fill in all ${selects.length} rows and choose an expression before checking.`;
      return;
    }
    const tableOk = correct === selects.length;
    const exprOk = expr === "a";
    if (tableOk && exprOk) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. G is 0 only on minterms 5 and 7, where A and C are both 1, so G = (A\u00b7C)\u2032 = A\u2032 + C\u2032. Synthesis with Gates is complete.";
      globalThis.SmartStartProgress?.complete("synthesis-with-gates");
      return;
    }
    feedback.className = "feedback incorrect";
    if (!tableOk && !exprOk) feedback.textContent = `${correct} of ${selects.length} rows are right, and the expression is not. Fix the table first \u2014 the expression follows from it.`;
    else if (!tableOk) feedback.textContent = `The expression is right, but ${selects.length - correct} row(s) of the table are not.`;
    else feedback.textContent = "The table is right. Now look at which rows are 0 and ask what has to be true on exactly those rows.";
  });

  $("#clear-check").addEventListener("click", () => {
    form.reset();
    selects.forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    feedback.className = "feedback";
    feedback.textContent = "Fill in all eight rows and choose an expression, then check your work.";
  });
})();
