"use client";

import Link from "next/link";
import { useState } from "react";
import dayjs from "dayjs";
import { ChevronDown, Paperclip, Reply } from "lucide-react";
import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { getMessageBackHref } from "@/components/message-actions/utils";
import { sanitizeEmailHtml } from "@/app/(dashboard)/inbox/[messageId]/email-html-sanitizer";
import { getMessageBodyDisplay, resolveInlineAttachmentUrls } from "@/app/(dashboard)/inbox/[messageId]/utils";
import { getEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import type { ConversationMessageCardProps, ConversationThreadProps } from "./conversation-thread-types";
import {
	getAvatarInitial,
	getConversationRecipients,
	getConversationSender,
	partitionThread,
} from "./conversation-thread-utils";

/**
 * The other messages in a conversation, collapsed to one line each and expanded
 * in place on click, so a reader can follow a whole exchange without leaving the
 * message they opened.
 */
export function ConversationThread({
	currentMessageId,
	position,
	messages,
	mailboxId,
	currentAccountName,
}: ConversationThreadProps) {
	const slice = partitionThread(messages, currentMessageId, position);
	if (slice.length === 0) return null;

	return (
		<section
			aria-label={position === "before" ? "Earlier messages in this conversation" : "Later messages in this conversation"}
			className={cn("px-6", position === "before" ? "pt-4" : "pb-6")}
		>
			{position === "before" && (
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
					Conversation · {messages.length} messages
				</p>
			)}
			<ol className="space-y-2">
				{slice.map((message) => (
					<li key={message.id}>
						<ConversationMessageCard
							message={message}
							mailboxId={mailboxId}
							currentAccountName={currentAccountName}
						/>
					</li>
				))}
			</ol>
		</section>
	);
}

export function ConversationMessageCard({
	message,
	mailboxId,
	currentAccountName,
	defaultExpanded = false,
}: ConversationMessageCardProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);
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
		<article
			className={cn(
				"rounded-lg border transition-colors",
				outbound ? "border-blue-100 bg-blue-50/40" : "border-neutral-200 bg-white",
				expanded ? "shadow-sm" : "hover:bg-neutral-50",
			)}
		>
			<button
				type="button"
				onClick={() => setExpanded((open) => !open)}
				aria-expanded={expanded}
				className="flex w-full items-center gap-3 px-4 py-3 text-left"
			>
				<span
					className={cn(
						"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
						outbound ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-700",
					)}
					aria-hidden
				>
					{outbound ? <Reply className="h-4 w-4" /> : getAvatarInitial(message, currentAccountName)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="flex items-baseline justify-between gap-3">
						<span className={cn("truncate text-sm", message.read || outbound ? "text-neutral-900" : "font-semibold text-neutral-900")}>
							{sender}
							{recipients && <span className="ml-2 text-xs font-normal text-neutral-500">to {recipients}</span>}
						</span>
						<span className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
							{attachments.length > 0 && <Paperclip className="h-3.5 w-3.5" aria-label={`${attachments.length} attachments`} />}
							{dayjs(message.createdAt).format("MMM DD, YYYY, hh:mmA")}
							<ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
						</span>
					</span>
					{!expanded && (
						<span className="mt-0.5 block truncate text-xs text-neutral-500">{message.snippet || "No preview"}</span>
					)}
				</span>
			</button>
			{expanded && body && (
				<div className="border-t border-neutral-100 px-4 py-4">
					<p className="mb-3 text-xs text-neutral-500">
						{message.direction === "inbound" ? (
							<ContactDetailsTrigger mailboxId={mailboxId} address={message.fromAddr} name={sender} />
						) : (
							sender
						)}{" "}
						&lt;{getEmailAddress(message.fromAddr)}&gt;
					</p>
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
					<Link href={href} className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline">
						Open this message
					</Link>
				</div>
			)}
		</article>
	);
}
