import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="card flex max-w-md flex-col items-center gap-5 p-10 text-center">
        <Image
          src="/zapster_raw/zapster_ghost.png"
          alt="Zapster"
          width={132}
          height={132}
          priority
        />
        <div>
          <h1 className="font-display text-5xl font-semibold">404</h1>
          <p className="mt-2 text-muted">
            Zapster looked everywhere — this page isn’t here.
          </p>
        </div>
        <Link href="/" className="btn-primary px-6 py-3 text-sm">
          Back to LitZap
        </Link>
      </div>
    </div>
  );
}
