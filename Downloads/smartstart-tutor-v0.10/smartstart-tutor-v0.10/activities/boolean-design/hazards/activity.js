"use strict";
(() => {
  const steps = 12;
  let rising = true;
  let delay = 2;
  let consensus = false;
  const inputToggle = document.getElementById("input-toggle");
  const delayRange = document.getElementById("delay-range");
  const delayValue = document.getElementById("delay-value");

  function waveRow(label, values, glitchIndexes = new Set()) {
    return `<div class="wave-label">${label}</div>${values.map((value,index)=>`<div class="wave-cell ${value ? "high" : "low"} ${glitchIndexes.has(index) ? "glitch" : ""}" title="${label}: ${value}"></div>`).join("")}`;
  }
  function timeRow() { return `<div class="wave-label">time</div>${Array.from({length:steps},(_,i)=>`<div class="wave-time">${i}</div>`).join("")}`; }
  function transitionArray(before, after, transitionAt=5) { return Array.from({length:steps},(_,i)=>i<transitionAt?before:after); }
  function delayedComplement(a, delaySteps) {
    const ideal = a.map(v=>Number(!v));
    const transitionAt = a.findIndex((v,i)=>i>0 && v!==a[i-1]);
    if (transitionAt < 0) return ideal;
    const before = ideal[transitionAt-1];
    return ideal.map((value,i)=>i<transitionAt+delaySteps ? (i<transitionAt ? value : before) : value);
  }
  function renderBasic() {
    const a = rising ? transitionArray(0,1) : transitionArray(1,0);
    const notA = delayedComplement(a, delay);
    const andOut = a.map((v,i)=>v & notA[i]);
    const orOut = a.map((v,i)=>v | notA[i]);
    const andGlitches = new Set(andOut.map((v,i)=>v===1?i:-1).filter(i=>i>=0));
    const orGlitches = new Set(orOut.map((v,i)=>v===0?i:-1).filter(i=>i>=0));
    document.getElementById("basic-wave").innerHTML = timeRow()+waveRow("A",a)+waveRow("delayed A′",notA)+waveRow("A · A′",andOut,andGlitches)+waveRow("A + A′",orOut,orGlitches);
    inputToggle.textContent = rising ? "0 → 1" : "1 → 0";
    inputToggle.classList.toggle("on", rising);
    inputToggle.setAttribute("aria-pressed", String(rising));
  }
  inputToggle.addEventListener("click",()=>{rising=!rising;renderBasic();});
  delayRange.addEventListener("input",()=>{delay=Number(delayRange.value);delayValue.textContent=String(delay);renderBasic();renderConsensus();});

  function renderConsensus() {
    // Use the 1→0 transition: AC falls immediately while A′B rises only after the inverter delay.
    const a = transitionArray(1,0);
    const notA = delayedComplement(a,delay);
    const b = Array(steps).fill(1), c = Array(steps).fill(1);
    const term1 = notA.map((v,i)=>v & b[i]);
    const term2 = a.map((v,i)=>v & c[i]);
    const bc = Array(steps).fill(1);
    const fHazard = term1.map((v,i)=>v | term2[i]);
    const fOut = fHazard.map((v,i)=>v | (consensus ? bc[i] : 0));
    const glitches = new Set(fOut.map((v,i)=>v===0?i:-1).filter(i=>i>=0));
    document.getElementById("consensus-wave").innerHTML = timeRow()+waveRow("A′B",term1)+waveRow("AC",term2)+waveRow("BC",consensus?bc:Array(steps).fill(0))+waveRow("F",fOut,glitches);
    document.getElementById("hazard-expression").textContent = consensus ? "F = A′B + AC + BC" : "F = A′B + AC";
    const status = document.getElementById("hazard-status"), text=document.getElementById("hazard-status-text");
    status.className=`status-marker ${consensus?"safe":"hazard"}`; status.textContent=consensus?"Hazard removed":"Hazard present"; text.textContent=consensus?"The output remains at 1 throughout the transition.":"The output may dip to 0.";
    const toggle=document.getElementById("consensus-toggle"); toggle.textContent=consensus?"On":"Off"; toggle.classList.toggle("on",consensus); toggle.setAttribute("aria-pressed",String(consensus));
  }
  document.getElementById("consensus-toggle").addEventListener("click",()=>{consensus=!consensus;renderConsensus();});
  renderBasic(); renderConsensus();

  document.getElementById("hazard-check").addEventListener("submit",event=>{
    event.preventDefault();
    const correct=document.getElementById("andor-choice").value==="static1" && document.getElementById("orand-choice").value==="static0" && document.getElementById("fix-choice").value==="bridge";
    const feedback=document.getElementById("hazard-feedback");
    if(correct){feedback.className="feedback correct";feedback.textContent="Correct. SOP AND/OR circuits can exhibit static-1 hazards, POS OR/AND circuits can exhibit static-0 hazards, and a consensus term bridges the adjacent states. Logic Hazards is complete.";globalThis.SmartStartProgress?.complete("logic-hazards");}
    else{feedback.className="feedback incorrect";feedback.textContent="Recheck the steady output that may glitch: AND/OR SOP should remain 1, while OR/AND POS should remain 0. The added term must not depend on the changing variable.";}
  });
})();