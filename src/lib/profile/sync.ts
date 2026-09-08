import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { contacts, mailboxes, users } from "@/db/schema";
import { getContactId } from "@/lib/contacts/utils";
import { getMailboxDomainAddresses } from "@/lib/mailboxes/domain-addresses";
import type { PersonalIdentity } from "./sync-types";

export async function syncPersonalIdentity(
	db: AppDatabase,
	identity: PersonalIdentity,
): Promise<void> {
	await db
		.update(users)
		.set({ name: identity.name, avatarKey: identity.avatarKey })
		.where(eq(users.id, identity.userId));

	await db
		.update(mailboxes)
		.set({ displayName: identity.name, avatarKey: identity.avatarKey })
		.where(and(eq(mailboxes.userId, identity.userId), eq(mailboxes.type, "personal")));

	const personalMailboxes = await db
		.select()
		.from(mailboxes)
		.where(and(eq(mailboxes.userId, identity.userId), eq(mailboxes.type, "personal")));
	const addresses = new Set(
		(await Promise.all(
			personalMailboxes.map((mailbox) => getMailboxDomainAddresses(db, mailbox)),
		)).flat(),
	);

	for (const email of addresses) {
		await db
			.insert(contacts)
			.values({
				id: getContactId(identity.userId, email),
				userId: identity.userId,
				email,
				displayName: identity.name,
				avatarKey: identity.avatarKey,
				source: "manual",
			})
			.onConflictDoUpdate({
				target: [contacts.userId, contacts.email],
				set: {
					displayName: identity.name,
					avatarKey: identity.avatarKey,
					source: "manual",
				},
			});
	}
}

export async function getPersonalIdentityForAddress(
	db: AppDatabase,
	userId: string,
	email: string,
) {
	const [account] = await db
		.select({ userId: users.id, name: users.name, avatarKey: users.avatarKey })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!account) return null;

	const personalMailboxes = await db
		.select()
		.from(mailboxes)
		.where(and(eq(mailboxes.userId, userId), eq(mailboxes.type, "personal")));
	for (const mailbox of personalMailboxes) {
		const addresses = await getMailboxDomainAddresses(db, mailbox);
		if (addresses.includes(email)) return account;
	}
	return null;
}
