import FotoPdfMaker from '@/components/FotoPdfMaker';

export default function Home() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-foreground bg-primary py-2 px-4 rounded-lg inline-block shadow-md">
          FotoPDF Maker
        </h1>
        <p className="font-body text-muted-foreground mt-4 text-lg">
          A simple image to PDF converter app.
        </p>
      </header>
      <FotoPdfMaker />
    </main>
  );
}
