"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const SIZE = 8;

  // cells[addr] is the bit stored at that address
  const cells = Array(SIZE).fill(0);
  const addressBits = { a2: 0, a1: 0, a0: 0 };

  const PRESETS = {
    and: { bits: [0, 0, 0, 0, 0, 0, 0, 1], note: "3-input AND: only address 111 stores a 1." },
    xor: { bits: [0, 1, 1, 0, 1, 0, 0, 1], note: "3-input XOR: a 1 wherever an odd number of address bits are 1." },
    maj: { bits: [0, 0, 0, 1, 0, 1, 1, 1], note: "Majority: a 1 wherever at least two of the three inputs are 1." },
    clear: { bits: [0, 0, 0, 0, 0, 0, 0, 0], note: "All cells cleared." }
  };

  // Functions the student is asked to synthesise in Part 3
  const TASKS = [
    { label: "F = A<sub>2</sub> &middot; A<sub>1</sub> + A<sub>0</sub>", fn: (a2, a1, a0) => (a2 & a1) | a0 },
    { label: "F = A<sub>2</sub> &oplus; A<sub>1</sub>", fn: (a2, a1) => a2 ^ a1 },
    { label: "F = (A<sub>2</sub> + A<sub>1</sub>)&prime; &middot; A<sub>0</sub>", fn: (a2, a1, a0) => (Number(!(a2 | a1))) & a0 },
    { label: "F is 1 when exactly one input is 1", fn: (a2, a1, a0) => ((a2 + a1 + a0) === 1 ? 1 : 0) },
    { label: "F = A<sub>2</sub> &middot; (A<sub>1</sub> &oplus; A<sub>0</sub>)", fn: (a2, a1, a0) => a2 & (a1 ^ a0) }
  ];
  let task = TASKS[0];

  const currentAddress = () => (addressBits.a2 << 2) | (addressBits.a1 << 1) | addressBits.a0;

  function renderCells() {
    const addr = currentAddress();
    const container = $("#lut-cells");
    container.innerHTML = "";
    for (let i = 0; i < SIZE; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lut-cell" + (cells[i] === 1 ? " on" : "") + (i === addr ? " addressed" : "");
      button.innerHTML = `<span>${i.toString(2).padStart(3, "0")}</span>${cells[i]}`;
      button.setAttribute("aria-label", `Address ${i}, currently ${cells[i]}`);
      button.addEventListener("click", () => { cells[i] ^= 1; render(); });
      container.append(button);
    }
  }

  function renderTask() {
    $("#task-prompt").innerHTML = `Program the LUT so that it implements <strong>${task.label}</strong>.`;
    const body = $("#task-body");
    body.innerHTML = [...Array(SIZE).keys()].map(i => {
      const a2 = (i >> 2) & 1, a1 = (i >> 1) & 1, a0 = i & 1;
      const required = task.fn(a2, a1, a0);
      const stored = cells[i];
      const match = required === stored;
      return `<tr class="${match ? "" : "mismatch-row"}"><td>${i}</td><td>${a2}</td><td>${a1}</td><td>${a0}</td>`
        + `<td>${required}</td><td>${stored}</td></tr>`;
    }).join("");
  }

  function render() {
    const addr = currentAddress();
    renderCells();
    renderTask();
    $("#lut-addr").textContent = `${addr} (${addr.toString(2).padStart(3, "0")})`;
    $("#lut-out").textContent = String(cells[addr]);
    $("#lut-status").textContent =
      `Address ${addr.toString(2).padStart(3, "0")} selects cell ${addr}, which stores ${cells[addr]}. The output is ${cells[addr]}.`;
  }

  [["a2", "#lut-a2"], ["a1", "#lut-a1"], ["a0", "#lut-a0"]].forEach(([key, sel]) => {
    const node = $(sel);
    node.addEventListener("click", () => {
      addressBits[key] = Number(!addressBits[key]);
      node.setAttribute("aria-checked", String(Boolean(addressBits[key])));
      node.querySelector("span").textContent = String(addressBits[key]);
      render();
    });
  });

  document.querySelectorAll("[data-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const preset = PRESETS[button.dataset.preset];
      preset.bits.forEach((bit, i) => { cells[i] = bit; });
      render();
      $("#lut-status").textContent = preset.note;
    });
  });

  const feedback = $("#task-feedback");

  $("#task-form").addEventListener("submit", event => {
    event.preventDefault();
    const wrong = [...Array(SIZE).keys()].filter(i => {
      const a2 = (i >> 2) & 1, a1 = (i >> 1) & 1, a0 = i & 1;
      return task.fn(a2, a1, a0) !== cells[i];
    });
    if (wrong.length === 0) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. The stored bits are the truth table, and the truth table is the circuit. Synthesis with Lookup Tables is complete.";
      globalThis.SmartStartProgress?.complete("lut-synthesis");
      return;
    }
    feedback.className = "feedback incorrect";
    feedback.textContent = `${wrong.length} of ${SIZE} cells do not match: address${wrong.length === 1 ? "" : "es"} ${wrong.join(", ")}. Those rows are highlighted in the table.`;
  });

  $("#task-new").addEventListener("click", () => {
    let next = task;
    while (next === task) next = TASKS[Math.floor(Math.random() * TASKS.length)];
    task = next;
    render();
    feedback.className = "feedback";
    feedback.textContent = "New function set. Program the eight cells above, then check your work.";
  });

  render();
})();
