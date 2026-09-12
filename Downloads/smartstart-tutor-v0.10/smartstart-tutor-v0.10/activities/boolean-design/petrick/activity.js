"use strict";
(() => {
  const coverage = [
    {m:0,p:[1,3,6]}, {m:1,p:[1]}, {m:2,p:[3]}, {m:4,p:[6]}, {m:7,p:[5]}, {m:8,p:[1]},
    {m:9,p:[1,2]}, {m:11,p:[2]}, {m:13,p:[2]}, {m:14,p:[4]}, {m:15,p:[2,4,5]}
  ];
  document.getElementById("coverage-body").innerHTML = coverage.map(row => `<tr><th scope="row">m${row.m}</th>${[1,2,3,4,5,6].map(pi=>`<td class="${row.p.includes(pi)?(row.p.length===1?"forced":"covered"):""}">${row.p.includes(pi)?"●":""}</td>`).join("")}<td class="expression-cell">C${row.m} = ${row.p.map(pi=>`P${pi}`).join(" + ")}</td></tr>`).join("");
  document.querySelectorAll("[data-reveal]").forEach(button=>button.addEventListener("click",()=>{const target=document.getElementById(button.dataset.reveal);target.hidden=!target.hidden;button.textContent=target.hidden?"Reveal":"Hide";}));
  document.getElementById("petrick-check").addEventListener("submit",event=>{
    event.preventDefault();
    const correct=document.getElementById("forced-choice").value==="all" && document.getElementById("absorb-choice").value==="absorption" && document.getElementById("cost-choice").value==="16-6";
    const feedback=document.getElementById("petrick-feedback");
    if(correct){feedback.className="feedback correct";feedback.textContent="Correct. All six PIs are forced, absorption reduces the coverage product to P1P2P3P4P5P6, and the recorded implementation uses 16 literals across six product terms. Petrick’s Method is complete.";globalThis.SmartStartProgress?.complete("petrick-method");}
    else{feedback.className="feedback incorrect";feedback.textContent="Recheck the singleton coverage equations. C1, C2, C4, C7, C8, C11, C13 and C14 force the six PIs, after which absorption removes the larger sums.";}
  });
})();