'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Thread } from '@/components/Thread';

export default function BuyerThreadPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-8">
      <Link href="/buyer/messages" className="text-sm font-medium text-brand">
        ← Back to messages
      </Link>
      <Thread conversationId={id} />
    </div>
  );
}
