"use client";

import { Switch } from "@/components/ui/switch";
import { useConversationView } from "@/components/messages/use-conversation-view";

export function InboxThreadingSettings() {
	const [conversationView, setConversationView] = useConversationView();

	return (
		<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
			<span className="flex-1">
				<span className="block text-sm font-medium text-neutral-900">Group emails into conversations</span>
				<span className="mt-1 block text-sm text-neutral-500">
					Show related messages together as a single thread in message lists.
				</span>
			</span>
			<Switch checked={conversationView} onCheckedChange={setConversationView} />
		</label>
	);
}
