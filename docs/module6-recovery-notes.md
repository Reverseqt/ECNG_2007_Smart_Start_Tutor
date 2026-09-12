# Module 6 recovery notes

## Recovered structure

The original Sequential Logic scene contains material on:

- sequential-system structure and state variables;
- the uncontrolled bistable;
- the NOR-gate SR latch and characteristic equation;
- the D latch and enabled latches;
- clock signals, active time, period and duty cycle;
- latches versus flip-flops;
- falling-edge master/slave D flip-flops;
- JK flip-flops and characteristic equations;
- serial and parallel registers;
- an enabled two-bit counter;
- Moore and Mealy state machines;
- state diagrams, transition tables and state tables;
- derivation of a state diagram from an enabled-counter logic circuit;
- a seven-state finite-string recogniser.

## Preserved equations and examples

- SR latch: `Q* = S + R′Q`
- D latch: enabled `Q*=D`; disabled `Q*=Q`
- Enabled counter: `D0 = Q0′EN + Q0EN′`
- Enabled counter: `D1 = Q1EN′ + Q1′Q0EN + Q1Q0′EN`
- Counter output: `MAX = Q1Q0EN`
- String recogniser: assert output for `010` unless `100` has previously occurred.

## Modernisation choices

- Rollover interactions were replaced with click/touch controls.
- Flash timeline animations were replaced with interactive state displays and SVG/CSS diagrams.
- The original falling-edge behaviour of the D flip-flop was retained.
- The original string-recogniser ActionScript behaviour was retained, including permanent lockout after `100` until reset.
