"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const WIDTH = 4;
  const a = Array(WIDTH).fill(0);
  const b = Array(WIDTH).fill(0);

  function buildBits(container, store) {
    container.innerHTML = "";
    for (let i = 0; i < WIDTH; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rip-bit";
      button.textContent = "0";
      button.setAttribute("aria-label", `bit ${WIDTH - 1 - i}`);
      button.addEventListener("click", () => { store[i] ^= 1; render(); });
      container.append(button);
    }
  }

  function addBits() {
    // index 0 is the most significant bit; carries[i] enters column i
    const carries = Array(WIDTH + 1).fill(0);
    const sums = Array(WIDTH).fill(0);
    for (let i = WIDTH - 1; i >= 0; i -= 1) {
      const total = a[i] + b[i] + carries[i + 1];
      sums[i] = total & 1;
      carries[i] = total >> 1;
    }
    return { sums, carries };
  }

  function render() {
    const { sums, carries } = addBits();
    const paint = (id, values) => {
      [...document.querySelectorAll(`${id} .rip-bit, ${id} .rip-cell`)].forEach((node, i) => {
        node.textContent = String(values[i]);
        node.classList.toggle("on", values[i] === 1);
      });
    };
    paint("#rip-a", a);
    paint("#rip-b", b);
    paint("#rip-s", sums);
    [...document.querySelectorAll("#rip-c .rip-cell")].forEach((node, i) => {
      const v = carries[i + 1];
      node.textContent = String(v);
      node.classList.toggle("on", v === 1);
    });

    const av = parseInt(a.join(""), 2);
    const bv = parseInt(b.join(""), 2);
    const sv = parseInt(sums.join(""), 2);
    const cout = carries[0];
    $("#rip-a-val").textContent = String(av);
    $("#rip-b-val").textContent = String(bv);
    $("#rip-s-val").textContent = String(sv);
    const rippled = carries.slice(1).filter(Boolean).length;
    $("#rip-status").textContent = cout
      ? `${av} + ${bv} = ${av + bv}, which needs five bits. The four sum bits show ${sv} and the carry out is 1: the answer overflowed.`
      : `${av} + ${bv} = ${sv}. The carry out is 0, so the answer fits. ${rippled === 0 ? "No column generated a carry." : `${rippled} column${rippled === 1 ? "" : "s"} passed a carry to the left.`}`;
    $("#rip-status").classList.toggle("mismatch", Boolean(cout));
  }

  function setValue(store, value) {
    value.toString(2).padStart(WIDTH, "0").split("").forEach((bit, i) => { store[i] = Number(bit); });
  }

  buildBits($("#rip-a"), a);
  buildBits($("#rip-b"), b);
  $("#rip-c").innerHTML = Array(WIDTH).fill('<span class="rip-cell">0</span>').join("");
  $("#rip-s").innerHTML = Array(WIDTH).fill('<span class="rip-cell">0</span>').join("");

  $("#rip-clear").addEventListener("click", () => { a.fill(0); b.fill(0); render(); });
  $("#rip-demo").addEventListener("click", () => {
    setValue(a, 7); setValue(b, 1); render();
    $("#rip-status").textContent += " Adding 1 to 0111 makes every column generate a carry in turn \u2014 this is the worst case a ripple-carry adder has to settle through.";
  });
  $("#rip-overflow").addEventListener("click", () => {
    setValue(a, 9); setValue(b, 8); render();
  });
  render();

  // ------------------------------------------------------------ Part 3
  const TARGET = 4;
  let streak = 0;
  let question = null;
  const feedback = $("#predict-feedback");

  function newQuestion() {
    const x = Math.floor(Math.random() * 16);
    const y = Math.floor(Math.random() * 16);
    const total = x + y;
    question = { x, y, sum: (total & 15).toString(2).padStart(4, "0"), carry: total > 15 ? "1" : "0" };
    $("#predict-prompt").innerHTML = `A = <strong>${x.toString(2).padStart(4, "0")}</strong> (${x}) and `
      + `B = <strong>${y.toString(2).padStart(4, "0")}</strong> (${y}). What are the sum bits and the carry out?`;
    $("#predict-sum").value = "";
    $("#predict-carry").value = "";
  }

  $("#predict-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!question) return;
    const sum = $("#predict-sum").value.trim();
    const carry = $("#predict-carry").value;
    if (!/^[01]{4}$/.test(sum) || carry === "") {
      feedback.className = "feedback incorrect";
      feedback.textContent = "Give four binary digits for the sum and choose a carry out.";
      return;
    }
    if (sum === question.sum && carry === question.carry) {
      streak += 1;
      if (streak >= TARGET) {
        feedback.className = "feedback correct";
        feedback.textContent = `Correct \u2014 ${TARGET} in a row. Four-Bit Ripple-Carry Addition is complete.`;
        globalThis.SmartStartProgress?.complete("ripple-adder");
        question = null;
        $("#predict-prompt").textContent = "All four correct. Use Start again for more practice.";
        return;
      }
      feedback.className = "feedback correct";
      feedback.textContent = `Correct. Streak: ${streak} of ${TARGET}.`;
    } else {
      streak = 0;
      feedback.className = "feedback incorrect";
      feedback.textContent = `Not quite \u2014 ${question.x} + ${question.y} = ${question.x + question.y}, so the sum bits are ${question.sum} and the carry out is ${question.carry}. Streak reset.`;
    }
    newQuestion();
  });

  $("#predict-restart").addEventListener("click", () => {
    streak = 0;
    feedback.className = "feedback";
    feedback.textContent = `Streak: 0 of ${TARGET}.`;
    newQuestion();
  });

  newQuestion();
  feedback.textContent = `Streak: 0 of ${TARGET}.`;
})();
