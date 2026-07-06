import { Atom } from "../types";

const testMutable1: Atom<'mutable', number> = {
  type: 'mutable',
  storeLabel: 'mutable1',
  read: () => 0,
  write: (a, v) => v,
};

const testMutable2: Atom<'mutable', number, string> = {
  type: 'mutable',
  storeLabel: 'mutable2',
  read: () => 0,
  write: (a, v) => Number(v),
};

const testDerived1: Atom<'derived', number> = {
  type: 'derived',
  storeLabel: 'derived1',
  read: () => 0,
};

const testDerived2: Atom<'derived', number, string> = {
  type: 'derived',
  storeLabel: 'derived2',
  read: () => 0,
  write: (a, v) => v,
};

const testDerived3: Atom<'derived', number, string, boolean> = {
  type: 'derived',
  storeLabel: 'derived3',
  read: () => 0,
  write: (a, v) => Boolean(v),
};

const testCallback1: Atom<'callback', string> = {
  type: 'callback',
  write: (a, v) => v,
};

const testCallback2: Atom<'callback', string, number> = {
  type: 'callback',
  write: (a, v) => Number(v),
};
