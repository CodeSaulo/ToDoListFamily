import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-sm px-4 py-20 text-center">
      <p className="text-5xl">🤔</p>
      <h1 className="mt-3 text-xl font-extrabold">No encontramos esa página</h1>
      <Link href="/" className="btn-primary mt-4">Ir al inicio</Link>
    </main>
  );
}
