"use strict";

const SCALES = {
  ssi: ["< 12 transistors", "Basic gate functions"],
  msi: ["12\u201399 transistors", "Decoding, multiplexing and counting"],
  lsi: ["100\u20139,999 transistors", "Small memories, microprocessors, PLDs and CPLDs"],
  vlsi: ["10,000\u2013999,999 transistors", "Field-programmable gate arrays in the original classification"],
  ulsi: ["> 1,000,000 transistors", "Large processors and memories in the original classification"]
};

(() => {
  const $ = selector => document.querySelector(selector);
  const PINS = 14, PER_SIDE = PINS / 2;

  // ------------------------------------------------------ package selector
  const packageSelect = $("#package");
  function renderPackage() {
    const smd = packageSelect.value === "smd";
    $("#package-name").textContent = smd ? "Surface-mounted package" : "Dual in-line through-hole package";
    $("#package-detail").textContent = smd
      ? "Soldered directly onto pads on the board surface. Compact and cheap to assemble by machine, but not usable on a breadboard."
      : "Pins pass through holes in the board on a 0.1 inch pitch. Fits sockets and breadboards, which is why it is the package you prototype with.";
    $("#package-visual").innerHTML = smd
      ? '<div class="smd-chip"><span class="dip-label">IC</span></div>'
      : '<div class="dip-chip"><span class="dip-notch"></span><span class="dip-label">DIP IC</span></div>';
  }
  packageSelect.addEventListener("change", renderPackage);
  renderPackage();

  // ------------------------------------------------------- scale selector
  const scale = $("#scale");
  function renderScale() {
    const [count, application] = SCALES[scale.value];
    $("#scale-count").textContent = count;
    $("#scale-application").textContent = application;
  }
  scale.addEventListener("change", renderScale);
  renderScale();

  // --------------------------------------------------- DIP pin numbering
  // Viewed from above with the notch at the left, pin 1 is bottom-left and
  // numbering runs counter-clockwise: along the bottom, then back along the top.
  function pinPosition(pin) {
    const step = 380 / (PER_SIDE + 1);
    if (pin <= PER_SIDE) return { x: 90 + step * pin, y: 205, side: "bottom" };
    const fromRight = pin - PER_SIDE;         // 1..7 travelling right to left
    return { x: 90 + step * (PER_SIDE + 1 - fromRight), y: 55, side: "top" };
  }

  const solved = new Set();
  let targetPin = 9;
  const TASK_PINS = [9, 3, 14, 7];

  function renderPins() {
    const group = $("#dip-pins");
    group.innerHTML = "";
    for (let pin = 1; pin <= PINS; pin += 1) {
      const { x, y, side } = pinPosition(pin);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "dip-pin");
      g.dataset.pin = String(pin);
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x - 11));
      rect.setAttribute("y", String(side === "bottom" ? y - 18 : y - 12));
      rect.setAttribute("width", "22");
      rect.setAttribute("height", "30");
      rect.setAttribute("rx", "4");
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(side === "bottom" ? y + 30 : y - 22));
      label.setAttribute("text-anchor", "middle");
      label.textContent = String(pin);
      g.append(rect, label);
      g.addEventListener("click", () => choosePin(pin));
      group.append(g);
    }
  }

  function nextTask() {
    const remaining = TASK_PINS.filter(p => !solved.has(p));
    if (remaining.length === 0) return;
    targetPin = remaining[0];
    $("#pin-target").textContent = `pin ${targetPin}`;
  }

  function choosePin(pin) {
    const note = $("#pin-note");
    if (pin === targetPin) {
      solved.add(pin);
      $("#pin-progress").value = solved.size;
      $("#pin-progress-text").textContent = `${solved.size} of ${TASK_PINS.length}`;
      if (solved.size === TASK_PINS.length) {
        note.textContent = "All four found. Notice that pin 7 and pin 14 are diagonally opposite \u2014 on a 14-pin logic chip those are ground and V\u1d04\u1d04.";
        note.className = "result-box correct";
        maybeComplete();
        return;
      }
      note.textContent = `Correct, that is pin ${pin}.`;
      note.className = "result-box correct";
      nextTask();
    } else {
      const { side } = pinPosition(pin);
      note.textContent = `That is pin ${pin}, on the ${side} row. Pin 1 is bottom-left; count along the bottom row first, then continue right to left along the top.`;
      note.className = "result-box mismatch";
    }
  }

  $("#pin-restart").addEventListener("click", () => {
    solved.clear();
    $("#pin-progress").value = 0;
    $("#pin-progress-text").textContent = `0 of ${TASK_PINS.length}`;
    targetPin = TASK_PINS[0];
    $("#pin-target").textContent = `pin ${targetPin}`;
    $("#pin-note").textContent = "Work round from pin 1 at the bottom-left.";
    $("#pin-note").className = "result-box";
  });

  renderPins();
  nextTask();
  $("#pin-progress-text").textContent = `0 of ${TASK_PINS.length}`;

  // ---------------------------------------------------------------- check
  let quizDone = false;
  function maybeComplete() {
    if (quizDone && solved.size === TASK_PINS.length) {
      globalThis.SmartStartProgress?.complete("integrated-circuits");
    }
  }

  const form = $("#check-form");
  const feedback = $("#feedback");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const q1 = data.get("q1"), q2 = data.get("q2");
    if (!q1 || !q2) {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (q1 === "b" && q2 === "b") {
      quizDone = true;
      feedback.className = "feedback correct";
      feedback.textContent = solved.size === TASK_PINS.length
        ? "Both correct. Integrated Circuits, Families and Packaging is complete."
        : "Both correct. Finish the pin-numbering exercise in Part 3 to complete this activity.";
      maybeComplete();
      return;
    }
    feedback.className = "feedback incorrect";
    feedback.textContent = q1 !== "b"
      ? "Not yet. Separate the semiconductor technology and the circuit function from the physical package."
      : "The first is right. For the second, think about what a MOSFET gate is made of.";
  });
})();
