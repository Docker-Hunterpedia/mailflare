import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { domains } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getDomainForUser } from "@/lib/domains/service";
import { getDomainDnsView } from "@/lib/domains/dns-view";
import type { DnsAuthRecord } from "@/lib/domains/dns-audit";
import { setupDomainDnsRecord } from "@/lib/domains/dns-setup";

type Params = { params: Promise<{ id: string }> };

const DNS_RECORDS: DnsAuthRecord[] = ["mx", "spf", "dkim", "dmarc"];

export async function POST(request: Request, { params }: Params) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const domain = await getDomainForUser(env, user.id, id);
	if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });

	const body = (await request.json().catch(() => ({}))) as { record?: string };
	const record = body.record as DnsAuthRecord | undefined;
	if (!record || !DNS_RECORDS.includes(record)) {
		return NextResponse.json({ error: "Unknown DNS record" }, { status: 400 });
	}

	try {
		await setupDomainDnsRecord(env, domain, record);
		const dns = await getDomainDnsView(env, domain);
		const [updated] = await getDb(env)
			.select()
			.from(domains)
			.where(eq(domains.id, domain.id))
			.limit(1);
		return NextResponse.json({
			domain: { ...(updated ?? domain), sendingEnabled: dns.sendingEnabled },
			dns,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to set up DNS record";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
