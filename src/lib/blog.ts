export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  gradient: string;
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "build-your-real-estate-network",
    title: "How to build a real estate network that actually closes deals",
    excerpt: "Your network is your net worth in real estate. Here's how to grow connections that turn into listings and leads.",
    date: "2026-06-10",
    author: "WorldChat Team",
    readTime: "5 min read",
    gradient: "from-blue-500 to-indigo-500",
    body: [
      "In real estate, relationships compound. The agents and investors who win are the ones with a living network — people they can call, message, and trade opportunities with.",
      "WorldChat makes this effortless. Share your invite code, accept connection requests, and create groups around the deals and areas you care about. Every conversation stays in one place, so context is never lost.",
      "Start small: connect with five people this week, join a group, and post one property. Momentum builds faster than you think.",
    ],
  },
  {
    slug: "ats-and-loi-explained",
    title: "ATS and LOI, explained: building trust between serious buyers and sellers",
    excerpt: "Authority to Sell and Letter of Intent are the backbone of serious deals. Here's how WorldChat makes the exchange simple.",
    date: "2026-06-06",
    author: "WorldChat Team",
    readTime: "4 min read",
    gradient: "from-emerald-500 to-teal-500",
    body: [
      "Serious sellers prove authority with an Authority to Sell (ATS). Serious buyers signal intent with a Letter of Intent (LOI). Exchanging these documents is how trust is established.",
      "On WorldChat, a buyer requests the ATS and attaches their LOI. The owner reviews it and approves in one tap — the ATS becomes viewable to that buyer, and the whole exchange is tracked per property.",
      "No more lost email threads. Just a clean, trusted handshake that moves deals forward.",
    ],
  },
  {
    slug: "ai-on-request",
    title: "AI on request: insights when you need them, noise when you don't",
    excerpt: "Property insights, teasers, and market activity — generated on demand, so AI helps instead of overwhelming.",
    date: "2026-06-01",
    author: "WorldChat Team",
    readTime: "3 min read",
    gradient: "from-violet-500 to-purple-500",
    body: [
      "AI is most useful when it answers a question you actually have. That's why WorldChat keeps AI on request.",
      "Generate property insights to understand a listing, spin up a polished teaser to share, or check market-related activity to time your move — all when you choose to.",
      "It's a tool in your pocket, not a firehose in your feed.",
    ],
  },
];

export const getPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);
