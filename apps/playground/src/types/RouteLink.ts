import { LinkProps } from "@tanstack/react-router";

export type RouteLink = {
  to: LinkProps['to'];
  label: string;
};