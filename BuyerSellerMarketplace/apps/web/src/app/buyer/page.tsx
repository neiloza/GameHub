import { redirect } from 'next/navigation';

// `/buyer` on its own is not a screen. Send them to the one thing they came for.
export default function BuyerIndexPage() {
  redirect('/buyer/discover');
}
