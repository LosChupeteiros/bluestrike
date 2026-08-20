export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="bs-route-enter">{children}</div>;
}
