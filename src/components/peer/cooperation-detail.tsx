"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import {
  PEER_COOPERATION_REPORT_REASONS,
  PEER_COOPERATION_STATUS_LABELS,
} from "@/lib/constants/peer";
import type {
  SerializedPeerCooperation,
  SerializedPeerMessage,
} from "@/lib/serializers/peer";

export interface CooperationDetailProps {
  initialCooperation: SerializedPeerCooperation;
  initialMessages: SerializedPeerMessage[];
  currentUserId: string;
}

export function CooperationDetail({
  initialCooperation,
  initialMessages,
  currentUserId,
}: CooperationDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [cooperation, setCooperation] = useState<SerializedPeerCooperation>(
    initialCooperation,
  );
  const [messages, setMessages] = useState<SerializedPeerMessage[]>(
    initialMessages,
  );
  const [goalInput, setGoalInput] = useState(cooperation.goal ?? "");
  const [messageInput, setMessageInput] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [myRating, setMyRating] = useState(5);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(
    "abusive" as (typeof PEER_COOPERATION_REPORT_REASONS)[number]["value"],
  );
  const [reportNote, setReportNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isActive = cooperation.status === "active";
  const isRequester = cooperation.requesterId === currentUserId;
  const otherPartyLabel = isRequester
    ? cooperation.helper.displayName ?? "همیار"
    : cooperation.requester.displayName ?? "درخواست‌دهنده";
  const myRatingField = isRequester ? "requesterRating" : "helperRating";

  async function run(
    action: string,
    fn: () => Promise<Response>,
    onOk?: string,
    refreshMessages = false,
  ) {
    setBusy(action);
    setError(null);
    try {
      const res = await fn();
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در انجام عملیات");
        return;
      }
      if (onOk) toast({ title: onOk, tone: "success" });
      await refreshCooperation(refreshMessages);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(null);
    }
  }

  async function refreshCooperation(refreshMessages = false) {
    const res = await fetch(`/api/peer/cooperations/${cooperation.id}`, {
      cache: "no-store",
    });
    const body = (await res.json()) as {
      ok: boolean;
      data?: {
        cooperation: SerializedPeerCooperation;
        messages: SerializedPeerMessage[];
      };
    };
    if (res.ok && body.ok && body.data) {
      setCooperation(body.data.cooperation);
      if (refreshMessages) setMessages(body.data.messages);
    }
  }

  async function saveGoal() {
    if (goalInput.trim().length < 5) {
      setError("هدف حداقل ۵ کاراکتر باشد");
      return;
    }
    await run(
      "goal",
      () =>
        fetch(`/api/peer/cooperations/${cooperation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: goalInput.trim() }),
        }),
      "هدف همکاری ثبت شد",
    );
  }

  async function sendMessage() {
    if (messageInput.trim().length < 1) return;
    const content = messageInput.trim();
    setMessageInput("");
    const res = await fetch(`/api/peer/cooperations/${cooperation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content }),
    });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { message: SerializedPeerMessage };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      setMessageInput(content);
      setError(body.error?.message ?? "خطا در ارسال پیام");
      return;
    }
    setMessages((current) => [...current, body.data!.message]);
  }

  async function completeCooperation() {
    if (outcomeSummary.trim().length < 5) {
      setError("خلاصه نتیجه حداقل ۵ کاراکتر باشد");
      return;
    }
    await run(
      "complete",
      () =>
        fetch(`/api/peer/cooperations/${cooperation.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outcomeSummary: outcomeSummary.trim(),
            [myRatingField]: myRating,
          }),
        }),
      "نتیجه همکاری ثبت شد",
    );
    setCompleteOpen(false);
    setOutcomeSummary("");
  }

  async function closeCooperation() {
    if (!window.confirm("این همکاری بدون ثبت نتیجه بسته شود؟")) return;
    await run("close", () =>
      fetch(`/api/peer/cooperations/${cooperation.id}/close`, {
        method: "POST",
      }),
      "همکاری بسته شد",
    );
  }

  async function submitReport() {
    await run(
      "report",
      () =>
        fetch(`/api/peer/cooperations/${cooperation.id}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: reportReason,
            note: reportNote.trim() || undefined,
          }),
        }),
      "گزارش ثبت شد",
    );
    setReportOpen(false);
    setReportNote("");
  }

  const fieldLabelClass = "text-foreground block text-sm font-medium";

  return (
    <div className="space-y-6">
      <article className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                cooperation.status === "active"
                  ? "brand"
                  : cooperation.status === "completed"
                    ? "success"
                    : "neutral"
              }
            >
              {PEER_COOPERATION_STATUS_LABELS[cooperation.status]}
            </Badge>
          </div>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(cooperation.createdAt)}
          </span>
        </div>

        <h1 className="text-foreground mt-3 text-2xl font-extrabold">
          همکاری با {otherPartyLabel}
        </h1>

        <p className="text-muted-foreground mt-1 text-xs">
          شما{" "}
          {isRequester ? (
            <>
              درخواست‌دهنده هستید؛ همیار:{" "}
              <Link href={`/users/${cooperation.helperId}`} className="hover:text-brand-700">
                {cooperation.helper.displayName ?? "بی‌نام"}
              </Link>
            </>
          ) : (
            <>
              همیار هستید؛ درخواست‌دهنده:{" "}
              <Link
                href={`/users/${cooperation.requesterId}`}
                className="hover:text-brand-700"
              >
                {cooperation.requester.displayName ?? "بی‌نام"}
              </Link>
            </>
          )}
        </p>

        <section className="bg-accent text-accent-foreground mt-4 rounded-lg p-4">
          <h2 className="text-sm font-bold">هدف همکاری</h2>
          {isActive ? (
            <>
              <Textarea
                value={goalInput}
                maxLength={800}
                rows={3}
                className="mt-2"
                placeholder="هدف این همکاری را مشخص کنید (مثلاً: رسیدن به یک راهکار قابل اجرا برای فلان مسئله)."
                onChange={(event) => setGoalInput(event.target.value)}
              />
              <Button
                size="sm"
                className="mt-2"
                loading={busy === "goal"}
                onClick={saveGoal}
              >
                ثبت هدف
              </Button>
            </>
          ) : (
            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
              {cooperation.goal ?? "تعیین نشده"}
            </p>
          )}
        </section>

        {cooperation.outcomeSummary && (
          <section className="border-brand-300 bg-brand-50 mt-4 rounded-lg border p-4">
            <h2 className="text-brand-800 text-sm font-bold">نتیجه همکاری</h2>
            <p className="text-brand-900 mt-1 text-sm leading-6 whitespace-pre-wrap">
              {cooperation.outcomeSummary}
            </p>
            {(cooperation.requesterRating !== null ||
              cooperation.helperRating !== null) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {cooperation.requesterRating !== null && (
                  <Badge tone="info">
                    ارزیابی درخواست‌دهنده: {cooperation.requesterRating} از ۵
                  </Badge>
                )}
                {cooperation.helperRating !== null && (
                  <Badge tone="info">
                    ارزیابی همیار: {cooperation.helperRating} از ۵
                  </Badge>
                )}
              </div>
            )}
          </section>
        )}

        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}

        {isActive && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button size="sm" onClick={() => setCompleteOpen(true)}>
              ثبت نتیجه و پایان همکاری
            </Button>
            <Button size="sm" variant="outline" onClick={closeCooperation}>
              بستن بدون نتیجه
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReportOpen(true)}
            >
              گزارش مشکل
            </Button>
          </div>
        )}
      </article>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          گفت‌وگوی همکاری
        </h2>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            هنوز پیامی ردوبدل نشده است. گفت‌وگو را آغاز کنید.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-xl border px-3 py-2 ${
                  message.isMine
                    ? "bg-brand-50 border-brand-200 mr-auto"
                    : "bg-card border-border"
                }`}
              >
                <p className="text-foreground text-sm leading-6 whitespace-pre-wrap">
                  {message.body}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {message.senderLabel} • {formatRelativeTime(message.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {isActive && (
          <div className="mt-4 space-y-2">
            <Textarea
              value={messageInput}
              maxLength={1000}
              rows={3}
              placeholder="پیام موضوع‌محور درباره هدف همکاری بنویسید (بدون اطلاعات شناسایی‌کننده)."
              onChange={(event) => setMessageInput(event.target.value)}
            />
            <Button
              size="sm"
              disabled={messageInput.trim().length < 1}
              onClick={() => void sendMessage()}
            >
              ارسال پیام
            </Button>
          </div>
        )}
      </section>

      <Modal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="ثبت نتیجه همکاری"
        description="خلاصه نتیجه را بنویسید و سودمندی همکاری را ارزیابی کنید."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="outcomeSummary" className={fieldLabelClass}>
              خلاصه نتیجه
            </label>
            <Textarea
              id="outcomeSummary"
              value={outcomeSummary}
              maxLength={2000}
              rows={4}
              placeholder="چه راهکاری حاصل شد؟ چه چیزی مفید بود؟"
              onChange={(event) => setOutcomeSummary(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rating" className={fieldLabelClass}>
              ارزیابی سودمندی (۱ تا ۵)
            </label>
            <select
              id="rating"
              value={myRating}
              onChange={(event) => setMyRating(Number(event.target.value))}
              className="bg-background text-foreground border-input focus-visible:outline-ring h-11 w-full rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} از ۵
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCompleteOpen(false)}>
              انصراف
            </Button>
            <Button loading={busy === "complete"} onClick={completeCooperation}>
              ثبت نتیجه
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="گزارش مشکل در همکاری"
        description="این گزارش برای بررسی ناظران ارسال می‌شود."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reportReason" className={fieldLabelClass}>
              دلیل گزارش
            </label>
            <select
              id="reportReason"
              value={reportReason}
              onChange={(event) =>
                setReportReason(
                  event.target.value as (typeof PEER_COOPERATION_REPORT_REASONS)[number]["value"],
                )
              }
              className="bg-background text-foreground border-input focus-visible:outline-ring h-11 w-full rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {PEER_COOPERATION_REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="reportNote" className={fieldLabelClass}>
              توضیح (اختیاری)
            </label>
            <Textarea
              id="reportNote"
              value={reportNote}
              maxLength={500}
              rows={3}
              onChange={(event) => setReportNote(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              انصراف
            </Button>
            <Button loading={busy === "report"} onClick={submitReport}>
              ارسال گزارش
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}