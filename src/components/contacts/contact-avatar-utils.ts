import { getEmailAddress } from "@/lib/email/address";

export function getManagedContactAvatarUrl(mailboxId: string, address: string, version = 0): string {
	const params = new URLSearchParams({ mailboxId, address: getEmailAddress(address) });
	if (version) params.set("v", String(version));
	return `/api/contacts/avatar?${params.toString()}`;
}

export async function getGravatarAvatarUrl(address: string): Promise<string> {
	const email = getEmailAddress(address).trim().toLowerCase();
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
	const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `https://gravatar.com/avatar/${hash}?d=404&r=g&s=96`;
}

export function getContactAvatarInitial(name: string, address: string): string {
	return (name.trim() || getEmailAddress(address)).slice(0, 1).toUpperCase();
}
