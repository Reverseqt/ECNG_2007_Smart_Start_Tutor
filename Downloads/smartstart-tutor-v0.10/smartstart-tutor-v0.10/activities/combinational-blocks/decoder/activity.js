"use strict";

// Row state lives in the shared progress store so that it survives the same
// iframe storage restrictions as everything else, and travels with the
// export/import codes on the About page.
const ROW_KEY = index => `decoder.row.${index}`;

const { bit, decode2to4, decode3to8 } = globalThis.SmartStartDecoderLogic;
function initialiseExplorer() {
  const state = { enable: 0, a1: 0, a0: 0 };
  const switches = [...document.querySelectorAll(".bit-switch")];
  const tableRows = [...document.querySelectorAll("#decoder-2-table tbody tr")];

  function update() {
    const inputCode = `${state.a1}${state.a0}`;
    const decimal = (state.a1 << 1) | state.a0;
    const outputs = decode2to4(state.enable, state.a1, state.a0);

    document.getElementById("input-code").textContent = inputCode;
    document.getElementById("decimal-value").textContent = String(decimal);

    for (const wire of document.querySelectorAll(".input-wire")) {
      wire.classList.toggle("active", state[wire.dataset.wire] === 1);
    }
    for (const wire of document.querySelectorAll(".output-wire")) {
      const index = Number(wire.dataset.output);
      wire.classList.toggle("active", outputs[index] === 1);
    }

    const key = state.enable ? `1${state.a1}${state.a0}` : "0xx";
    tableRows.forEach(row => row.classList.toggle("current", row.dataset.key === key));

    const status = document.getElementById("explorer-status");
    status.textContent = state.enable
      ? `Input ${inputCode} is decimal ${decimal}, so output Y${decimal} is 1.`
      : "The decoder is disabled, so all outputs are 0.";
  }

  for (const control of switches) {
    control.addEventListener("click", () => {
      const name = control.dataset.control;
      state[name] = state[name] ? 0 : 1;
      control.setAttribute("aria-checked", String(state[name] === 1));
      control.querySelector("span").textContent = String(state[name]);
      update();
    });
  }

  update();
}

function safeLoadRows() {
  const store = globalThis.SmartStartProgress;
  if (!store) return new Set();
  return new Set([...Array(8).keys()].filter(index => store.get(ROW_KEY(index))));
}

function safeSaveRows(rows) {
  const store = globalThis.SmartStartProgress;
  if (!store) return;
  for (let index = 0; index < 8; index += 1) {
    store.set(ROW_KEY(index), rows.has(index));
  }
}

function initialiseExercise() {
  const form = document.getElementById("decoder-exercise");
  const enableSelect = document.getElementById("ex-enable");
  const a2Select = document.getElementById("ex-a2");
  const a1Select = document.getElementById("ex-a1");
  const a0Select = document.getElementById("ex-a0");
  const outputSelects = [...document.querySelectorAll("#output-selects select")];
  const feedback = document.getElementById("exercise-feedback");
  const body = document.getElementById("decoder-3-body");
  const completedRows = safeLoadRows();

  function rowOutputDisplay(input) {
    return decode3to8(1, (input >> 2) & 1, (input >> 1) & 1, input & 1)
      .slice()
      .reverse(); // Display order is Y7 through Y0, matching the original tutor.
  }

  function buildTable() {
    body.replaceChildren();

    const disabledRow = document.createElement("tr");
    disabledRow.innerHTML = "<td>0</td><td>×</td><td>×</td><td>×</td>" + Array(8).fill("<td>0</td>").join("");
    disabledRow.className = "revealed";
    body.append(disabledRow);

    for (let input = 0; input < 8; input += 1) {
      const row = document.createElement("tr");
      row.dataset.input = String(input);
      const bits = input.toString(2).padStart(3, "0").split("");
      const prefix = ["1", ...bits].map(value => `<td>${value}</td>`).join("");
      const isComplete = completedRows.has(input);
      const outputCells = isComplete
        ? rowOutputDisplay(input).map(value => `<td>${value}</td>`).join("")
        : Array(8).fill('<td class="masked" aria-label="not yet revealed">—</td>').join("");
      row.innerHTML = prefix + outputCells;
      row.classList.toggle("revealed", isComplete);
      body.append(row);
    }
  }

  function updateProgress() {
    const count = completedRows.size;
    if (count === 8) globalThis.SmartStartProgress?.complete("decoder");
    document.getElementById("row-progress").value = count;
    document.getElementById("progress-text").textContent = `${count} of 8`;
  }

  function currentInputs() {
    return {
      enable: bit(enableSelect.value),
      a2: bit(a2Select.value),
      a1: bit(a1Select.value),
      a0: bit(a0Select.value)
    };
  }

  function selectedOutputs() {
    const valuesByNumber = Array(8).fill(0);
    for (const select of outputSelects) {
      valuesByNumber[Number(select.dataset.output)] = bit(select.value);
    }
    return valuesByNumber;
  }

  function setFeedback(message, kind) {
    feedback.textContent = message;
    feedback.className = `feedback ${kind}`;
  }

  function highlightCurrentRow() {
    const { enable, a2, a1, a0 } = currentInputs();
    for (const row of body.querySelectorAll("tr")) row.classList.remove("current");
    if (!enable) {
      body.querySelector("tr")?.classList.add("current");
      return;
    }
    const input = (a2 << 2) | (a1 << 1) | a0;
    body.querySelector(`tr[data-input="${input}"]`)?.classList.add("current");
  }

  function resetOutputSelections() {
    outputSelects.forEach(select => { select.value = "0"; });
  }

  function setInput(input) {
    enableSelect.value = "1";
    a2Select.value = String((input >> 2) & 1);
    a1Select.value = String((input >> 1) & 1);
    a0Select.value = String(input & 1);
    resetOutputSelections();
    highlightCurrentRow();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const { enable, a2, a1, a0 } = currentInputs();
    const selected = selectedOutputs();
    const expected = decode3to8(enable, a2, a1, a0);
    const correct = expected.every((value, index) => value === selected[index]);
    const input = (a2 << 2) | (a1 << 1) | a0;

    if (correct) {
      if (!enable) {
        setFeedback("Correct: when enable is 0, every output is 0. The disabled row was already shown in the original exercise.", "correct");
      } else {
        const wasNew = !completedRows.has(input);
        completedRows.add(input);
        safeSaveRows(completedRows);
        buildTable();
        highlightCurrentRow();
        updateProgress();
        if (completedRows.size === 8) {
          setFeedback("Success: you have recovered all eight enabled rows of the 3-to-8 decoder truth table.", "correct");
        } else {
          setFeedback(`${wasNew ? "Correct" : "Correct again"}: input ${input.toString(2).padStart(3, "0")} activates Y${input}.`, "correct");
        }
      }
      return;
    }

    const activeSelections = selected.reduce((sum, value) => sum + value, 0);
    if (!enable && activeSelections !== 0) {
      setFeedback("Not yet: a disabled decoder must have all outputs set to 0.", "incorrect");
    } else if (enable && activeSelections !== 1) {
      setFeedback("Not yet: when this active-high decoder is enabled, exactly one output should be 1.", "incorrect");
    } else {
      setFeedback(`Not yet: convert input ${a2}${a1}${a0} to decimal, then activate the output with that number.`, "incorrect");
    }
  });

  for (const select of [enableSelect, a2Select, a1Select, a0Select]) {
    select.addEventListener("change", highlightCurrentRow);
  }

  document.getElementById("next-row").addEventListener("click", () => {
    const next = [...Array(8).keys()].find(input => !completedRows.has(input));
    if (next === undefined) {
      setFeedback("All enabled rows are complete.", "correct");
      return;
    }
    setInput(next);
    setFeedback(`Input ${next.toString(2).padStart(3, "0")} selected. Predict which output should be 1.`, "neutral");
  });

  document.getElementById("reset-exercise").addEventListener("click", () => {
    completedRows.clear();
    globalThis.SmartStartProgress?.set("decoder", false);
    safeSaveRows(completedRows);
    enableSelect.value = "0";
    a2Select.value = "0";
    a1Select.value = "0";
    a0Select.value = "0";
    resetOutputSelections();
    buildTable();
    updateProgress();
    highlightCurrentRow();
    setFeedback("Progress cleared. Start with any enabled input combination.", "neutral");
  });

  buildTable();
  updateProgress();
  highlightCurrentRow();
}

function initialiseActivity() {
  initialiseExplorer();
  initialiseExercise();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseActivity, { once: true });
} else {
  initialiseActivity();
}
