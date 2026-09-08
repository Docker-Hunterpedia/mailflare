"use client";

import { useEffect, useState } from "react";
import { CONTACT_AVATAR_CHANGED_EVENT } from "@/lib/contacts/avatar-client";
import { normalizeEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import type { ContactAvatarProps } from "./contact-avatar-types";
import {
	getContactAvatarInitial,
	getGravatarAvatarUrl,
	getManagedContactAvatarUrl,
} from "./contact-avatar-utils";

export function ContactAvatar({
	mailboxId,
	address,
	name,
	hasManagedAvatar = false,
	className,
}: ContactAvatarProps) {
	const [managedAvatar, setManagedAvatar] = useState(hasManagedAvatar);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [imageFailed, setImageFailed] = useState(false);
	const [avatarVersion, setAvatarVersion] = useState(0);

	useEffect(() => {
		setManagedAvatar(hasManagedAvatar);
		setAvatarUrl(null);
		setImageFailed(false);
		setAvatarVersion(0);
	}, [address, hasManagedAvatar, mailboxId]);

	useEffect(() => {
		function onAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<{ email?: string; hasAvatar?: boolean }>).detail;
			if (detail?.email === normalizeEmailAddress(address)) {
				setManagedAvatar(!!detail.hasAvatar);
				setAvatarVersion(Date.now());
			}
		}

		window.addEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
		return () => window.removeEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
	}, [address]);

	useEffect(() => {
		let cancelled = false;
		setImageFailed(false);
		if (managedAvatar && mailboxId) {
			setAvatarUrl(getManagedContactAvatarUrl(mailboxId, address, avatarVersion));
			return;
		}
		void getGravatarAvatarUrl(address).then((url) => {
			if (!cancelled) setAvatarUrl(url);
		});
		return () => {
			cancelled = true;
		};
	}, [address, avatarVersion, mailboxId, managedAvatar]);

	if (avatarUrl && !imageFailed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt=""
				className={cn("h-8 w-8 shrink-0 rounded-full border border-neutral-200 object-cover", className)}
				onError={() => {
					if (managedAvatar) setManagedAvatar(false);
					else setImageFailed(true);
				}}
			/>
		);
	}

	return (
		<span
			className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700", className)}
			aria-hidden
		>
			{getContactAvatarInitial(name, address)}
		</span>
	);
}
