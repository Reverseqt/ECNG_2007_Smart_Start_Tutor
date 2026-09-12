"use strict";

// Representative input thresholds. vil is the highest voltage guaranteed to be
// read as LOW; vih is the lowest guaranteed to be read as HIGH. Anything
// between them is the undefined region. Values are typical of the family at its
// nominal supply and are illustrative, not a substitute for a data sheet.
const FAMILIES = [
  { id: "original", label: "Original tutor example (5 V)", vdd: 5, vil: 2.0, vih: 3.0,
    note: "The simplified example used by the original tutor: below 2 V is 0, above 3 V is 1." },
  { id: "ttl", label: "TTL, 5 V supply", vdd: 5, vil: 0.8, vih: 2.0,
    note: "Bipolar TTL. The thresholds sit low in the range, which is why a floating TTL input tends to drift HIGH." },
  { id: "cmos5", label: "CMOS (HC), 5 V supply", vdd: 5, vil: 1.5, vih: 3.5,
    note: "CMOS thresholds track the supply, roughly 30% and 70% of VDD, giving a wide undefined band and large noise margins." },
  { id: "lvcmos33", label: "LVCMOS, 3.3 V supply", vdd: 3.3, vil: 0.8, vih: 2.0,
    note: "A 3.3 V part using TTL-compatible thresholds, common where 3.3 V logic must talk to 5 V TTL." },
  { id: "lvcmos18", label: "LVCMOS, 1.8 V supply", vdd: 1.8, vil: 0.63, vih: 1.17,
    note: "A low-voltage family. The whole valid range is smaller, so the same absolute noise eats a far larger share of the margin." }
];

(() => {
  const familySelect = document.getElementById("family");
  const slider = document.getElementById("voltage");
  const valueNode = document.getElementById("voltage-value");
  const result = document.getElementById("logic-result");
  const marker = document.getElementById("voltage-marker");
  const track = document.getElementById("threshold-track");
  const familyNote = document.getElementById("family-note");
  const thresholdNote = document.getElementById("threshold-note");

  FAMILIES.forEach((f, i) => familySelect.add(new Option(f.label, String(i))));

  const current = () => FAMILIES[Number(familySelect.value)];

  function level(voltage, f) {
    if (voltage <= f.vil) return "low";
    if (voltage >= f.vih) return "high";
    return "undefined";
  }

  function applyFamily() {
    const f = current();
    slider.max = String(f.vdd);
    if (Number(slider.value) > f.vdd) slider.value = String(f.vdd);
    // Band widths are proportional to the supply so the track stays to scale.
    const fr = value => `${Number(value.toFixed(3))}fr`;
    track.style.gridTemplateColumns = `${fr(f.vil)} ${fr(f.vih - f.vil)} ${fr(f.vdd - f.vih)}`;
    document.getElementById("band-low").innerHTML = `LOW<br>0&ndash;${f.vil} V`;
    document.getElementById("band-undef").innerHTML = `Undefined<br>${f.vil}&ndash;${f.vih} V`;
    document.getElementById("band-high").innerHTML = `HIGH<br>${f.vih}&ndash;${f.vdd} V`;
    familyNote.textContent = f.note;
    thresholdNote.textContent = `Supply ${f.vdd} V. Read as 0 up to ${f.vil} V, as 1 from ${f.vih} V.`;
    update();
  }

  function update() {
    const f = current();
    const voltage = Number(slider.value);
    valueNode.textContent = `${voltage.toFixed(2).replace(/0$/, "").replace(/\.$/, "")} V`;
    marker.style.left = `${(voltage / f.vdd) * 100}%`;
    const state = level(voltage, f);
    if (state === "low") result.innerHTML = `At ${voltage} V this input reads <strong>LOW / logic 0</strong>.`;
    else if (state === "high") result.innerHTML = `At ${voltage} V this input reads <strong>HIGH / logic 1</strong>.`;
    else result.innerHTML = `At ${voltage} V this input is in the <strong>undefined region</strong>; it is not guaranteed to be read as either 0 or 1.`;
  }

  familySelect.addEventListener("change", applyFamily);
  slider.addEventListener("input", update);
  applyFamily();

  // --- Part 2 -----------------------------------------------------------
  const form = document.getElementById("check-form");
  const feedback = document.getElementById("check-feedback");
  const selects = [...form.querySelectorAll("select[data-answer]")];

  form.addEventListener("submit", event => {
    event.preventDefault();
    const q1 = new FormData(form).get("q1");
    let correct = q1 === "discrete" ? 1 : 0;
    let answered = q1 ? 1 : 0;
    selects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value !== "") answered += 1;
      if (select.value === select.dataset.answer) { correct += 1; select.classList.add("correct"); }
      else if (select.value !== "") select.classList.add("incorrect");
    });
    const total = selects.length + 1;
    if (answered < total) {
      feedback.className = "feedback incorrect";
      feedback.textContent = `You have answered ${answered} of ${total}. Complete every question before checking.`;
      return;
    }
    if (correct === total) {
      feedback.className = "feedback correct";
      feedback.textContent = "Correct. One voltage, three different readings \u2014 the threshold belongs to the family, not to the signal. Analogue and Digital Values is complete.";
      globalThis.SmartStartProgress?.complete("digital-values");
    } else {
      feedback.className = "feedback incorrect";
      feedback.textContent = `${correct} of ${total} correct. Set the slider to 1.5 V and switch families without moving it.`;
    }
  });

  document.getElementById("clear-check").addEventListener("click", () => {
    form.reset();
    selects.forEach(select => select.classList.remove("correct", "incorrect"));
    feedback.className = "feedback";
    feedback.textContent = "Answer every question, then check your work.";
  });
})();
