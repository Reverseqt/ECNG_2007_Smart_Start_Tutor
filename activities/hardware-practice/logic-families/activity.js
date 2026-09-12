"use strict";
const comparisons={noise:['0.3 V (HIGH), 0.5 V (LOW)','Approximately 0.3·VCC'], 'input-current':['Relatively high: about 0.2–2 mA LOW and 20–50 µA HIGH in the original summary','Typically less than 1 µA in both states'],power:['Relatively high and fairly fixed; original examples: 2 mW for 74LS, 20 mW for 74S','Depends strongly on VCC and switching frequency; negligible ideal static dissipation'], 'output-current':['Asymmetric: smaller HIGH-state source current and larger LOW-state sink current','More symmetric; original summary noted about 4 mA, with some families much higher'],supply:['5 V ±10% in the original TTL summary','Wide range for 4000 series; narrower ranges for newer high-speed families'],interconnection:['Standard TTL may need a pull-up or TTL-compatible CMOS such as HCT to drive standard CMOS HIGH','5 V CMOS output levels can directly satisfy representative TTL thresholds']};
const comparison=document.querySelector('#comparison');function compare(){const x=comparisons[comparison.value];document.querySelector('#ttl-comparison').textContent=x[0];document.querySelector('#cmos-comparison').textContent=x[1];}comparison.addEventListener('change',compare);compare();
const levels={ttl:{name:'TTL',voh:2.7,vol:.5,vih:2,vil:.8},cmos:{name:'CMOS',voh:4.9,vol:.1,vih:3.5,vil:1.5}};const driver=document.querySelector('#driver'),receiver=document.querySelector('#receiver');function inter(){const d=levels[driver.value],r=levels[receiver.value],h=d.voh-r.vih,l=r.vil-d.vol,ok=h>=0&&l>=0;document.querySelector('#high-margin').textContent=h.toFixed(1)+' V';document.querySelector('#low-margin').textContent=l.toFixed(1)+' V';document.querySelector('#interface-result').textContent=ok?'OK':'HIGH-level problem';const note=document.querySelector('#interface-note');note.className='feedback '+(ok?'correct':'incorrect');note.textContent=ok?`${d.name} can satisfy the representative ${r.name} thresholds in both states.`:`${d.name} V₍OH(min)₎ is below ${r.name} V₍IH(min)₎. The original tutor suggested a pull-up or a TTL-compatible CMOS family such as HCT.`;}[driver,receiver].forEach(x=>x.addEventListener('change',inter));inter();
document.querySelector('#check-answer').addEventListener('click',()=>{const ok=document.querySelector('input[name=check]:checked')?.value==='b',f=document.querySelector('#feedback');f.className='feedback '+(ok?'correct':'incorrect');f.textContent=ok?'Correct. The representative TTL HIGH guarantee of 2.7 V is below the representative CMOS HIGH-input requirement of 3.5 V.':'Not correct. Compare V₍OH(min)₎ of the driver with V₍IH(min)₎ of the receiver.';if(ok)SmartStartProgress.complete('hw-logic-families');});
// Fanout, moved here from the former Voltage, Current and Noise Margins activity.
(() => {
  const val = id => Math.abs(Number(document.querySelector("#" + id).value));
  function fanout() {
    const hi = val("ioh") / val("iih");
    const lo = val("iol") / val("iil");
    const n = Math.floor(Math.min(hi, lo));
    document.querySelector("#fanout").textContent = Number.isFinite(n) ? `${n} loads` : "\u2014";
    document.querySelector("#fanout-detail").textContent = Number.isFinite(n)
      ? `HIGH-state ratio ${hi.toFixed(1)}; LOW-state ratio ${lo.toFixed(1)}. The smaller value limits fanout.`
      : "Enter positive non-zero current magnitudes.";
  }
  ["ioh", "iih", "iol", "iil"].forEach(id => document.querySelector("#" + id).addEventListener("input", fanout));
  fanout();
})();
