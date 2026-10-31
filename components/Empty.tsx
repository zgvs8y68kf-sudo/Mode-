import Link from "next/link";

export default function Empty({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <h2 className="text-2xl">{title}</h2>
      <p className="max-w-md text-sm text-muted">{text}</p>
      <Link href={href} className="btn mt-2">{cta}</Link>
    </div>
  );
}
