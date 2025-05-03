import { DerivedChainTest } from "./testing-scenarios/DerivedChainTest";
import { MoutingTest } from "./testing-scenarios/MountingTest";
import { ProxyTest } from "./testing-scenarios/ProxyTest";
import { SmoothnessTest } from "./testing-scenarios/SmoothnessTest";

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
