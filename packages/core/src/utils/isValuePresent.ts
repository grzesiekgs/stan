import { EmptyAtomValueSymbol, EmptyAtomValueSymbolType } from '../symbols';

export const isValuePresent = <Value>(
  value: Value
): value is Exclude<Value, EmptyAtomValueSymbolType> => value !== EmptyAtomValueSymbol;
