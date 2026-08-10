"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  return <ChatWindow conversationId={conversationId} />;
}
