import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLayoutClient } from "./admin-layout-client";
import { getAdminRobotsMetadata } from "@/lib/robots-metadata";

export const metadata: Metadata = {
  robots: getAdminRobotsMetadata(),
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
