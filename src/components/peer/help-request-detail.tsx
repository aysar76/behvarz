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
  PEER_HELP_REQUEST_STATUS_LABELS,
  PEER_OFFER_STATUS_LABELS,
} from "@/lib/constants/peer";
import { PROBLEM_BARRIER_LABELS } from "@/lib/constants/problem";
import type { SuggestedHelper } from "@/lib/peer";
import type {
  SerializedPeerHelpRequest,
  SerializedPeerOffer,
} from "@/lib/serializers/peer";

export interface HelpRequestDetailProps {
  initialHelpRequest: SerializedPeerHelpRequest;
  initialSuggestions: SuggestedHelper[];
}

export function HelpRequestDetail({
  initialHelpRequest,
  initialSuggestions,
}: HelpRequestDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [helpRequest, setHelpRequest] = useState<SerializedPeerHelpRequest>(
    initialHelpRequest,
  );
  const [suggestions, setSuggestions] =
    useState<SuggestedHelper[]>(initialSuggestions);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");
  const [inviteTarget, setInviteTarget] = useState<SuggestedHelper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isRequester = helpRequest.isRequester;
  const isOpen = helpRequest.status === "open";
  const myPendingOffer = helpRequest.offers.find(
    (offer) => offer.isMine && offer.status === "pending",
  );

  async function refresh() {
    const res = await fetch(`/api/peer/help-requests/${helpRequest.id}`, {
      cache: "no-store",
    });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { helpRequest: SerializedPeerHelpRequest };
    };
    if (res.ok && body.ok && body.data) {
      setHelpRequest(body.data.helpRequest);
    }
  }

  async function run(action: string, fn: () => Promise<Response>, onOk?: string) {
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
      await refresh();
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(null);
    }
  }

  async function offerHelp() {
    await run(
      "offer",
      () =>
        fetch("/api/peer/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            helpRequestId: helpRequest.id,
            message: offerMessage.trim() || undefined,
          }),
        }),
      "پیشنهاد همیاری ارسال شد",
    );
    setOfferModalOpen(false);
    setOfferMessage("");
  }

  async function inviteHelper(helperId: string) {
    await run(
      `invite-${helperId}`,
      () =>
        fetch("/api/peer/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            helpRequestId: helpRequest.id,
            helperId,
            message: "دعوت همیاری از پیشنهادهای مرتبط",
          }),
        }),
      "دعوت همیاری ارسال شد",
    );
    setInviteTarget(null);
    setSuggestions((current) =>
      current.filter((suggestion) => suggestion.user.id !== helperId),
    );
  }

  async function respondOffer(offer: SerializedPeerOffer, action: "accept" | "reject") {
    await run(
      `offer-${offer.id}`,
      () =>
        fetch(`/api/peer/offers/${offer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }),
      action === "accept" ? "همکاری آغاز شد" : "پیشنهاد رد شد",
    );
  }

  async function withdrawOffer(offerId: string) {
    await run(`withdraw-${offerId}`, () =>
      fetch(`/api/peer/offers/${offerId}/withdraw`, { method: "POST" }),
    );
  }

  async function cancelRequest() {
    if (!window.confirm("درخواست همیار لغو شود؟")) return;
    await run("cancel", () =>
      fetch(`/api/peer/help-requests/${helpRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }),
      "درخواست لغو شد",
    );
  }

  const fieldLabelClass = "text-foreground block text-sm font-medium";

  return (
    <div className="space-y-6">
      <article className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                helpRequest.status === "open"
                  ? "info"
                  : helpRequest.status === "matched"
                    ? "warning"
                    : helpRequest.status === "completed"
                      ? "success"
                      : "neutral"
              }
            >
              {PEER_HELP_REQUEST_STATUS_LABELS[helpRequest.status]}
            </Badge>
            <Badge tone="neutral">
              {PROBLEM_BARRIER_LABELS[helpRequest.barrierType]}
            </Badge>
          </div>

          {isRequester && isOpen && (
            <Button size="sm" variant="ghost" loading={busy === "cancel"} onClick={cancelRequest}>
              لغو درخواست
            </Button>
          )}
        </div>

        <h1 className="text-foreground mt-3 text-2xl font-extrabold">
          {helpRequest.title}
        </h1>

        <p className="text-muted-foreground mt-1 text-xs">
          {helpRequest.requester.displayName ?? "بی‌نام"}
          {helpRequest.requester.province
            ? ` — ${helpRequest.requester.province}`
            : ""}{" "}
          • {formatRelativeTime(helpRequest.createdAt)}
          {helpRequest.province ? ` • ترجیح همیار: ${helpRequest.province}` : ""}
        </p>

        {helpRequest.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {helpRequest.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-foreground mt-4 text-sm leading-7 whitespace-pre-wrap">
          {helpRequest.description}
        </p>

        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}

        {!isRequester && isOpen && !myPendingOffer && (
          <div className="mt-5">
            <Button onClick={() => setOfferModalOpen(true)}>
              پیشنهاد همیاری
            </Button>
            <p className="text-muted-foreground mt-2 text-xs">
              تجربه مرتبط دارید؟ پیشنهاد دهید تا درخواست‌دهنده پاسخ دهد. گفت‌وگو
              محدود و موضوع‌محور است؛ اطلاعات تماس بدون رضایت نمایش داده نمی‌شود.
            </p>
          </div>
        )}
        {!isRequester && myPendingOffer && (
          <div className="mt-5">
            <Badge tone="warning">پیشنهاد شما در انتظار پاسخ است</Badge>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                loading={busy === `withdraw-${myPendingOffer.id}`}
                onClick={() => withdrawOffer(myPendingOffer.id)}
              >
                پس‌گرفتن پیشنهاد
              </Button>
            </div>
          </div>
        )}
      </article>

      {isRequester && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            همیارهای پیشنهادی
          </h2>
          {!isOpen ? (
            <p className="text-muted-foreground text-sm">
              این درخواست دیگر پذیرای همیار نیست.
            </p>
          ) : suggestions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              هنوز همیار مرتبطی یافت نشد. اعضایی با «تمایل به همیاری» فعال و
              تجربه مرتبط، اینجا پیشنهاد می‌شوند.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <article
                  key={suggestion.user.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-foreground text-sm font-bold">
                        {suggestion.user.displayName ?? "بی‌نام"}
                        {suggestion.user.province && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            • {suggestion.user.province}
                          </span>
                        )}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {suggestion.reasons.map((reason) => (
                          <Badge key={reason} tone="neutral">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      loading={busy === `invite-${suggestion.user.id}`}
                      onClick={() => setInviteTarget(suggestion)}
                    >
                      دعوت همیار
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {isRequester && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            پیشنهادهای دریافت‌شده ({helpRequest.offers.length})
          </h2>
          {helpRequest.offers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              هنوز پیشنهادی دریافت نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {helpRequest.offers.map((offer) => (
                <article
                  key={offer.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-foreground text-sm font-bold">
                        {offer.helper.displayName ?? "بی‌نام"}
                        {offer.helper.province && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            • {offer.helper.province}
                          </span>
                        )}
                      </p>
                      {offer.message && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {offer.message}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatRelativeTime(offer.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {offer.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            loading={busy === `offer-${offer.id}`}
                            onClick={() => respondOffer(offer, "accept")}
                          >
                            پذیرش
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busy === `offer-${offer.id}`}
                            onClick={() => respondOffer(offer, "reject")}
                          >
                            رد
                          </Button>
                        </>
                      ) : (
                        <Badge tone="neutral">
                          {PEER_OFFER_STATUS_LABELS[offer.status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!isRequester && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            پیشنهاد من
          </h2>
          {helpRequest.offers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              شما هنوز پیشنهاد همیاری برای این درخواست ثبت نکرده‌اید.
            </p>
          ) : (
            helpRequest.offers.map((offer) => (
              <div
                key={offer.id}
                className="border-border bg-card rounded-lg border px-3 py-2 text-sm"
              >
                <Badge tone="neutral">
                  {PEER_OFFER_STATUS_LABELS[offer.status]}
                </Badge>
              </div>
            ))
          )}
        </section>
      )}

      <Modal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="پیشنهاد همیاری"
        description="تجربه مرتبط خود را کوتاه بنویسید تا درخواست‌دهنده تصمیم بگیرد."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="offerMessage" className={fieldLabelClass}>
              پیام (اختیاری)
            </label>
            <Textarea
              id="offerMessage"
              value={offerMessage}
              maxLength={600}
              rows={4}
              placeholder="مثلاً: تجربه اجرای همین برنامه را دارم و می‌توانم راهنمایی کنم."
              onChange={(event) => setOfferMessage(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOfferModalOpen(false)}>
              انصراف
            </Button>
            <Button loading={busy === "offer"} onClick={offerHelp}>
              ارسال پیشنهاد
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={inviteTarget !== null}
        onClose={() => setInviteTarget(null)}
        title="دعوت همیار"
        description={`برای ${inviteTarget?.user.displayName ?? "این عضو"} دعوت همیاری ارسال می‌شود.`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(inviteTarget?.reasons ?? []).map((reason) => (
              <Badge key={reason} tone="neutral">
                {reason}
              </Badge>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setInviteTarget(null)}>
              انصراف
            </Button>
            <Button
              loading={
                inviteTarget !== null && busy === `invite-${inviteTarget.user.id}`
              }
              onClick={() => inviteTarget && inviteHelper(inviteTarget.user.id)}
            >
              ارسال دعوت
            </Button>
          </div>
        </div>
      </Modal>

      {helpRequest.cooperations.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            همکاری آغازشده
          </h2>
          {helpRequest.cooperations.map((cooperation) => (
            <Link
              key={cooperation.id}
              href={`/peer/cooperations/${cooperation.id}`}
              className="border-brand-300 bg-brand-50 block rounded-xl border p-4 text-sm font-bold"
            >
              مشاهده گفت‌وگو و هدف همکاری
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}