"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Download,
    Menu,
    Search,
    Settings
} from "lucide-react";
import { useModals } from "./Modals";

interface HeaderProps {
    setSidebarCollapsed: (collapsed: (e: boolean) => boolean) => void;
}

export default function Header({setSidebarCollapsed}: HeaderProps) {
    const {setOpenModal} = useModals();
    return (
        <header className="bg-white border-b border-slate-200">
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Desktop Sidebar Toggle - Always visible */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed((e) => !e)}
                        className="flex hover:bg-slate-100 transition-colors relative"
                    // title={`${sidebarCollapsed ? "Open" : "Close"} sidebar (Ctrl+B)`}
                    >
                        <Menu className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Desktop Search */}
                    <div className="relative block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search endpoints..."
                            className="pl-10 w-48 lg:w-64 bg-slate-50 border-slate-200"
                        //   value={searchQuery}
                        //   onChange={(e) => {
                        //     setSearchQuery(e.target.value)
                        //     performSearch(e.target.value)
                        //   }}
                          onFocus={() => setOpenModal("search")}
                        />
                    </div>

                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => setOpenModal('auth')}
                    >
                        <Settings className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Auth</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
