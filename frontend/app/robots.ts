import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/privacy", "/terms"],
      disallow: ["/vault", "/auth", "/api/"],
    },
    sitemap: "https://thakirni.com/sitemap.xml",
  }
}
