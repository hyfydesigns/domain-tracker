import { NextRequest, NextResponse } from "next/server";

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapEntity {
  roles: string[];
  vcardArray?: unknown[];
  entities?: RdapEntity[];
}

interface RdapResponse {
  ldhName?: string;
  events?: RdapEvent[];
  entities?: RdapEntity[];
  port43?: string;
}

function extractRegistrarName(entities: RdapEntity[]): string {
  const registrar = entities.find((e) => e.roles?.includes("registrar"));
  if (!registrar) return "";

  // vCard name is at vcardArray[1][n][3] where type is "fn"
  const vcard = registrar.vcardArray as [string, [string, unknown, string, string][]] | undefined;
  if (vcard?.[1]) {
    const fn = vcard[1].find((entry) => entry[0] === "fn");
    if (fn?.[3]) return String(fn[3]);
  }

  // Try nested entities (some registries nest the registrar name)
  if (registrar.entities) {
    return extractRegistrarName(registrar.entities);
  }

  return "";
}

function normalizeRegistrar(raw: string): string {
  if (!raw) return "Other";
  const known: Record<string, string> = {
    namecheap: "Namecheap",
    godaddy: "GoDaddy",
    cloudflare: "Cloudflare",
    "google domains": "Google Domains",
    "name.com": "Name.com",
    porkbun: "Porkbun",
    dynadot: "Dynadot",
    hover: "Hover",
    "network solutions": "Network Solutions",
    enom: "Enom",
  };
  const lower = raw.toLowerCase();
  for (const [key, label] of Object.entries(known)) {
    if (lower.includes(key)) return label;
  }
  // Return the raw name truncated if it looks reasonable
  return raw.length > 40 ? raw.slice(0, 40) : raw;
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) return NextResponse.json({ error: "Missing domain" }, { status: 400 });

  // Strip protocol/www if user pasted a URL
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

  try {
    const res = await fetch(`https://rdap.org/domain/${clean}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Domain not found or not yet registered" }, { status: 404 });
    }

    const data: RdapResponse = await res.json();

    const registration = data.events?.find((e) => e.eventAction === "registration");
    const expiration = data.events?.find((e) => e.eventAction === "expiration");

    const registrarRaw = data.entities ? extractRegistrarName(data.entities) : "";
    const registrar = normalizeRegistrar(registrarRaw);

    return NextResponse.json({
      name: clean,
      registrar,
      purchaseDate: registration?.eventDate?.split("T")[0] ?? "",
      expiryDate: expiration?.eventDate?.split("T")[0] ?? "",
    });
  } catch (err) {
    const message = err instanceof Error && err.name === "TimeoutError"
      ? "Lookup timed out — enter details manually"
      : "Lookup failed — enter details manually";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
