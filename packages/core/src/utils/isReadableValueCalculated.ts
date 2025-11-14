import { EmptyAtomValueSymbol, EmptyAtomValueSymbolType } from "../symbols";

export const isReadableValueCalculated = <Value>(value: Value): value is Exclude<Value, EmptyAtomValueSymbolType> =>  value !== EmptyAtomValueSymbol;