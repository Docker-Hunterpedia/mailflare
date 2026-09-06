import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { Message, MessageDirection } from "@/hooks/types";
import { IconNode } from "lucide-react";

export type MessageActionsProps = {
	messageId: string;
	mailboxId: string | null;
	senderAddress: string;
	direction: MessageDirection;
	status: string;
	read: boolean;
	unsubscribeUrl?: string | null;
	subject?: string | null;
	bodyText?: string | null;
	ownAddress?: string | null;
	/** Every address the mailbox can send as; used to drop "me" from reply-all. */
	ownAddresses?: string[];
	/** Recipient and threading headers of the message being acted on. */
	message?: ReplyableMessage;
};

export type SingleMessageAction = BulkMessageAction | "reply" | "replyAll";

export type ReplyMode = "reply" | "replyAll";

export type ReplyableMessage = Pick<
	Message,
	"direction" | "fromAddr" | "toAddr" | "ccAddr" | "providerMessageId" | "references" | "threadId"
>;

export type ReplyRecipients = {
	to: string[];
	cc: string[];
};

export type ReplyDraftInput = {
	mailboxId: string | null;
	senderAddress: string;
	ownAddress?: string | null;
	subject?: string | null;
	bodyText?: string | null;
	recipients: ReplyRecipients;
	threading?: {
		inReplyTo: string | null;
		references: string | null;
		threadId: string | null;
	};
};

export type TrashSenderRuleInput = {
	mailboxId: string;
	senderAddress: string;
};

export type BlockMessageContactInput = {
	mailboxId: string;
	senderAddress: string;
};

export type MoveMessageActionItem = {
	action: BulkMessageAction;
	label: string;
	icon: any
};
