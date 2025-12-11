import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { FC } from 'react';
import { RouteLink } from '../types/RouteLink';
import { StoreProvider } from '@stan/react'

const routes: RouteLink[] = [
  {
    to: '/',
    label: 'Home',
  },
  {
    to: '/tests',
    label: 'Tests',
  },
];

const RootLayout: FC = () => (
  <>
    <div>
      {routes.map((route) => (
        <Link to={route.to} key={route.to}>
          {route.label}
        </Link>
      ))}
    </div>
    <hr />
    <StoreProvider>
      <Outlet />
    </StoreProvider>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
