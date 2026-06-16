import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog — WorldChat" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium text-primary">Blog</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Ideas on network, listings & growth</h1>
        <p className="mt-4 text-lg text-slate-600">Practical reads to help you grow in real estate — and beyond.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`flex h-36 items-center justify-center bg-gradient-to-br ${post.gradient} text-4xl`}>📰</div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs text-slate-400">{formatDate(post.date)} · {post.readTime}</p>
              <h3 className="mt-2 font-semibold text-ink group-hover:text-primary">{post.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{post.excerpt}</p>
              <span className="mt-3 text-sm font-medium text-primary">Read more →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
