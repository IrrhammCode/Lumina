"use client";

type StickyFooterProps = {
  children: React.ReactNode;
  secondary?: React.ReactNode;
};

export default function StickyFooter({ children, secondary }: StickyFooterProps) {
  return (
    <footer className="sticky-footer">
      <div className="content-wrap sticky-footer-inner">
        {children}
        {secondary && <div className="sticky-footer-secondary">{secondary}</div>}
      </div>
    </footer>
  );
}