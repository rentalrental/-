import { FriendMenu } from "@/components/FriendMenu";

export default async function FriendMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FriendMenu slug={slug} />;
}
