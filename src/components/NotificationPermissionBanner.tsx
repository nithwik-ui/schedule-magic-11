import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onGrant?: () => void;
};

export const NotificationPermissionBanner: React.FC<Props> = ({ onGrant }) => {
  const { toast } = useToast();

  if (typeof window === "undefined" || typeof Notification === "undefined") return null;

  // Respect a dismissed flag so users aren't nagged repeatedly
  try {
    const dismissed = localStorage.getItem("sru_notify_banner_dismissed");
    if (dismissed === "1") return null;
  } catch {}

  if (Notification.permission === "granted") return null;

  const request = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        toast({ title: "Notifications enabled" });
        try { localStorage.setItem("sru_notify_banner_dismissed", "1"); } catch {}
        onGrant?.();
      } else {
        toast({ title: "Permission denied", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Request failed", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 text-yellow-900 flex items-center justify-between gap-4">
      <div className="text-sm">To receive class reminders while the page is open, enable browser notifications.</div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={request} className="bg-yellow-600 text-white">Enable</Button>
        <Button size="sm" variant="ghost" onClick={() => { try { localStorage.setItem('sru_notify_banner_dismissed','1'); } catch {} }}>
          Dismiss
        </Button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
