(function attachDecoderLogic(globalObject) {
  "use strict";

  function bit(value) {
    return Number(value) === 1 ? 1 : 0;
  }

  function decode2to4(enable, a1, a0) {
    const outputs = [0, 0, 0, 0];
    if (bit(enable)) outputs[(bit(a1) << 1) | bit(a0)] = 1;
    return outputs;
  }

  function decode3to8(enable, a2, a1, a0) {
    const outputs = Array(8).fill(0);
    if (bit(enable)) outputs[(bit(a2) << 2) | (bit(a1) << 1) | bit(a0)] = 1;
    return outputs;
  }

  const api = Object.freeze({ bit, decode2to4, decode3to8 });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  globalObject.SmartStartDecoderLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
