import { DerivedChainTest } from "./tests/DerivedChainTest";
import { MoutingTest } from "./tests/MountingTest";
import { ProxyTest } from "./tests/ProxyTest";
import { SmoothnessTest } from "./tests/SmoothnessTest";

export default function App() {
  
  return (
    <>
      <SmoothnessTest />
      <ProxyTest />
      <DerivedChainTest />
      <MoutingTest />
    </>
  );
}
