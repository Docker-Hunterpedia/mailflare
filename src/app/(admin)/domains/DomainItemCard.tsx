import { Fragment } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list";
import { cn } from "@/lib/utils";
import DomainDnsDetails from "./DomainDnsDetails";
import DomainDnsSkeleton from "./DomainDnsSkeleton";
import { dnsAuthRecords, getDnsAuthStatusLabel } from "./utils";
import {
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Globe2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import type { DomainItemCardProps } from "./types";

function StatusIcon({ ok, className }: { ok: boolean; className?: string }) {
  if (ok) return <Check className={cn(className, "text-green-600")} />;
  return <AlertTriangle className={cn(className, "text-amber-500")} />;
}

export default function DomainItemCard({
  item,
  dns,
  dnsDetails,
  dnsLoading = false,
  dnsError,
  expanded = false,
  remove,
  onToggleDns,
  onSetup,
  setupRecord,
  setupMessage,
}: DomainItemCardProps) {
  const auth = dns?.auth;

  return (
    <ListRow className="group relative flex-col items-stretch gap-3">
      <div className="flex items-start gap-4">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-600">
          <Globe2 className="h-5 w-5" />
          <img
            src={`https://${item.hostname}/favicon.ico`}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-1"
            onError={(event) => event.currentTarget.remove()}
          />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="min-w-0 truncate pr-10 text-sm font-semibold text-neutral-900">
            {item.hostname}
          </span>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={item.status === "active" ? "success" : "secondary"}
              className="gap-1"
            >
              <StatusIcon ok={item.status === "active"} className="h-3 w-3" />
              {item.status}
            </Badge>
            <Badge
              variant={item.routingEnabled ? "outline" : "secondary"}
              className={cn("gap-1", !item.routingEnabled && "opacity-50")}
            >
              <StatusIcon ok={item.routingEnabled} className="h-3 w-3" />
              routing
            </Badge>
            <Badge
              variant={item.sendingEnabled ? "outline" : "secondary"}
              className={cn("gap-1", !item.sendingEnabled && "opacity-50")}
            >
              <StatusIcon ok={item.sendingEnabled} className="h-3 w-3" />
              sending
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {auth &&
              dnsAuthRecords.map((record, index) => (
                <Fragment key={record}>
                  {index > 0 && <span className="text-neutral-300">|</span>}
                  <span
                    className="flex items-center gap-1 text-neutral-500"
                    title={`${record.toUpperCase()} · ${getDnsAuthStatusLabel(auth[record])}`}
                  >
                    <span className="uppercase">{record}</span>
                    <StatusIcon
                      ok={auth[record] === "ok"}
                      className="h-3.5 w-3.5"
                    />
                  </span>
                </Fragment>
              ))}
            <span className="flex-1" />
            <button
              onClick={() => onToggleDns(item.id)}
              className="flex cursor-pointer items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800"
            >
              {expanded ? (
                <>
                  Hide details <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                <>
                  Show details <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded &&
        (dnsDetails ? (
          <DomainDnsDetails
            domain={item}
            dns={dnsDetails}
            onSetup={onSetup}
            setupRecord={setupRecord}
            setupMessage={setupMessage}
          />
        ) : dnsError ? (
          <div className="px-4 pb-4 pt-4 text-sm text-red-600 sm:px-5 sm:pb-5">
            {dnsError}
          </div>
        ) : dnsLoading ? (
          <DomainDnsSkeleton />
        ) : null)}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 p-0"
            disabled={remove.isPending}
            aria-label={`Actions for ${item.hostname}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-40 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg"
          >
            <DropdownMenu.Item
              disabled={remove.isPending}
              onSelect={() => remove.mutate(item.id)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-red-600 outline-none hover:bg-red-50 focus:bg-red-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove domain
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </ListRow>
  );
}
