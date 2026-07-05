"use client";

import PageEnter from "@/components/PageEnter";

type FlowPageBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export default function FlowPageBody({ children, className = "" }: FlowPageBodyProps) {
  return (
    <PageEnter className={className ? `flow-body ${className}` : "flow-body"}>
      {children}
    </PageEnter>
  );
}