import { createFileRoute, Link } from '@tanstack/react-router';
import { FC } from 'react';
import { RouteLink } from 'src/types/RouteLink';


const testsLinks: RouteLink[] = [
  {
    to: '/tests/proxy',
    label: 'Proxy',
  },
  {
    to: '/tests/mounting',
    label: 'Mounting',
  },
  {
    to: '/tests/derived-chain',
    label: 'Derived Chain',
  },
  {
    to: '/tests/cyclic-dependency',
    label: 'Cyclic Dependency',
  },
];

const TestsPage: FC = () => {
  return (
    <div>
      <h3>Select test</h3>
      <div>
        {testsLinks.map((link) => (
          <Link to={link.to} key={link.to}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/tests/')({
  component: TestsPage,
});
