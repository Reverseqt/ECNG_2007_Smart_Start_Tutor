"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const state = { x: 0, y: 0, w: 0 };
  const done = { trace: false, read: false };

  const switches = [
    { key: "x", node: $("#in-x") },
    { key: "y", node: $("#in-y") },
    { key: "w", node: $("#in-w") }
  ];

  function update() {
    const n1 = state.x & state.y;
    const z = n1 | state.w;

    $("#node-n1").textContent = String(n1);
    $("#node-z").textContent = String(z);

    $("#wire-x").classList.toggle("active", Boolean(state.x));
    $("#wire-y").classList.toggle("active", Boolean(state.y));
    $("#wire-w").classList.toggle("active", Boolean(state.w));
    $("#wire-n1").classList.toggle("active", Boolean(n1));
    $("#wire-z").classList.toggle("active", Boolean(z));

    let why;
    if (n1 === 1 && state.w === 1) why = "Both the AND output and W are 1, so the OR gate gives Z = 1.";
    else if (n1 === 1) why = "X and Y are both 1, so N1 is 1 and the OR gate gives Z = 1.";
    else if (state.w === 1) why = "N1 is 0, but W is 1, so the OR gate still gives Z = 1.";
    else why = "Neither N1 nor W is 1, so Z is 0.";
    $("#circuit-status").textContent = `N1 = ${n1}, Z = ${z}. ${why}`;
  }

  switches.forEach(({ key, node }) => {
    node.addEventListener("click", () => {
      state[key] = Number(!state[key]);
      node.setAttribute("aria-checked", String(Boolean(state[key])));
      node.querySelector("span").textContent = String(state[key]);
      update();
    });
  });
  update();

  function maybeComplete() {
    if (done.trace && done.read) globalThis.SmartStartProgress?.complete("signal-flow");
  }

  // --- Part 2 -----------------------------------------------------------
  const traceForm = $("#trace-form");
  const traceSelects = [...traceForm.querySelectorAll("select[data-answer]")];
  const traceFeedback = $("#trace-feedback");

  traceForm.addEventListener("submit", event => {
    event.preventDefault();
    let answered = 0;
    let correct = 0;
    traceSelects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value !== "") answered += 1;
      if (select.value === select.dataset.answer) { correct += 1; select.classList.add("correct"); }
      else if (select.value !== "") select.classList.add("incorrect");
    });

    if (answered < traceSelects.length) {
      traceFeedback.className = "feedback incorrect";
      traceFeedback.textContent = `You have completed ${answered} of ${traceSelects.length} cells. Fill in every cell before checking.`;
      return;
    }
    if (correct === traceSelects.length) {
      done.trace = true;
      traceFeedback.className = "feedback correct";
      traceFeedback.textContent = done.read
        ? "The table is correct. Signal Flow Through a Circuit is complete."
        : "The table is correct. Finish Part 3 to complete this activity.";
      maybeComplete();
    } else {
      traceFeedback.className = "feedback incorrect";
      traceFeedback.textContent = `${correct} of ${traceSelects.length} cells are correct. Check the N1 column first \u2014 an error there carries into Z.`;
    }
  });

  $("#clear-trace").addEventListener("click", () => {
    traceSelects.forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    traceFeedback.className = "feedback";
    traceFeedback.textContent = "Complete all sixteen cells, then check your work.";
  });

  // --- Part 3 -----------------------------------------------------------
  const readForm = $("#read-form");
  const readFeedback = $("#read-feedback");

  readForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(readForm);
    const expr = data.get("expr");
    const hold = data.get("hold");
    if (!expr || !hold) {
      readFeedback.className = "feedback incorrect";
      readFeedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (expr === "b" && hold === "1") {
      done.read = true;
      readFeedback.className = "feedback correct";
      readFeedback.textContent = done.trace
        ? "Both correct. Signal Flow Through a Circuit is complete."
        : "Both correct. Finish Part 2 to complete this activity.";
      maybeComplete();
      return;
    }
    readFeedback.className = "feedback incorrect";
    if (expr !== "b" && hold !== "1") {
      readFeedback.textContent = "Neither answer is right yet. Trace the diagram from the inputs forward, one gate at a time.";
    } else if (expr !== "b") {
      readFeedback.textContent = "The second answer is right. For the first, look at which two signals meet at the AND gate before anything reaches the OR gate.";
    } else {
      readFeedback.textContent = "The expression is right. For the second, set W to 1 in Part 1 and try all four X and Y combinations.";
    }
  });
})();
