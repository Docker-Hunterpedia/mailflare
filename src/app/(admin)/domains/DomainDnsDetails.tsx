import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dnsAuthDescriptions, dnsAuthRecords, getDnsAuthItemClass, getDnsAuthStatusLabel } from "./utils";
import type { DomainDnsDetailsProps } from "./types";

export default function DomainDnsDetails({
	domain,
	dns,
	onSetup,
	setupRecord,
	setupMessage,
}: DomainDnsDetailsProps) {
	const audit = dns.audit;
	const manual = domain.zoneId === "manual";
	const subdomain = dns.sendingSubdomain;
	const sendingOk = subdomain ? dns.sendingEnabled : manual && domain.sendingEnabled;
	const sendingLabel = subdomain
		? `Sending for ${subdomain.name} is ${dns.sendingEnabled ? "enabled" : "disabled"}`
		: manual
			? domain.sendingEnabled
				? "Email sending is configured"
				: "Email sending is not configured"
			: "Sending has not configured for this domain";
	const routingOk = dns.routing.missing.length === 0 && (dns.routing.records.length > 0 || domain.routingEnabled);
	const routingLabel = routingOk
		? "Email routing is configured"
		: dns.routing.missing.length > 0
			? `${dns.routing.missing.length} DNS record${dns.routing.missing.length === 1 ? "" : "s"} missing`
			: "No routing DNS records found";
	return (
		<div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
			{audit && (
				<section>
					<h2 className="text-base font-semibold text-neutral-900">Domain setup</h2>
					<p className="mt-0.5 text-sm text-neutral-500">
						Review routing, sending, and DNS authentication for reliable email delivery.
					</p>
					<ul className="mt-3 space-y-2">
						<li
							className={`grid gap-3 rounded-xl px-4 py-3 text-sm sm:grid-cols-[auto_minmax(8rem,14rem)_minmax(0,1fr)_auto] sm:items-start ${routingOk ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
						>
							{routingOk ? (
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
									<Check className="h-4 w-4" />
								</span>
							) : (
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
									<AlertTriangle className="h-4 w-4 text-red-600" />
								</span>
							)}
							<span className="min-w-0">
								<span className="block font-medium text-neutral-900">Email Routing</span>
								<span className="block text-xs text-neutral-500">Routes incoming email to Mailflare</span>
							</span>
							<span className="min-w-0 break-all text-neutral-500">{routingLabel}</span>
						</li>

						<li
							className={`grid gap-3 rounded-xl px-4 py-3 text-sm sm:grid-cols-[auto_minmax(8rem,14rem)_minmax(0,1fr)_auto] sm:items-start ${sendingOk ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
						>
							{sendingOk ? (
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
									<Check className="h-4 w-4" />
								</span>
							) : (
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
									<AlertTriangle className="h-4 w-4 text-red-600" />
								</span>
							)}
							<span className="min-w-0">
								<span className="block font-medium text-neutral-900">Email Sending</span>
								<span className="block text-xs text-neutral-500">Sends outgoing email from this domain</span>
							</span>
							<span className="min-w-0 break-all text-neutral-500">{sendingLabel}</span>
						</li>

						{dnsAuthRecords.map((record) => {
							const item = audit[record];
							const ok = item.status === "ok";

							return (
								<li
									key={record}
									className={`grid gap-3 rounded-xl px-4 py-3 text-sm sm:grid-cols-[auto_minmax(8rem,14rem)_minmax(0,1fr)_auto] sm:items-start ${getDnsAuthItemClass(item.status)}`}
								>
									{ok ? (
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
											<Check className="h-4 w-4" />
										</span>
									) : (
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
											<AlertTriangle className={`h-4 w-4 ${item.status === "missing" ? "text-red-600" : "text-neutral-400"}`} />
										</span>
									)}
									<span className="min-w-0">
										<span className="block font-medium text-neutral-900">{item.label} record</span>
										<span className="block text-xs text-neutral-500">{dnsAuthDescriptions[record]}</span>
									</span>

									{ok ? <span className="min-w-0 break-all text-neutral-500">
										{item.found.length > 0 ? item.found.join(", ") : item.name}
									</span> : (
										<Button
											variant="outline"
											size="sm"
											className="shrink-0 bg-white"
											disabled={manual || setupRecord === record}
											title={
												manual
													? "DNS for this domain is managed manually"
													: `Create the ${item.label} record`
											}
											onClick={() => onSetup?.(record)}
										>
											{setupRecord === record ? "Setting up..." : "Setup"}
										</Button>
									)}
								</li>
							);
						})}
					</ul>
					{manual && (
						<p className="text-xs text-neutral-500">
							DNS is managed manually for this domain, so records must be created
							where the domain&apos;s nameservers are hosted.
						</p>
					)}
					{setupMessage && <p className="text-xs text-red-600">{setupMessage}</p>}
				</section>
			)}
		</div>
	);
}
