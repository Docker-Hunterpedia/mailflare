"use client";

import Link from "next/link";
import { useState } from "react";
import dayjs from "dayjs";
import { ChevronsUpDown, Paperclip } from "lucide-react";
import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import { getMessageBackHref } from "@/components/message-actions/utils";
import { sanitizeEmailHtml } from "@/app/(dashboard)/inbox/[messageId]/email-html-sanitizer";
import { getMessageBodyDisplay, resolveInlineAttachmentUrls } from "@/app/(dashboard)/inbox/[messageId]/utils";
import { getEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import type { ConversationMessageCardProps, ConversationThreadProps } from "./conversation-thread-types";
import { ThreadMessageActions } from "./thread-message-actions";
import {
	getConversationRecipients,
	getConversationSender,
	partitionThread,
} from "./conversation-thread-utils";

/**
 * The other messages in a conversation, ordered oldest to newest and collapsed
 * until opened. Readers can also expand the full visible portion at once.
 */
export function ConversationThread({
	currentMessageId,
	position,
	messages,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	expandedAll,
	onExpandedAllChange,
}: ConversationThreadProps) {
	const slice = partitionThread(messages, currentMessageId, position);
	if (slice.length === 0) return null;
	const firstMessage = slice[0];
	const lastMessage = slice.at(-1)!;
	const middleMessages = slice.slice(1, -1);
	const collapsed = !expandedAll && middleMessages.length > 0;
	const collapsedLabel = `${middleMessages.length} ${position === "before" ? "older" : "newer"} message${middleMessages.length === 1 ? "" : "s"}`;

	return (
		<section
			aria-label={position === "before" ? "Earlier messages in this conversation" : "Later messages in this conversation"}
			className={cn(position === "before" ? "" : "pb-6")}
		>
			<ol className={cn(!collapsed && "divide-y divide-neutral-100", "border-b border-neutral-200")}>
				<li className="border-t-0">
					<ConversationMessageCard
						message={firstMessage}
						mailboxId={mailboxId}
						currentAccountName={currentAccountName}
						ownAddress={ownAddress}
						ownAddresses={ownAddresses}
					/>
				</li>
				{collapsed ? (
					<li className="flex items-center justify-center gap-1 py-2 text-center border-y border-neutral-100 h-px my-4">
						<span className="bg-white px-6 flex flex-row items-center gap-2">
							<span className="text-sm font-medium text-neutral-600">{collapsedLabel}</span>
							<button
								type="button"
								onClick={() => onExpandedAllChange(true)}
								aria-label={`Expand ${collapsedLabel}`}
								title={`Expand ${collapsedLabel}`}
								className="inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
							>
								<ChevronsUpDown className="h-4 w-4" />
							</button>
						</span>
					</li>
				) : (
					middleMessages.map((message) => (
						<li key={message.id}>
							<ConversationMessageCard
								message={message}
								mailboxId={mailboxId}
								currentAccountName={currentAccountName}
								ownAddress={ownAddress}
								ownAddresses={ownAddresses}
							/>
						</li>
					))
				)}
				{lastMessage.id !== firstMessage.id && (
					<li>
						<ConversationMessageCard
							message={lastMessage}
							mailboxId={mailboxId}
							currentAccountName={currentAccountName}
							ownAddress={ownAddress}
							ownAddresses={ownAddresses}
						/>
					</li>
				)}
			</ol>
		</section>
	);
}

export function ConversationMessageCard({
	message,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	defaultExpanded = false,
}: ConversationMessageCardProps) {
	const [locallyExpanded, setLocallyExpanded] = useState(defaultExpanded);
	const expanded = locallyExpanded;
	const sender = getConversationSender(message, currentAccountName);
	const recipients = getConversationRecipients(message);
	const href = `${getMessageBackHref(message.direction, message.status)}/${message.id}`;
	const outbound = message.direction === "outbound";
	const attachments = message.attachments.filter((attachment) => attachment.disposition === "attachment");

	let body: { html: string | null; text: string } | null = null;
	if (expanded) {
		const display = getMessageBodyDisplay(message.textBody, message.htmlBody, message.snippet);
		body = {
			html: sanitizeEmailHtml(resolveInlineAttachmentUrls(display.htmlBody, message.id, message.attachments)),
			text: display.latestContent,
		};
	}

	return (
		<article className={cn("bg-white transition-colors px-6", !expanded && "hover:bg-neutral-50")}>
			<div className="flex w-full items-center gap-3 py-3">
				<button
					type="button"
					onClick={() => setLocallyExpanded((open) => !open)}
					aria-expanded={expanded}
					className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
				>
					<ContactAvatar
						mailboxId={mailboxId}
						address={message.fromAddr}
						name={sender}
						hasManagedAvatar={message.fromContactHasAvatar}
					/>
					<span className="min-w-0 flex-1">
						<div className="flex flex-col">
							<span className={cn("truncate text-sm", message.read || outbound ? "text-neutral-900" : "font-semibold text-neutral-900")}>
								{sender}
							</span>
							{expanded && recipients && <span className="text-xs font-normal text-neutral-500">to {recipients}</span>}
						</div>
						{!expanded && (
							<span className="block truncate text-xs text-neutral-500">{message.snippet || "No preview"}</span>
						)}
					</span>
				</button>
				<span className="flex shrink-0 items-center gap-2 text-xs">
					{attachments.length > 0 && <Paperclip className="h-3.5 w-3.5" aria-label={`${attachments.length} attachments`} />}
					{dayjs(message.createdAt).format("MMM DD, YYYY, hh:mmA")}
				</span>
				<ThreadMessageActions
					message={message}
					mailboxId={mailboxId}
					ownAddress={ownAddress}
					ownAddresses={ownAddresses}
				/>
			</div>
			{expanded && body && (
				<div className="pb-4 pt-2">
					{/* <p className="mb-3 text-xs text-neutral-500">
						{message.direction === "inbound" ? (
							<ContactDetailsTrigger mailboxId={mailboxId} address={message.fromAddr} name={sender} />
						) : (
							sender
						)}{" "}
						&lt;{getEmailAddress(message.fromAddr)}&gt;
					</p> */}
					{body.html ? (
						<div className="email-body max-w-none text-sm text-neutral-900" dangerouslySetInnerHTML={{ __html: body.html }} />
					) : (
						<pre className="whitespace-pre-wrap font-sans text-sm text-neutral-900">{body.text}</pre>
					)}
					{attachments.length > 0 && (
						<ul className="mt-4 flex flex-wrap gap-2">
							{attachments.map((attachment) => (
								<li key={attachment.id}>
									<a
										href={`/api/messages/${message.id}/attachments/${attachment.id}`}
										className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
									>
										<Paperclip className="h-3 w-3" />
										<span className="max-w-48 truncate">{attachment.filename}</span>
									</a>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</article>
	);
}
