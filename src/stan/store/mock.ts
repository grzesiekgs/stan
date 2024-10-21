// const recalculateAtomDerivers = (atom: StatefulAtom<any>) => {
//   const atomState = getAtomStateFromStateMap(atom, atomToStateMap);
//   const derivers = atomState.derivers;
//   console.log('>>> UPDATE', atom.label);
//   if (!derivers?.size) {
//     console.log('>>> SKIP UPDATE', atom.label);
//     return;
//   }

//   derivers.forEach((deriverAtom) => {
//     const deriverAtomState = getAtomStateFromStateMap(deriverAtom, atomToStateMap);
//     // Don't update deriver atom if it's not observed by anything. It will recaluclate when observation will start.
//     if (!deriverAtomState.isObserved || deriverAtomState.isFresh) {
//       console.log(
//         '>>> SKIP DERIVER',
//         atom.label,
//         deriverAtom.label,
//         deriverAtomState.isFresh,
//         deriverAtomState.value
//       );
//       return;
//     }
//     derivers.delete(deriverAtom);
//     console.log('>>> UPDATE DERIVER', atom.label, deriverAtom.label);
//     // Create getter which will mark current atom as deriver of it's dependencies.
//     const value = get(deriverAtom);

//     return updateAtomValue(deriverAtom, value);
//   });
//   console.log('>>> DONE UPDATE', atom.label);
//   // Clear derivers list after all derivers update.
// };
