"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import {
  CIRCLE_JOIN_REQUEST_STATUS_LABELS,
  CIRCLE_MEMBERSHIP_ROLE_LABELS,
} from "@/lib/constants/circle";
import type { SerializedCircle } from "@/lib/serializers/circle";

export interface CircleDetailProps {
  initialCircle: SerializedCircle;
  inviteCandidates: {
    id: string;
    displayName: string | null;
    province: string | null;
    city: string | null;
  }[];
  canModerate: boolean;
}

export function CircleDetail({
  initialCircle,
  inviteCandidates: initialCandidates,
  canModerate,
}: CircleDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [circle, setCircle] = useState<SerializedCircle>(initialCircle);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingSummary, setMeetingSummary] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState("");
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isArchived = circle.status === "archived";
  const isFull = circle.memberCount >= circle.capacity;

  async function refresh() {
    const res = await fetch(`/api/circles/${circle.id}`, { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { circle: SerializedCircle };
    };
    if (res.ok && body.ok && body.data) {
      setCircle(body.data.circle);
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

  async function requestJoin() {
    await run(
      "join",
      () =>
        fetch(`/api/circles/${circle.id}/join-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: joinMessage.trim() || undefined }),
        }),
      "درخواست عضویت ثبت شد",
    );
    setJoinModalOpen(false);
    setJoinMessage("");
  }

  async function cancelJoin(requestId: string) {
    await run("cancel-join", () =>
      fetch(`/api/circles/${circle.id}/join-requests/${requestId}`, {
        method: "DELETE",
      }),
    );
  }

  async function respondInvite(inviteId: string, action: "accept" | "decline") {
    await run(
      `invite-${action}`,
      () =>
        fetch(`/api/circles/${circle.id}/invites/${inviteId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }),
      action === "accept" ? "به حلقه پیوستید" : "دعوت رد شد",
    );
  }

  async function reviewJoin(requestId: string, action: "approve" | "reject") {
    await run(
      `review-${requestId}`,
      () =>
        fetch(`/api/circles/${circle.id}/join-requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }),
      action === "approve" ? "عضو تأیید شد" : "درخواست رد شد",
    );
  }

  async function leaveCircle() {
    if (!window.confirm("از حلقه خارج می‌شوید؟")) return;
    await run("leave", () =>
      fetch(`/api/circles/${circle.id}/leave`, { method: "POST" }),
      "از حلقه خارج شدید",
    );
  }

  async function sendInvite() {
    if (!inviteUserId) return;
    await run(
      "invite",
      () =>
        fetch(`/api/circles/${circle.id}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: inviteUserId,
            message: inviteMessage.trim() || undefined,
          }),
        }),
      "دعوت‌نامه ارسال شد",
    );
    setInviteOpen(false);
    setInviteUserId("");
    setInviteMessage("");
    setCandidates((current) =>
      current.filter((candidate) => candidate.id !== inviteUserId),
    );
  }

  async function createMeeting() {
    if (meetingTitle.trim().length < 3) {
      setError("عنوان جلسه حداقل ۳ کاراکتر باشد");
      return;
    }
    await run(
      "meeting",
      () =>
        fetch(`/api/circles/${circle.id}/meetings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: meetingTitle.trim(),
            agenda: meetingAgenda.trim() || undefined,
            summary: meetingSummary.trim() || undefined,
          }),
        }),
      "جلسه ثبت شد",
    );
    setMeetingOpen(false);
    setMeetingTitle("");
    setMeetingAgenda("");
    setMeetingSummary("");
  }

  async function saveSummary(meetingId: string) {
    await run(
      `summary-${meetingId}`,
      () =>
        fetch(`/api/circles/${circle.id}/meetings/${meetingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: editingSummary.trim() }),
        }),
      "خروجی جلسه ثبت شد",
    );
    setEditingMeetingId(null);
    setEditingSummary("");
  }

  async function transferLeadership() {
    if (!transferMemberId) return;
    if (!window.confirm("راهبری حلقه به این عضو منتقل شود؟")) return;
    await run(
      "transfer",
      () =>
        fetch(`/api/circles/${circle.id}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: transferMemberId }),
        }),
      "راهبری منتقل شد",
    );
    setTransferOpen(false);
    setTransferMemberId("");
  }

  async function archiveCircle() {
    if (!window.confirm("حلقه بایگانی شود؟ این عمل قابل بازگشت نیست.")) return;
    await run("archive", () =>
      fetch(`/api/circles/${circle.id}/archive`, { method: "POST" }),
      "حلقه بایگانی شد",
    );
  }

  const fieldLabelClass = "text-foreground block text-sm font-medium";
  const myPendingJoinRequest = circle.joinRequests.find(
    (request) => request.status === "pending",
  );

  return (
    <div className="space-y-6">
      <article className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isArchived ? "neutral" : "brand"}>
              {isArchived ? "بایگانی‌شده" : "فعال"}
            </Badge>
            {circle.isFacilitator && <Badge tone="success">راهبر شما</Badge>}
            <Badge tone="info">
              {circle.memberCount} از {circle.capacity} عضو
            </Badge>
          </div>

          {!isArchived && !circle.isMember && !myPendingJoinRequest && (
            <Button size="sm" onClick={() => setJoinModalOpen(true)}>
              درخواست عضویت
            </Button>
          )}
          {!isArchived && myPendingJoinRequest && (
            <div className="flex items-center gap-2">
              <Badge tone="warning">در انتظار تأیید</Badge>
              <Button
                size="sm"
                variant="ghost"
                loading={busy === "cancel-join"}
                onClick={() => cancelJoin(myPendingJoinRequest.id)}
              >
                لغو درخواست
              </Button>
            </div>
          )}
          {circle.isMember && !isArchived && (
            <Button size="sm" variant="outline" onClick={leaveCircle}>
              خروج از حلقه
            </Button>
          )}
        </div>

        <h1 className="text-foreground mt-3 text-2xl font-extrabold">
          {circle.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          راهبر: {circle.facilitatorLabel} •{" "}
          {circle.province ?? "سراسری"}
          {circle.topic && (
            <>
              {" "}
              • موضوع: {circle.topic}
            </>
          )}
        </p>

        <p className="text-foreground mt-3 text-sm leading-7 whitespace-pre-wrap">
          {circle.description}
        </p>

        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}

        {circle.isFacilitator && !isArchived && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
              دعوت عضو
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMeetingOpen(true)}>
              ثبت جلسه
            </Button>
            {circle.members.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTransferOpen(true)}
              >
                انتقال راهبری
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={archiveCircle}>
              بایگانی حلقه
            </Button>
          </div>
        )}
        {canModerate && !circle.isFacilitator && !isArchived && (
          <div className="mt-4 border-t border-border pt-4">
            <Button size="sm" variant="ghost" onClick={archiveCircle}>
              بایگانی حلقه (مدیریت)
            </Button>
          </div>
        )}
      </article>

      {circle.invites.some((invite) => invite.status === "pending") && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            دعوت‌نامه شما
          </h2>
          {circle.invites
            .filter((invite) => invite.status === "pending")
            .map((invite) => (
              <div
                key={invite.id}
                className="border-brand-300 bg-brand-50 rounded-xl border p-4"
              >
                <p className="text-brand-900 text-sm">
                  {invite.message ?? "راهبر حلقه شما را دعوت کرده است."}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    loading={busy === "invite-accept"}
                    onClick={() => respondInvite(invite.id, "accept")}
                  >
                    پذیرش و پیوستن
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === "invite-decline"}
                    onClick={() => respondInvite(invite.id, "decline")}
                  >
                    رد دعوت
                  </Button>
                </div>
              </div>
            ))}
        </section>
      )}

      {circle.isFacilitator && circle.joinRequests.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            درخواست‌های عضویت
          </h2>
          <div className="space-y-3">
            {circle.joinRequests.map((request) => (
              <div
                key={request.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-foreground text-sm font-bold">
                      {request.displayName ?? "بی‌نام"}
                      {request.province && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          • {request.province}
                        </span>
                      )}
                    </p>
                    {request.message && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {request.message}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatRelativeTime(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {request.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          loading={busy === `review-${request.id}`}
                          onClick={() => reviewJoin(request.id, "approve")}
                        >
                          تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busy === `review-${request.id}`}
                          onClick={() => reviewJoin(request.id, "reject")}
                        >
                          رد
                        </Button>
                      </>
                    ) : (
                      <Badge tone="neutral">
                        {CIRCLE_JOIN_REQUEST_STATUS_LABELS[request.status]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          اعضا ({circle.members.length})
        </h2>
        {circle.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            هنوز عضوی به حلقه نپیوسته است.
          </p>
        ) : (
          <div className="space-y-2">
            {circle.members.map((member) => (
              <div
                key={member.id}
                className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <Link
                    href={`/users/${member.userId}`}
                    className="text-foreground hover:text-brand-700 text-sm font-semibold"
                  >
                    {member.displayName ?? "بی‌نام"}
                  </Link>
                  {member.province && (
                    <span className="text-muted-foreground text-xs">
                      {" "}
                      • {member.province}
                    </span>
                  )}
                </div>
                <Badge tone={member.role === "facilitator" ? "brand" : "neutral"}>
                  {CIRCLE_MEMBERSHIP_ROLE_LABELS[member.role]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-bold">جلسات و خروجی‌ها</h2>
          {circle.isMember && !isArchived && (
            <Button size="sm" variant="outline" onClick={() => setMeetingOpen(true)}>
              ثبت جلسه
            </Button>
          )}
        </div>
        {circle.meetings.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            هنوز جلسه‌ای ثبت نشده است. نخستین جلسه و خروجی آن را ثبت کنید.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {circle.meetings.map((meeting) => (
              <article
                key={meeting.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {meeting.title}
                  </h3>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(meeting.createdAt)}
                  </span>
                </div>
                {meeting.agenda && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    دستور جلسه: {meeting.agenda}
                  </p>
                )}
                {meeting.summary ? (
                  <p className="text-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
                    {meeting.summary}
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">
                    خروجی جلسه هنوز ثبت نشده است.
                  </p>
                )}
                {(meeting.isMine || circle.isFacilitator) && !isArchived && (
                  <div className="mt-3">
                    {editingMeetingId === meeting.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingSummary}
                          maxLength={2000}
                          rows={4}
                          onChange={(event) => setEditingSummary(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            loading={busy === `summary-${meeting.id}`}
                            onClick={() => saveSummary(meeting.id)}
                          >
                            ذخیره خروجی
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMeetingId(null)}
                          >
                            بستن
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMeetingId(meeting.id);
                          setEditingSummary(meeting.summary ?? "");
                        }}
                      >
                        {meeting.summary ? "ویرایش خروجی" : "ثبت خروجی"}
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="درخواست عضویت در حلقه"
        description={isFull ? "توجه: ظرفیت حلقه تکمیل است." : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="joinMessage" className={fieldLabelClass}>
              پیام به راهبر (اختیاری)
            </label>
            <Textarea
              id="joinMessage"
              value={joinMessage}
              maxLength={300}
              rows={3}
              placeholder="چرا می‌خواهید به این حلقه بپیوندید؟"
              onChange={(event) => setJoinMessage(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setJoinModalOpen(false)}>
              انصراف
            </Button>
            <Button loading={busy === "join"} onClick={requestJoin}>
              ارسال درخواست
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="دعوت عضو به حلقه"
        description="اعضای دارای «تمایل به همیاری» که در حلقه نیستند پیشنهاد می‌شوند."
      >
        <div className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              عضو دیگری برای دعوت در دسترس نیست.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="inviteUser" className={fieldLabelClass}>
                عضو
              </label>
              <Select
                id="inviteUser"
                placeholder="انتخاب عضو"
                value={inviteUserId}
                onChange={(event) => setInviteUserId(event.target.value)}
              >
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.displayName ?? "بی‌نام"}
                    {candidate.province ? ` — ${candidate.province}` : ""}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="inviteMessage" className={fieldLabelClass}>
              پیام دعوت (اختیاری)
            </label>
            <Textarea
              id="inviteMessage"
              value={inviteMessage}
              maxLength={300}
              rows={3}
              onChange={(event) => setInviteMessage(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              انصراف
            </Button>
            <Button
              disabled={!inviteUserId}
              loading={busy === "invite"}
              onClick={sendInvite}
            >
              ارسال دعوت
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        title="ثبت جلسه حلقه"
        description="جلسه را ثبت کنید؛ پس از برگزاری، خروجی آن را همین‌جا ذخیره می‌کنید."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="meetingTitle" className={fieldLabelClass}>
              عنوان جلسه
            </label>
            <Input
              id="meetingTitle"
              value={meetingTitle}
              maxLength={120}
              onChange={(event) => setMeetingTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="meetingAgenda" className={fieldLabelClass}>
              دستور جلسه (اختیاری)
            </label>
            <Textarea
              id="meetingAgenda"
              value={meetingAgenda}
              maxLength={800}
              rows={3}
              onChange={(event) => setMeetingAgenda(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="meetingSummary" className={fieldLabelClass}>
              خروجی جلسه (اختیاری — بعداً هم قابل ثبت است)
            </label>
            <Textarea
              id="meetingSummary"
              value={meetingSummary}
              maxLength={2000}
              rows={3}
              onChange={(event) => setMeetingSummary(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMeetingOpen(false)}>
              انصراف
            </Button>
            <Button loading={busy === "meeting"} onClick={createMeeting}>
              ثبت جلسه
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="انتقال راهبری"
        description="راهبری حلقه به عضو دیگری منتقل می‌شود و شما عضو عادی خواهید شد."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="transferMember" className={fieldLabelClass}>
              عضو جدید
            </label>
            <Select
              id="transferMember"
              placeholder="انتخاب عضو"
              value={transferMemberId}
              onChange={(event) => setTransferMemberId(event.target.value)}
            >
              {circle.members
                .filter((member) => member.role !== "facilitator")
                .map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName ?? "بی‌نام"}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>
              انصراف
            </Button>
            <Button
              disabled={!transferMemberId}
              loading={busy === "transfer"}
              onClick={transferLeadership}
            >
              انتقال راهبری
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}