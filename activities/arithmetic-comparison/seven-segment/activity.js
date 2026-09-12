"use strict";

// Segment sets for the ten BCD digits, recovered from the original tutor.
const MAP = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };

// The six hexadecimal extensions. B and D are drawn lowercase because the
// uppercase forms would be indistinguishable from 8 and 0.
const HEX = {
  A: { label: "A", segments: "abcefg", note: "an 8 with the bottom bar off" },
  b: { label: "b", segments: "cdefg", note: "lowercase, or it would look like 8" },
  C: { label: "C", segments: "adef", note: "a 0 with the two right segments off" },
  d: { label: "d", segments: "bcdeg", note: "lowercase, or it would look like 0" },
  E: { label: "E", segments: "adefg", note: "a C with the middle bar added" },
  F: { label: "F", segments: "aefg", note: "an E with the bottom bar off" }
};
const HEX_ORDER = ["A", "b", "C", "d", "E", "F"];
const ORDER = "abcdefg".split("");
const norm = set => ORDER.filter(s => set.includes(s)).join("");
const toBits = set => ORDER.map(s => (set.includes(s) ? 1 : 0)).join("");

(() => {
  // ------------------------------------------------ Part 1: BCD explorer
  const digit = document.querySelector("#digit");
  function show(n) {
    const active = MAP[n];
    document.querySelector("#bcd").textContent = Number(n).toString(2).padStart(4, "0");
    document.querySelector("#segments").textContent = toBits(active);
    document.querySelectorAll('[id^="seg-"]').forEach(el => el.classList.toggle("on", active.includes(el.id.slice(-1))));
  }
  digit.addEventListener("input", () => show(digit.value));
  show(digit.value);

  // -------------------------------------------- Part 3: design A through F
  let target = "A";
  const chosen = new Set();
  const solved = new Set();
  const feedback = document.querySelector("#feedback");

  function renderTargets() {
    const container = document.querySelector("#hex-targets");
    container.innerHTML = "";
    HEX_ORDER.forEach(key => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hex-target"
        + (key === target ? " active" : "")
        + (solved.has(key) ? " solved" : "");
      button.textContent = HEX[key].label;
      button.setAttribute("aria-label", `Target ${HEX[key].label}${solved.has(key) ? ", solved" : ""}`);
      button.addEventListener("click", () => {
        target = key;
        chosen.clear();
        document.querySelectorAll(".segment-toggle").forEach(b => b.classList.remove("on"));
        renderAll();
        feedback.className = "feedback";
        feedback.textContent = `Target is ${HEX[key].label}. Toggle segments until the preview reads correctly.`;
      });
      container.append(button);
    });
  }

  function renderPreview() {
    document.querySelectorAll('[id^="pv-"]').forEach(el => el.classList.toggle("on", chosen.has(el.id.slice(-1))));
    document.querySelector("#build-pattern").textContent = toBits([...chosen].join(""));
    document.querySelector("#preview-note").textContent =
      chosen.size === 0 ? "No segments lit." : `Segments ${norm([...chosen].join("")).split("").join(", ")} are lit.`;
  }

  function renderProgress() {
    document.querySelector("#hex-progress").value = solved.size;
    document.querySelector("#hex-progress-text").textContent = `${solved.size} of 6`;
  }

  function renderTable() {
    const rows = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(`<tr><td>${i}</td><td><code>${i.toString(2).padStart(4, "0")}</code></td>`
        + ORDER.map(s => `<td>${MAP[i].includes(s) ? 1 : 0}</td>`).join("") + "</tr>");
    }
    HEX_ORDER.forEach((key, index) => {
      const code = (10 + index).toString(2).padStart(4, "0");
      if (solved.has(key)) {
        rows.push(`<tr class="revealed"><td>${HEX[key].label}</td><td><code>${code}</code></td>`
          + ORDER.map(s => `<td>${HEX[key].segments.includes(s) ? 1 : 0}</td>`).join("") + "</tr>");
      } else {
        rows.push(`<tr><td>${HEX[key].label}</td><td><code>${code}</code></td>`
          + ORDER.map(() => '<td class="masked">&mdash;</td>').join("") + "</tr>");
      }
    });
    document.querySelector("#hex-body").innerHTML = rows.join("");
  }

  function renderAll() { renderTargets(); renderPreview(); renderProgress(); renderTable(); }

  document.querySelectorAll(".segment-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const s = button.dataset.segment;
      if (chosen.has(s)) chosen.delete(s); else chosen.add(s);
      button.classList.toggle("on", chosen.has(s));
      renderPreview();
    });
  });

  document.querySelector("#clear").addEventListener("click", () => {
    chosen.clear();
    document.querySelectorAll(".segment-toggle").forEach(b => b.classList.remove("on"));
    renderPreview();
  });

  document.querySelector("#check").addEventListener("click", () => {
    const want = HEX[target].segments;
    const got = norm([...chosen].join(""));
    if (got === norm(want)) {
      solved.add(target);
      renderAll();
      feedback.className = "feedback correct";
      if (solved.size === 6) {
        feedback.textContent = "All six hexadecimal digits designed. The decoder now covers every one of the sixteen four-bit codes. BCD and Hexadecimal Seven-Segment Displays is complete.";
        globalThis.SmartStartProgress?.complete("seven-segment");
      } else {
        const remaining = HEX_ORDER.filter(k => !solved.has(k)).map(k => HEX[k].label).join(", ");
        feedback.textContent = `Correct \u2014 ${HEX[target].label} is ${HEX[target].note}. Still to build: ${remaining}.`;
      }
      return;
    }
    const missing = norm(want).split("").filter(s => !chosen.has(s));
    const extra = norm([...chosen].join("")).split("").filter(s => !want.includes(s));
    const parts = [];
    if (missing.length) parts.push(`missing ${missing.join(", ")}`);
    if (extra.length) parts.push(`${extra.join(", ")} should be off`);
    feedback.className = "feedback incorrect";
    feedback.textContent = `Not yet for ${HEX[target].label}: ${parts.join("; ")}.`;
  });

  renderAll();
})();
