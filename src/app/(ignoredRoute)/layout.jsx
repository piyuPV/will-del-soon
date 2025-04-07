import React from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

function layout({ children }) {
  return (
    <SidebarProvider className="bg-[#F9ECCC]">
      <AppSidebar />
      <main className='w-full bg-[#F9ECCC] font-pixel'>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b-2 border-[#3E2723] bg-[#795548] px-4 shadow-[0_4px_0_#3E2723]">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="p-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

export default layout