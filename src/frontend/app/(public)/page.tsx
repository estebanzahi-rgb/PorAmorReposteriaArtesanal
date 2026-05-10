import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--brand-cream))]">
      <section className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
        <Image
          src="/logo.png"
          alt="PorAmor Repostería Artesanal"
          width={160}
          height={160}
          className="rounded-full object-cover shadow-lg"
          priority
        />
        <div className="space-y-2">
          <h1 className="text-5xl font-display font-bold text-brand-teal-dark">
            PorAmor
          </h1>
          <p className="text-lg font-serif italic text-brand-teal">
            Repostería Artesanal
          </p>
        </div>
        <p className="text-base text-muted-foreground max-w-sm">
          Tortas y postres hechos con amor, para los momentos que importan.
        </p>
        <Link
          href="/catalogo"
          className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Ver catálogo
        </Link>
      </section>
    </main>
  );
}
