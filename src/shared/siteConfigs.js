// ---------------------------------------------------------------------------
// Kompare site registry
//
// IMPORTANT — read before editing selectors:
// Retailer markup (class names, data-* attributes) changes without notice
// and this build has no live browser access to verify against production
// DOM at write time. Every entry below therefore lists several fallback
// selectors, and the scraper (see src/shared/scrapers.js) also falls back to
// Open Graph meta tags and a generic "₹ number near the title" text scan if
// every listed selector misses. Treat the selector arrays as a starting
// point to refine once you've tested against the live sites, not as a
// guaranteed-forever contract.
// ---------------------------------------------------------------------------

export const CATEGORY = {
  SHOPPING: "shopping",
  DELIVERY: "delivery",
};

export const SITES = {
  amazon: {
    key: "amazon",
    label: "Amazon",
    domain: "amazon.in",
    hostMatch: (host) => host.endsWith("amazon.in"),
    category: CATEGORY.SHOPPING,
    color: "#E47911",
    initial: "A",
    buildSearchUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
    productPattern: /\/(dp|gp\/product)\//,
    product: {
      title: ["#productTitle"],
      price: [
        "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
        "#corePrice_feature_div .a-price .a-offscreen",
        ".a-price .a-offscreen",
      ],
      image: ["#landingImage", "#imgTagWrapperId img"],
    },
    search: {
      resultItem: ['div[data-component-type="s-search-result"]'],
      title: ["h2 a span", "h2 span"],
      price: [".a-price .a-offscreen"],
      image: ["img.s-image"],
      link: ["h2 a"],
    },
  },

  flipkart: {
    key: "flipkart",
    label: "Flipkart",
    domain: "flipkart.com",
    hostMatch: (host) => host.endsWith("flipkart.com"),
    category: CATEGORY.SHOPPING,
    color: "#2874F0",
    initial: "F",
    buildSearchUrl: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
    productPattern: /\/p\//,
    product: {
      title: ["span.VU-ZEz", "span.B_NuCI", "h1 span"],
      price: ["div.Nx9bqj.CxhGGd", "div._30jeq3._16Jk6d", "div._30jeq3"],
      image: ["img._396cs4", "img.DByuf4"],
    },
    search: {
      resultItem: ["div[data-id]", "div._1AtVbE"],
      title: ["div._4rR01T", "a.s1Q9rs", "a.IRpwTa", "div.KzDlHZ"],
      price: ["div._30jeq3", "div.Nx9bqj"],
      image: ["img._396cs4", "img.DByuf4"],
      link: ["a._1fQZEK", "a.s1Q9rs", "a.CGtC98", "a"],
    },
  },

  myntra: {
    key: "myntra",
    label: "Myntra",
    domain: "myntra.com",
    hostMatch: (host) => host.endsWith("myntra.com"),
    category: CATEGORY.SHOPPING,
    color: "#FF3F6C",
    initial: "M",
    buildSearchUrl: (q) => `https://www.myntra.com/${encodeURIComponent(q)}`,
    productPattern: /\/\d+\/buy/,
    product: {
      title: ["h1.pdp-title", "h1.pdp-name", ".pdp-title"],
      price: ["span.pdp-price strong", ".pdp-price"],
      image: ["img.image-grid-image", "picture img"],
    },
    search: {
      resultItem: ["li.product-base"],
      title: ["h3.product-brand", "h4.product-product"],
      price: ["div.product-price span", "span.product-discountedPrice"],
      image: ["img.img-responsive", "picture img"],
      link: ["a"],
    },
  },

  meesho: {
    key: "meesho",
    label: "Meesho",
    domain: "meesho.com",
    hostMatch: (host) => host.endsWith("meesho.com"),
    category: CATEGORY.SHOPPING,
    color: "#F43397",
    initial: "Me",
    buildSearchUrl: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
    productPattern: /\/p\/[a-z0-9]+/i,
    product: {
      title: [],
      price: [],
      image: [],
    },
    search: {
      resultItem: ['a[class*="ProductCard"]', 'div[class*="ProductList"] a'],
      title: ['p[class*="Text"]'],
      price: ['h5[class*="Text"]', 'p[class*="Price"]'],
      image: ["img"],
      link: ["a"],
    },
  },

  blinkit: {
    key: "blinkit",
    label: "Blinkit",
    domain: "blinkit.com",
    hostMatch: (host) => host.endsWith("blinkit.com"),
    category: CATEGORY.DELIVERY,
    color: "#F8CB46",
    initial: "B",
    buildSearchUrl: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
    productPattern: /\/prn\//,
    product: { title: [], price: [], image: [] },
    search: {
      resultItem: ['div[id^="product-"]', 'div[data-test-id="plp-product"]'],
      title: ['div[class*="Name"]'],
      price: ['div[class*="Price"]'],
      image: ["img"],
      link: ["a"],
    },
    locationGated: true,
  },

  zepto: {
    key: "zepto",
    label: "Zepto",
    domain: "zeptonow.com",
    hostMatch: (host) => host.endsWith("zeptonow.com"),
    category: CATEGORY.DELIVERY,
    color: "#8B5CF6",
    initial: "Z",
    buildSearchUrl: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
    productPattern: /\/pn\//,
    product: { title: [], price: [], image: [] },
    search: {
      resultItem: ['a[href*="/pn/"]', 'div[data-testid="product-card"]'],
      title: ['h5', 'div[class*="name" i]'],
      price: ['h4', 'div[class*="price" i]'],
      image: ["img"],
      link: ["a"],
    },
    locationGated: true,
  },

  instamart: {
    key: "instamart",
    label: "Instamart",
    domain: "swiggy.com",
    hostMatch: (host) => host.endsWith("swiggy.com"),
    category: CATEGORY.DELIVERY,
    color: "#FC8019",
    initial: "I",
    buildSearchUrl: (q) =>
      `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
    productPattern: /\/instamart\//,
    product: { title: [], price: [], image: [] },
    search: {
      resultItem: ['div[data-testid="default_container_ux4"]', 'div[class*="ProductCard"]'],
      title: ['div[class*="novMV"]', 'div[class*="name" i]'],
      price: ['div[class*="price" i]'],
      image: ["img"],
      link: ["a"],
    },
    locationGated: true,
  },

  bigbasket: {
    key: "bigbasket",
    label: "BigBasket",
    domain: "bigbasket.com",
    hostMatch: (host) => host.endsWith("bigbasket.com"),
    category: CATEGORY.DELIVERY,
    color: "#84C225",
    initial: "BB",
    buildSearchUrl: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
    productPattern: /\/pd\//,
    product: { title: [], price: [], image: [] },
    search: {
      resultItem: ['div[qa="product"]', 'li[class*="Product"]'],
      title: ['div[class*="Description___StyledLabel"]', 'h3'],
      price: ['span[class*="Pricing___StyledLabel"]', 'span[class*="price" i]'],
      image: ["img"],
      link: ["a"],
    },
    locationGated: true,
  },
};

export const SITE_LIST = Object.values(SITES);

export function siteForHostname(hostname) {
  return SITE_LIST.find((s) => s.hostMatch(hostname)) || null;
}

export const HOST_PERMISSIONS = [
  "https://www.amazon.in/*",
  "https://amazon.in/*",
  "https://www.flipkart.com/*",
  "https://www.myntra.com/*",
  "https://www.meesho.com/*",
  "https://blinkit.com/*",
  "https://www.zeptonow.com/*",
  "https://www.swiggy.com/*",
  "https://www.bigbasket.com/*",
];
