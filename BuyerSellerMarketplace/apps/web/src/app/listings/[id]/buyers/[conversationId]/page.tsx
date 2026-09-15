'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Thread } from '@/components/Thread';

export default function SellerThreadPage() {
  const { id, conversationId } = useParams<{ id: string; conversationId: string }>();

  return (
    <div className="py-8">
      <Link href={`/listings/${id}/buyers`} className="text-sm font-medium text-brand">
        ← Back to interested buyers
      </Link>
      <Thread conversationId={conversationId} />
    </div>
  );
}
