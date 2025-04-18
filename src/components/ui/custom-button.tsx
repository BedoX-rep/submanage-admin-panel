
import { Button as ShadcnButton } from "@/components/ui/button";
import React from "react";

export const Button = ({ children, ...props }: React.ComponentProps<typeof ShadcnButton>) => {
  return <ShadcnButton {...props}>{children}</ShadcnButton>;
};
