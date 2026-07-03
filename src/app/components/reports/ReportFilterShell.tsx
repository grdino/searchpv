export default function ReportFilterShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="no-print" style={filterBoxStyle}>
      {children}
    </section>
  );
}

const filterBoxStyle = {
  display: "block",
  padding: "20px 24px 24px",
  border: "1px solid #dde8e2",
  borderRadius: "18px",
  background: "#f7faf8",
  marginBottom: "18px",
} as const;