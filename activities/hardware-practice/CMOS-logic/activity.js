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
// Part 1: PMOS and NMOS circuits
document.querySelectorAll("#part-1-transistor-circuits [data-mosfet]").forEach(circuit => {
  const { mosfet, onInput } = circuit.dataset;
  const button = circuit.querySelector("button");
  const inputLabel = circuit.querySelector("[data-circuit-input]");
  const stateLabel = circuit.querySelector("[data-circuit-state]");
  const outputLabel = circuit.querySelector("[data-circuit-output]");
  const mosfetPath = circuit.querySelector("[data-mosfet-path]");
  const resistorPath = circuit.querySelector("[data-resistor-path]");
  const outputPath = circuit.querySelector("[data-output-path]");
  let input = 0;

 button.addEventListener("click", () => {
  input = 1 - input;
  const on = input === Number(onInput);
  const inputLevel = input === 0 ? "LOW" : "HIGH";
  const outputLevel = input === 0 ? "HIGH" : "LOW";
  const signal = "signal " + outputLevel.toLowerCase();

  inputLabel.textContent = "A = " + inputLevel;
  stateLabel.textContent = mosfet + (on ? " on" : " off");
  outputLabel.textContent = outputLabel.dataset.circuitOutput + "B = " + outputLevel;

  mosfetPath.setAttribute("class", on ? signal : "signal");
  resistorPath.setAttribute("class", on ? "signal" : signal);
  outputPath.setAttribute("class", signal);

  const action = input === 0 ? "Set input HIGH" : "Set input LOW";
  button.textContent = action;
  button.setAttribute("aria-label", action + " for the " + mosfet + " circuit");
});
});

// Part 2: CMOS inverter--------------------------------------------
document.querySelectorAll("[data-cmos-inverter]").forEach(inverter => {
  const button = inverter.querySelector("[data-inverter-toggle]");
  const status = inverter.querySelector("[data-inverter-status]");
  const rows = inverter.querySelectorAll("[data-inverter-row]");

  const inputLabel = inverter.querySelector("[data-inverter-input]");
  const outputLabel = inverter.querySelector("[data-inverter-output]");
  const pmosState = inverter.querySelector("[data-inverter-pmos-state]");
  const nmosState = inverter.querySelector("[data-inverter-nmos-state]");
  const pmosPath = inverter.querySelector("[data-inverter-pmos]");
  const nmosPath = inverter.querySelector("[data-inverter-nmos]");
  const outputWire = inverter.querySelector("[data-inverter-output-wire]");

  const notInputLabel = inverter.querySelector("[data-not-input-label]");
  const notOutputLabel = inverter.querySelector("[data-not-output-label]");
  const notInputWire = inverter.querySelector("[data-not-input-wire]");
  const notOutputWire = inverter.querySelector("[data-not-output-wire]");

  let inputHigh = false;

  button.addEventListener("click", () => {
    inputHigh = !inputHigh;
    const input = inputHigh ? "HIGH" : "LOW";
    const output = inputHigh ? "LOW" : "HIGH";
    const inputSignal = "signal " + input.toLowerCase();
    const outputSignal = "signal " + output.toLowerCase();

    // Update the transistor circuit.
    inputLabel.textContent = "A = " + input;
    outputLabel.textContent = "Y = " + output;
    pmosState.textContent = inputHigh ? "PMOS off" : "PMOS on";
    nmosState.textContent = inputHigh ? "NMOS on" : "NMOS off";

    pmosPath.setAttribute("class", inputHigh ? "signal" : outputSignal);
    nmosPath.setAttribute("class", inputHigh ? outputSignal : "signal");
    outputWire.setAttribute("class", outputSignal);

    // Update the NOT gate symbol.
    notInputLabel.textContent = "A = " + input;
    notOutputLabel.textContent = "Y = " + output;
    notInputWire.setAttribute("class", inputSignal);
    notOutputWire.setAttribute("class", outputSignal);

    // Highlight the truth-table row for the current input.
    rows.forEach(row => {
      const current = row.dataset.inverterRow === input;
      row.classList.toggle("highlight", current);
      row.setAttribute("aria-current", String(current));
    });

    button.textContent = inputHigh ? "Set input LOW" : "Set input HIGH";
    status.textContent = inputHigh
      ? "Input HIGH turns the NMOS on and the PMOS off. The NMOS pulls the output LOW."
      : "Input LOW turns the PMOS on and the NMOS off. The PMOS pulls the output HIGH.";
  });
});
  // ------------------------------------------------------ Part 3: the nand and nor
  document.querySelectorAll("[data-cmos-gates]").forEach(panel => {
  const find = selector => panel.querySelector(selector);
  const circuit = find("[data-gate-circuit]");
  const symbol = find("[data-gate-symbol]");
  const table = find("[data-gate-table]");
  const modeButtons = panel.querySelectorAll("[data-gate-mode]");
  const inputButtons = panel.querySelectorAll("[data-gate-input]");

  const inputs = { A: false, B: false };
  const combinations = [
    [false, false],
    [false, true],
    [true, false],
    [true, true]
  ];
  let gate = "NAND";

  const level = high => high ? "HIGH" : "LOW";
  const signal = high => high ? "signal high" : "signal low";
  const getOutput = (a, b) => gate === "NAND" ? !(a && b) : !(a || b);

  function drawTransistor(type, input, on, x, top, bottom, wireClass) {
    const y = (top + bottom) / 2;
    const gateX = x - 29;
    const pmos = type === "PMOS";
    const gateEnd = pmos ? gateX - 12 : gateX;

    return `
      <path class="${wireClass}" fill="none"
            d="M${x} ${top}V${y - 22}H${x - 16}V${y + 22}H${x}V${bottom}"/>
      <g fill="none" stroke="currentColor" stroke-width="3">
        <path d="M${x - 65} ${y}H${gateEnd} M${gateX} ${y - 20}V${y + 20}"/>
        ${pmos ? `<circle cx="${gateX - 6}" cy="${y}" r="6"/>` : ""}
      </g>
      <text class="svg-label" x="${x - 72}" y="${y + 6}"
            text-anchor="end">${input}</text>
      <text class="svg-small" x="${x + 12}" y="${y + 6}">
        ${type} ${on ? "on" : "off"}
      </text>`;
  }

  function drawNetwork(type, series, top, bottom, drivesOutput) {
    const pmos = type === "PMOS";
    const aOn = pmos ? !inputs.A : inputs.A;
    const bOn = pmos ? !inputs.B : inputs.B;
    const wireClass = drivesOutput ? signal(pmos) : "signal";
    const aWire = aOn ? wireClass : "signal";
    const bWire = bOn ? wireClass : "signal";
    const center = 230;

    if (series) {
      const middle = (top + bottom) / 2;
      return drawTransistor(type, "A", aOn, center, top, middle, aWire)
           + drawTransistor(type, "B", bOn, center, middle, bottom, bWire);
    }

    const left = 127;
    const right = 331;
    const topJoin = top + 30;
    const bottomJoin = bottom - 30;

    return `
      <path class="${wireClass}" fill="none"
            d="M${center} ${top}V${topJoin} M${center} ${bottomJoin}V${bottom}"/>
      <path class="${aWire}" fill="none"
            d="M${left} ${topJoin}H${center} M${left} ${bottomJoin}H${center}"/>
      <path class="${bWire}" fill="none"
            d="M${center} ${topJoin}H${right} M${center} ${bottomJoin}H${right}"/>
      ${drawTransistor(type, "A", aOn, left, topJoin, bottomJoin, aWire)}
      ${drawTransistor(type, "B", bOn, right, topJoin, bottomJoin, bWire)}
      <circle cx="${center}" cy="${topJoin}" r="4" fill="currentColor"/>
      <circle cx="${center}" cy="${bottomJoin}" r="4" fill="currentColor"/>`;
  }

  function render() {
    const { A, B } = inputs;
    const nand = gate === "NAND";
    const outputHigh = getOutput(A, B);
    const output = level(outputHigh);
    const levels = `A = ${level(A)}, B = ${level(B)}, Y = ${output}`;

    find("[data-circuit-heading]").textContent = "CMOS " + gate + " circuit";
    find("[data-symbol-heading]").textContent = gate + " gate symbol";
    find("[data-gate-caption]").textContent = gate + " truth table";

    // NAND uses parallel PMOS and series NMOS. NOR reverses those arrangements.
    circuit.setAttribute("aria-label", `CMOS ${gate} circuit. ${levels}`);
    circuit.innerHTML = `
      <text class="svg-label" x="230" y="20" text-anchor="middle">VDD</text>
      ${drawNetwork("PMOS", !nand, 30, 225, outputHigh)}
      ${drawNetwork("NMOS", nand, 225, 420, !outputHigh)}
      <path fill="none" stroke="currentColor" stroke-width="3"
            d="M214 30H246 M214 420H246 M219 427H241 M225 434H235"/>
      <path class="${signal(outputHigh)}" d="M230 225H352"/>
      <circle cx="230" cy="225" r="4" fill="currentColor"/>
      <text class="svg-label" x="360" y="231">Y = ${output}</text>
      <text class="svg-label" x="230" y="457" text-anchor="middle">GND</text>`;

    // Draw the AND or OR outline and add the inversion bubble.
    const shape = nand
      ? "M142 30H191A36 36 0 0 1 191 102H142Z"
      : "M142 30Q200 27 227 66Q200 105 142 102Q165 66 142 30Z";
    const inputEnd = nand ? 142 : 151;

    symbol.setAttribute("aria-label", `${gate} gate symbol. ${levels}`);
    symbol.innerHTML = `
      <g fill="none" stroke="currentColor" stroke-width="3">
        <path class="${signal(A)}" d="M102 48H${inputEnd}"/>
        <path class="${signal(B)}" d="M102 84H${inputEnd}"/>
        <path d="${shape}"/>
        <circle cx="234" cy="66" r="7"/>
        <path class="${signal(outputHigh)}" d="M241 66H314"/>
      </g>
      <text class="svg-label" x="10" y="54">A = ${level(A)}</text>
      <text class="svg-label" x="10" y="90">B = ${level(B)}</text>
      <text class="svg-label" x="324" y="72">Y = ${output}</text>`;

    table.innerHTML = combinations.map(([a, b]) => {
      const current = a === A && b === B;
      return `<tr${current ? ' class="highlight" aria-current="true"' : ""}>
        <td>${level(a)}</td>
        <td>${level(b)}</td>
        <td>${level(getOutput(a, b))}</td>
      </tr>`;
    }).join("");

    modeButtons.forEach(button => {
      const selected = button.dataset.gateMode === gate;
      button.classList.toggle("primary", selected);
      button.classList.toggle("secondary", !selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    inputButtons.forEach(button => {
      const input = button.dataset.gateInput;
      button.textContent = `Set ${input} ${level(!inputs[input])}`;
    });

    find("[data-gate-status]").textContent =
      `${levels}. The ${outputHigh ? "PMOS" : "NMOS"} network pulls the output ${output}.`;
  }

  modeButtons.forEach(button => button.addEventListener("click", () => {
    gate = button.dataset.gateMode;
    render();
  }));

  inputButtons.forEach(button => button.addEventListener("click", () => {
    const input = button.dataset.gateInput;
    inputs[input] = !inputs[input];
    render();
  }));

  render();
});

  // ---------------------------------------------------- Part 4: XOR
  document.querySelectorAll("[data-cmos-xor]").forEach(panel => {
  const circuit = panel.querySelector("[data-xor-circuit]");
  const symbol = panel.querySelector("[data-xor-symbol]");
  const status = panel.querySelector("[data-xor-status]");
  const buttons = panel.querySelectorAll("[data-xor-input]");
  const rows = panel.querySelectorAll("[data-xor-row]");

  const inputs = { A: false, B: false };
  const level = high => high ? "HIGH" : "LOW";
  const signal = high => high ? "signal high" : "signal low";
  const invert = net => ({ name: net.name + "\u0305", high: !net.high });
  const isOn = (net, pmos) => pmos ? !net.high : net.high;

  function drawTransistor(net, pmos, x, top, bottom, wire) {
    const y = (top + bottom) / 2;
    const gateX = x - 26;
    const gateEnd = pmos ? gateX - 10 : gateX;
    const type = pmos ? "PMOS" : "NMOS";
    const state = isOn(net, pmos) ? "on" : "off";

    return `
      <path class="${wire}" fill="none"
            d="M${x} ${top}V${y - 16}H${x - 14}V${y + 16}H${x}V${bottom}"/>
      <g fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M${x - 55} ${y}H${gateEnd} M${gateX} ${y - 15}V${y + 15}"/>
        ${pmos ? `<circle cx="${gateX - 5}" cy="${y}" r="5"/>` : ""}
      </g>
      <text class="svg-label" x="${x - 63}" y="${y + 5}"
            text-anchor="end">${net.name}</text>
      <text class="svg-small" x="${x + 12}" y="${y + 5}">${type} ${state}</text>`;
  }

  function drawNetwork(pmos, top, bottom, pairs) {
    const topJoin = top + 25;
    const bottomJoin = bottom - 25;
    const middle = (topJoin + bottomJoin) / 2;

    // Each branch contains two transistors in series.
    const active = pairs.map(pair => pair.every(net => isOn(net, pmos)));
    const trunk = active.some(Boolean) ? signal(pmos) : "signal";

    const branches = pairs.map(([first, second], index) => {
      const x = index === 0 ? 128 : 286;
      const wire = active[index] ? signal(pmos) : "signal";

      return `
        <path class="${wire}" fill="none"
              d="M208 ${topJoin}H${x} M${x} ${bottomJoin}H208"/>
        ${drawTransistor(first, pmos, x, topJoin, middle, wire)}
        ${drawTransistor(second, pmos, x, middle, bottomJoin, wire)}`;
    }).join("");

    return `
      <path class="${trunk}" fill="none"
            d="M208 ${top}V${topJoin} M208 ${bottomJoin}V${bottom}"/>
      ${branches}
      <circle cx="208" cy="${topJoin}" r="4" fill="currentColor"/>
      <circle cx="208" cy="${bottomJoin}" r="4" fill="currentColor"/>`;
  }

  function drawInverter(net, inverse, x) {
    return `
      <g transform="translate(${x} 28)" fill="none"
         stroke="currentColor" stroke-width="2.5">
        <path class="${signal(net.high)}" d="M22 0H36"/>
        <path d="M36 -11V11L58 0Z"/>
        <circle cx="62" cy="0" r="4"/>
        <path class="${signal(inverse.high)}" d="M66 0H80"/>
        <text class="svg-label" x="0" y="6" stroke="none">${net.name}</text>
        <text class="svg-label" x="90" y="6" stroke="none">${inverse.name}</text>
      </g>`;
  }

  function render() {
    const a = { name: "A", high: inputs.A };
    const b = { name: "B", high: inputs.B };
    const notA = invert(a);
    const notB = invert(b);
    const y = { name: "Y", high: a.high !== b.high };
    const description = `A = ${level(a.high)}, B = ${level(b.high)}, Y = ${level(y.high)}`;

    circuit.setAttribute("aria-label", `CMOS XOR circuit. ${description}.`);
    circuit.innerHTML = `
      ${drawInverter(a, notA, 85)}
      ${drawInverter(b, notB, 232)}
      <text class="svg-label" x="208" y="67" text-anchor="middle">VDD</text>

      ${drawNetwork(true, 79, 267, [[a, notB], [notA, b]])}
      ${drawNetwork(false, 267, 455, [[a, b], [notA, notB]])}

      <path fill="none" stroke="currentColor" stroke-width="3"
            d="M192 79H224 M192 455H224 M197 462H219 M203 469H213"/>
      <path class="${signal(y.high)}" d="M208 267H307"/>
      <circle cx="208" cy="267" r="4" fill="currentColor"/>
      <text class="svg-label" x="315" y="273">Y = ${level(y.high)}</text>
      <text class="svg-label" x="208" y="492" text-anchor="middle">GND</text>`;

    symbol.setAttribute("aria-label", `XOR gate. ${description}.`);
    for (const { name, high } of [a, b, y]) {
      symbol.querySelector(`[data-xor-label="${name}"]`).textContent =
        `${name} = ${level(high)}`;
      symbol.querySelector(`[data-xor-wire="${name}"]`)
        .setAttribute("class", signal(high));
    }

    const selectedRow = `${level(a.high)} ${level(b.high)}`;
    rows.forEach(row => {
      const current = row.dataset.xorRow === selectedRow;
      row.classList.toggle("highlight", current);
      row.setAttribute("aria-current", String(current));
    });

    buttons.forEach(button => {
      const input = button.dataset.xorInput;
      button.textContent = `Set ${input} ${level(!inputs[input])}`;
    });

    const network = y.high ? "PMOS" : "NMOS";
    status.textContent = `${description}. The ${network} network pulls Y ${level(y.high)}.`;
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    const input = button.dataset.xorInput;
    inputs[input] = !inputs[input];
    render();
  }));

  render();
});


  // ------------------------------------------------------ Part 5: 3-bit
  document.querySelectorAll("[data-cmos-parity]").forEach(panel => {
  const firstStage = panel.querySelector('[data-parity-stage="1"]');
  const secondStage = panel.querySelector('[data-parity-stage="2"]');
  const symbol = panel.querySelector("[data-parity-symbol]");
  const table = panel.querySelector("[data-parity-table]");
  const status = panel.querySelector("[data-parity-status]");
  const buttons = panel.querySelectorAll("[data-parity-input]");

  const inputs = { A: false, B: false, C: false };
  const levels = [false, true];
  const combinations = levels.flatMap(a =>
    levels.flatMap(b => levels.map(c => [a, b, c]))
  );

  const level = high => high ? "HIGH" : "LOW";
  const signal = high => high ? "signal high" : "signal low";
  const invert = net => ({ name: net.name + "\u0305", high: !net.high });
  const isOn = (net, pmos) => pmos ? !net.high : net.high;

  function drawTransistor(net, pmos, x, top, bottom, wire) {
    const y = (top + bottom) / 2;
    const gate = x - 26;
    const gateEnd = pmos ? gate - 10 : gate;
    const state = isOn(net, pmos) ? "on" : "off";
    const type = pmos ? "PMOS" : "NMOS";

    return `
      <path class="${wire}" fill="none"
            d="M${x} ${top}V${y - 16}H${x - 14}V${y + 16}H${x}V${bottom}"/>
      <g fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M${x - 55} ${y}H${gateEnd} M${gate} ${y - 15}V${y + 15}"/>
        ${pmos ? `<circle cx="${gate - 5}" cy="${y}" r="5"/>` : ""}
      </g>
      <text class="svg-label" x="${x - 63}" y="${y + 5}"
            text-anchor="end">${net.name}</text>
      <text class="svg-small" x="${x + 12}" y="${y + 5}">${type} ${state}</text>`;
  }

  function drawNetwork(pmos, top, bottom, pairs) {
    const topJoin = top + 25;
    const bottomJoin = bottom - 25;
    const middle = (topJoin + bottomJoin) / 2;

    // Each branch conducts when both of its transistors are on.
    const active = pairs.map(pair => pair.every(net => isOn(net, pmos)));
    const trunk = active.some(Boolean) ? signal(pmos) : "signal";

    const branches = pairs.map(([first, second], index) => {
      const x = index === 0 ? 128 : 286;
      const wire = active[index] ? signal(pmos) : "signal";

      return `
        <path class="${wire}" fill="none"
              d="M208 ${topJoin}H${x} M${x} ${bottomJoin}H208"/>
        ${drawTransistor(first, pmos, x, topJoin, middle, wire)}
        ${drawTransistor(second, pmos, x, middle, bottomJoin, wire)}`;
    }).join("");

    return `
      <path class="${trunk}" fill="none"
            d="M208 ${top}V${topJoin} M208 ${bottomJoin}V${bottom}"/>
      ${branches}
      <circle cx="208" cy="${topJoin}" r="4" fill="currentColor"/>
      <circle cx="208" cy="${bottomJoin}" r="4" fill="currentColor"/>`;
  }

  // Each NOT symbol represents a CMOS inverter supplying an inverted input.
  function drawInverter(net, inverse, x) {
    return `
      <g transform="translate(${x} 28)" fill="none"
         stroke="currentColor" stroke-width="2.5">
        <path class="${signal(net.high)}" d="M22 0H36"/>
        <path d="M36 -11V11L58 0Z"/>
        <circle cx="62" cy="0" r="4"/>
        <path class="${signal(inverse.high)}" d="M66 0H80"/>
        <text class="svg-label" x="0" y="6" stroke="none">${net.name}</text>
        <text class="svg-label" x="90" y="6" stroke="none">${inverse.name}</text>
      </g>`;
  }

  function drawStage(svg, a, b, out) {
    const notA = invert(a);
    const notB = invert(b);

    svg.setAttribute(
      "aria-label",
      `CMOS XOR stage. ${a.name} is ${level(a.high)}, ` +
      `${b.name} is ${level(b.high)}, and ${out.name} is ${level(out.high)}.`
    );

    // The PMOS network pulls up when the inputs differ.
    // The NMOS network pulls down when the inputs match.
    svg.innerHTML = `
      ${drawInverter(a, notA, 85)}
      ${drawInverter(b, notB, 232)}
      <text class="svg-label" x="208" y="67" text-anchor="middle">VDD</text>

      ${drawNetwork(true, 79, 267, [[a, notB], [notA, b]])}
      ${drawNetwork(false, 267, 455, [[a, b], [notA, notB]])}

      <path fill="none" stroke="currentColor" stroke-width="3"
            d="M192 79H224 M192 455H224 M197 462H219 M203 469H213"/>
      <path class="${signal(out.high)}" d="M208 267H307"/>
      <circle cx="208" cy="267" r="4" fill="currentColor"/>
      <text class="svg-label" x="315" y="273">${out.name} = ${level(out.high)}</text>
      <text class="svg-label" x="208" y="492" text-anchor="middle">GND</text>`;
  }

  function xorOutline(x, y) {
    return `
      <g transform="translate(${x} ${y})" fill="none"
         stroke="currentColor" stroke-width="3">
        <path d="M0 -38Q55 -41 82 0Q55 41 0 38Q21 0 0 -38Z"/>
        <path d="M-12 -38Q9 0 -12 38"/>
      </g>`;
  }

  function render() {
    const { A, B, C } = inputs;
    const x = A !== B;
    const y = x !== C;
    const intermediate = { name: "X", high: x };
    const output = { name: "Y", high: y };
    const description =
      `A = ${level(A)}, B = ${level(B)}, C = ${level(C)}, ` +
      `X = ${level(x)}, Y = ${level(y)}`;

    drawStage(firstStage, { name: "A", high: A }, { name: "B", high: B }, intermediate);
    drawStage(secondStage, intermediate, { name: "C", high: C }, output);

    symbol.setAttribute("aria-label", `Two XOR gates in series. ${description}.`);
    symbol.innerHTML = `
      <g fill="none">
        <path class="${signal(A)}" d="M102 49H168"/>
        <path class="${signal(B)}" d="M102 85H168"/>
        <path class="${signal(x)}" d="M242 67H330V94H413"/>
        <path class="${signal(C)}" d="M102 130H413"/>
        <path class="${signal(y)}" d="M487 112H545"/>
      </g>
      ${xorOutline(160, 67)}
      ${xorOutline(405, 112)}
      <text class="svg-label" x="10" y="55">A = ${level(A)}</text>
      <text class="svg-label" x="10" y="91">B = ${level(B)}</text>
      <text class="svg-label" x="10" y="136">C = ${level(C)}</text>
      <text class="svg-label" x="253" y="55">X = ${level(x)}</text>
      <text class="svg-label" x="553" y="118">Y = ${level(y)}</text>`;

    table.innerHTML = combinations.map(([a, b, c]) => {
      const current = a === A && b === B && c === C;
      return `<tr${current ? ' class="highlight" aria-current="true"' : ""}>
        <td>${level(a)}</td>
        <td>${level(b)}</td>
        <td>${level(c)}</td>
        <td>${level((a !== b) !== c)}</td>
      </tr>`;
    }).join("");

    buttons.forEach(button => {
      const input = button.dataset.parityInput;
      button.textContent = `Set ${input} ${level(!inputs[input])}`;
    });

    status.textContent = description + ".";
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    const input = button.dataset.parityInput;
    inputs[input] = !inputs[input];
    render();
  }));

  render();
});


})();
