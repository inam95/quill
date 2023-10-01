import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";

interface ProductPageProps {
  params: {
    fileId: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { fileId } = params;
  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileId}`);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId: user.id,
    },
  });

  if (!file) notFound();

  return (
    <div>
      <h1>{fileId}</h1>
    </div>
  );
}
