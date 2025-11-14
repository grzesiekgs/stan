import { StoreProvider } from '../../../packages/react/src/context';
import { CyclicDependencyTest } from './testing-scenarios/CyclicDependency';
// import { DerivedChainTest } from './testing-scenarios/DerivedChainTest';
// import { MoutingTest } from './testing-scenarios/MountingTest';
// import { ProxyTest } from './testing-scenarios/ProxyTest';
// import { SmoothnessTest } from './testing-scenarios/SmoothnessTest';

export default function App() {
  return (
    <StoreProvider>
      {/* <SmoothnessTest />
      <ProxyTest />
      <DerivedChainTest />
      <MoutingTest /> */}
      <CyclicDependencyTest />
    </StoreProvider>
  );
}
