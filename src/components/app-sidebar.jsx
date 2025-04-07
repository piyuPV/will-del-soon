"use client";

import * as React from "react";
import Link from "next/link";
import { Layout, CandyOff, User, Dumbbell, BicepsFlexed } from "lucide-react";
import { NavMain } from "@/components/NavMain";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./Navuser";

// This is sample data.
const data = {
  user: {
    name: "FITfreak",
    email: "FITfreak@devinefit.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: Layout,
    },
    {
      name: "Posture",
      url: "/posture",
      icon: Dumbbell,
    },
    {
      name: "Diet Plan",
      url: "/dietplan",
      icon: CandyOff,
    },
    {
      name: "Profile",
      url: "/profile",
      icon: User,
    },

  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton className=" text-lg ">
          <Link href="/" className="flex items-center space-x-2">
            {/* <item.icon /> */}
            <BicepsFlexed />
            <span>DeVine Fit</span>
          </Link>
        </SidebarMenuButton>

      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
