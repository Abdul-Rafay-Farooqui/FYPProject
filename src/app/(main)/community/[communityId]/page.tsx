"use client";

import { useParams } from "next/navigation";
import CommunityView from "@/components/communities/CommunityView";

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  return <CommunityView communityId={communityId} />;
}
