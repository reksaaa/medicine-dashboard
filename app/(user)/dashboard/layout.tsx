import { authOptions } from "@/app/auth";
import { Sidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}