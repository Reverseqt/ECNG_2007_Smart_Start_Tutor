"use strict";

const FAMILY_LIMITS = {
  ttl: { name: "TTL", vil: 0.8, vih: 2.0, vol: 0.5, voh: 2.7 },
  cmos: { name: "CMOS", vil: 1.5, vih: 3.5, vol: 0.1, voh: 4.9 }
};

(() => {
  const $ = selector => document.querySelector(selector);
  const tech = $("#technology"), voltage = $("#voltage");

  function classify() {
    const f = FAMILY_LIMITS[tech.value];
    const v = Number(voltage.value);
    $("#voltage-value").textContent = v.toFixed(1) + " V";
    $("#voltage-marker").style.left = (v / 5 * 100) + "%";
    $("#classification").textContent = v <= f.vil ? "LOW" : (v >= f.vih ? "HIGH" : "INVALID / UNDEFINED");
    $("#thresholds").textContent = `Guaranteed LOW \u2264 ${f.vil.toFixed(1)} V; guaranteed HIGH \u2265 ${f.vih.toFixed(1)} V.`;
  }

  const source = $("#source-family"), dest = $("#destination-family");
  function compatibility() {
    const s = FAMILY_LIMITS[source.value], d = FAMILY_LIMITS[dest.value];
    const nmh = s.voh - d.vih;
    const nml = d.vil - s.vol;
    const ok = nmh >= 0 && nml >= 0;
    $("#nmh").textContent = nmh.toFixed(1) + " V";
    $("#nml").textContent = nml.toFixed(1) + " V";
    $("#compatibility").textContent = ok ? "Compatible" : "Problem";
    const note = $("#compatibility-note");
    note.className = "feedback " + (ok ? "correct" : "incorrect");
    note.textContent = ok
      ? `${s.name} guaranteed outputs satisfy ${d.name} input thresholds.`
      : `The guaranteed HIGH margin is ${nmh.toFixed(1)} V. A level translator, pull-up arrangement or compatible subfamily may be needed.`;
  }

  [tech, voltage].forEach(el => el.addEventListener("input", classify));
  [source, dest].forEach(el => el.addEventListener("change", compatibility));
  classify();
  compatibility();

  $("#check-answer").addEventListener("click", () => {
    const ok = document.querySelector("input[name=check]:checked")?.value === "b";
    const f = $("#feedback");
    f.className = "feedback " + (ok ? "correct" : "incorrect");
    f.textContent = ok
      ? "Correct. A negative margin means the guaranteed driver level falls inside or beyond the receiver's undefined region, so the connection is not reliable. Logic Levels and Noise Margins is complete."
      : "Not correct. Noise margin compares guaranteed output levels with guaranteed input thresholds.";
    if (ok) globalThis.SmartStartProgress?.complete("logic-levels");
  });
})();
