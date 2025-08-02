
export default function Home() {
  // The middleware will redirect users to /login or /dashboard,
  // so this page will likely not be seen.
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <p>Cargando VIÑA INTEGRAL...</p>
    </main>
  );
}
