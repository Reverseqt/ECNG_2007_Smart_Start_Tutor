"use strict";

(() => {
  const $ = selector => document.querySelector(selector);

  function wireSwitch(id, onToggle) {
    const node = $(id);
    let value = 0;
    node.addEventListener("click", () => {
      value = Number(!value);
      node.setAttribute("aria-checked", String(Boolean(value)));
      node.querySelector("span").textContent = String(value);
      onToggle(value);
    });
    return () => value;
  }

  // ---------------------------------------------------- Part 1: half adder
  const ha = { a: 0, b: 0 };
  function updateHalf() {
    const sum = ha.a ^ ha.b;
    const carry = ha.a & ha.b;
    $("#ha-wa").classList.toggle("active", Boolean(ha.a));
    $("#ha-wb").classList.toggle("active", Boolean(ha.b));
    $("#ha-ws").classList.toggle("active", Boolean(sum));
    $("#ha-wc").classList.toggle("active", Boolean(carry));
    document.querySelectorAll("#ha-table tbody tr").forEach(row => {
      row.classList.toggle("current", row.dataset.key === `${ha.a}${ha.b}`);
    });
    $("#ha-status").textContent =
      `${ha.a} + ${ha.b} = ${carry}${sum} in binary. Sum = ${sum}, carry = ${carry}.`;
  }
  const haA = wireSwitch("#ha-a", v => { ha.a = v; updateHalf(); });
  const haB = wireSwitch("#ha-b", v => { ha.b = v; updateHalf(); });
  updateHalf();

  // ---------------------------------------------------- Part 2: full adder
  const fa = { a: 0, b: 0, cin: 0 };
  function updateFull() {
    const s1 = fa.a ^ fa.b;          // sum out of half adder 1
    const c1 = fa.a & fa.b;          // carry out of half adder 1
    const sum = s1 ^ fa.cin;         // sum out of half adder 2
    const c2 = s1 & fa.cin;          // carry out of half adder 2
    const cout = c1 | c2;
    const total = fa.a + fa.b + fa.cin;

    $("#fa-wa").classList.toggle("active", Boolean(fa.a));
    $("#fa-wb").classList.toggle("active", Boolean(fa.b));
    $("#fa-wcin").classList.toggle("active", Boolean(fa.cin));
    $("#fa-s1").classList.toggle("active", Boolean(s1));
    $("#fa-c1").classList.toggle("active", Boolean(c1));
    $("#fa-c2").classList.toggle("active", Boolean(c2));
    $("#fa-ws").classList.toggle("active", Boolean(sum));
    $("#fa-wcout").classList.toggle("active", Boolean(cout));

    $("#fa-status").textContent =
      `${fa.a} + ${fa.b} + ${fa.cin} = ${total}, which is ${cout}${sum} in binary. Sum = ${sum}, carry out = ${cout}.`;
  }
  wireSwitch("#fa-a", v => { fa.a = v; updateFull(); });
  wireSwitch("#fa-b", v => { fa.b = v; updateFull(); });
  wireSwitch("#fa-cin", v => { fa.cin = v; updateFull(); });
  updateFull();

  const done = { table: false, quiz: false };
  function maybeComplete() {
    if (done.table && done.quiz) globalThis.SmartStartProgress?.complete("adders");
  }

  const faForm = $("#fa-form");
  const faSelects = [...faForm.querySelectorAll("select[data-answer]")];
  const faFeedback = $("#fa-feedback");

  faForm.addEventListener("submit", event => {
    event.preventDefault();
    let answered = 0, correct = 0;
    faSelects.forEach(select => {
      select.classList.remove("correct", "incorrect");
      if (select.value !== "") answered += 1;
      if (select.value === select.dataset.answer) { correct += 1; select.classList.add("correct"); }
      else if (select.value !== "") select.classList.add("incorrect");
    });
    if (answered < faSelects.length) {
      faFeedback.className = "feedback incorrect";
      faFeedback.textContent = `You have completed ${answered} of ${faSelects.length} cells. Fill in every cell before checking.`;
      return;
    }
    if (correct === faSelects.length) {
      done.table = true;
      faFeedback.className = "feedback correct";
      faFeedback.textContent = done.quiz
        ? "The table is correct. Half and Full Adders is complete."
        : "The table is correct. Answer the Part 4 questions to finish this activity.";
      maybeComplete();
    } else {
      faFeedback.className = "feedback incorrect";
      faFeedback.textContent = `${correct} of ${faSelects.length} cells are correct. Remember the carry out is the left digit of the two-bit total.`;
    }
  });

  $("#fa-clear").addEventListener("click", () => {
    faSelects.forEach(select => { select.value = ""; select.classList.remove("correct", "incorrect"); });
    faFeedback.className = "feedback";
    faFeedback.textContent = "Complete all sixteen cells, then check your work.";
  });

  // ---------------------------------------------------------- Part 3: quiz
  const checkForm = $("#check-form");
  const checkFeedback = $("#check-feedback");
  checkForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(checkForm);
    const q1 = data.get("q1"), q2 = data.get("q2");
    if (!q1 || !q2) {
      checkFeedback.className = "feedback incorrect";
      checkFeedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (q1 === "xor" && q2 === "carryin") {
      done.quiz = true;
      checkFeedback.className = "feedback correct";
      checkFeedback.textContent = done.table
        ? "Both correct. Half and Full Adders is complete."
        : "Both correct. Complete the Part 2 table to finish this activity.";
      maybeComplete();
      return;
    }
    checkFeedback.className = "feedback incorrect";
    if (q1 !== "xor" && q2 !== "carryin") checkFeedback.textContent = "Neither is right yet. Look again at the sum column of the Part 1 table and ask which gate matches it.";
    else if (q1 !== "xor") checkFeedback.textContent = "The second answer is right. For the first, the sum is 1 when the inputs differ.";
    else checkFeedback.textContent = "The first answer is right. For the second, count the inputs a half adder has.";
  });
})();
