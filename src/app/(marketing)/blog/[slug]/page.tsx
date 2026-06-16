import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPost } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post ? `${post.title} — WorldChat` : "Blog — WorldChat" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blog" className="text-sm text-slate-500 hover:text-primary">← Back to blog</Link>
      <div className={`mt-4 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br ${post.gradient} text-5xl`}>📰</div>
      <p className="mt-6 text-xs text-slate-400">{formatDate(post.date)} · {post.readTime} · {post.author}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{post.title}</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
        {post.body.map((p, i) => (<p key={i}>{p}</p>))}
      </div>
      <div className="mt-10 rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-ink">Put it into practice on WorldChat.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/register" className="btn-primary">Get started</Link>
          <Link href="/blog" className="btn-outline">More articles</Link>
        </div>
      </div>
    </article>
  );
}
