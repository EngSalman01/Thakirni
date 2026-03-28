import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/privacy", "/terms", "/pricing", "/help"],
      disallow: ["/vault", "/auth", "/api/", "/join-team", "/maintenance", "/checkout", "/admin"],
    },
    sitemap: "https://thakirni.com/sitemap.xml",
  }
}
