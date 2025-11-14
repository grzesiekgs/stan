import { AtomState, AtomToStateMap, ReadableAtom, DependentAtom } from '../types';
export declare const createNewAtomState: <Value>(atom: ReadableAtom<Value>) => AtomState<Value>;
export declare const getAtomStateFromStateMap: <Value>(atom: ReadableAtom<Value>, atomToStateMap: AtomToStateMap) => AtomState<Value>;
export declare const addAtomDependent: (atomState: AtomState<any>, dependentAtom: DependentAtom<any>) => void;
export declare const removeAtomDependent: (atomState: AtomState<any>, dependentAtom: DependentAtom<any>) => void;
export declare const addAtomDependency: (atomState: AtomState<any>, dependencyAtom: ReadableAtom<any>) => void;
export declare const removeAtomDependency: (atomState: AtomState<any>, dependencyAtom: ReadableAtom<any>) => void;
