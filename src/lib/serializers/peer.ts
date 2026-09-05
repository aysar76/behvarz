import type {
  PeerCooperationStatus,
  PeerHelpRequestStatus,
  PeerOfferInitiator,
  PeerOfferStatus,
  ProblemBarrierType,
} from "@/generated/prisma/client";

export interface PeerUserRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
}

export interface PeerOfferRow {
  id: string;
  helperId: string;
  initiator: PeerOfferInitiator;
  message: string | null;
  status: PeerOfferStatus;
  createdAt: Date;
  helper: PeerUserRow;
}

export interface PeerCooperationRow {
  id: string;
  helpRequestId: string | null;
  requesterId: string;
  helperId: string;
  goal: string | null;
  status: PeerCooperationStatus;
  outcomeSummary: string | null;
  requesterRating: number | null;
  helperRating: number | null;
  completedAt: Date | null;
  createdAt: Date;
  requester: PeerUserRow;
  helper: PeerUserRow;
}

export interface PeerMessageRow {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
  sender: { id: string; displayName: string | null };
}

export interface PeerHelpRequestRow {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  barrierType: ProblemBarrierType;
  tags: unknown | null;
  province: string | null;
  status: PeerHelpRequestStatus;
  createdAt: Date;
  requester: PeerUserRow;
  offers?: PeerOfferRow[];
  cooperations?: PeerCooperationRow[];
  _count?: { offers: number };
}

export interface SerializedPeerOffer {
  id: string;
  helperId: string;
  initiator: PeerOfferInitiator;
  message: string | null;
  status: PeerOfferStatus;
  createdAt: string;
  helper: PeerUserRow;
  isMine: boolean;
}

export interface SerializedPeerCooperation {
  id: string;
  requesterId: string;
  helperId: string;
  goal: string | null;
  status: PeerCooperationStatus;
  outcomeSummary: string | null;
  requesterRating: number | null;
  helperRating: number | null;
  completedAt: string | null;
  createdAt: string;
  requester: PeerUserRow;
  helper: PeerUserRow;
}

export interface SerializedPeerMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderLabel: string;
  isMine: boolean;
}

export interface SerializedPeerHelpRequest {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  barrierType: ProblemBarrierType;
  tags: string[];
  province: string | null;
  status: PeerHelpRequestStatus;
  createdAt: string;
  requester: PeerUserRow;
  offerCount: number;
  offers: SerializedPeerOffer[];
  cooperations: SerializedPeerCooperation[];
  isRequester: boolean;
}

export interface SerializePeerHelpRequestOptions {
  currentUserId: string;
}

export function serializePeerHelpRequest(
  row: PeerHelpRequestRow,
  options: SerializePeerHelpRequestOptions,
): SerializedPeerHelpRequest {
  const tagValues = Array.isArray(row.tags)
    ? row.tags.filter(
        (tag): tag is string => typeof tag === "string",
      )
    : [];

  return {
    id: row.id,
    requesterId: row.requesterId,
    title: row.title,
    description: row.description,
    barrierType: row.barrierType,
    tags: tagValues,
    province: row.province,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    requester: row.requester,
    offerCount: row._count?.offers ?? row.offers?.length ?? 0,
    offers: (row.offers ?? []).map((offer) => ({
      id: offer.id,
      helperId: offer.helperId,
      initiator: offer.initiator,
      message: offer.message,
      status: offer.status,
      createdAt: offer.createdAt.toISOString(),
      helper: offer.helper,
      isMine: offer.helperId === options.currentUserId,
    })),
    cooperations: (row.cooperations ?? []).map(serializePeerCooperation),
    isRequester: row.requesterId === options.currentUserId,
  };
}

export function serializePeerCooperation(
  row: PeerCooperationRow,
): SerializedPeerCooperation {
  return {
    id: row.id,
    requesterId: row.requesterId,
    helperId: row.helperId,
    goal: row.goal,
    status: row.status,
    outcomeSummary: row.outcomeSummary,
    requesterRating: row.requesterRating,
    helperRating: row.helperRating,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    requester: row.requester,
    helper: row.helper,
  };
}

export function serializePeerMessage(
  row: PeerMessageRow,
  currentUserId: string,
): SerializedPeerMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    senderLabel: row.sender.displayName ?? "بی‌نام",
    isMine: row.senderId === currentUserId,
  };
}