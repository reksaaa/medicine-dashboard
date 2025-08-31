import { Suspense } from "react";
import ProfilePage from "@/components/profile/ProfilePage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import prisma from "@/lib/prisma";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null; // or return a placeholder if needed
  }

  const userEmail = session.user?.email;

  if (!userEmail) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {user && <ProfilePage user={user} />}
    </Suspense>
  );
}
