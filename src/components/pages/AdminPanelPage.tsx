"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminArticles } from "@/components/admin/AdminArticles";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminComments } from "@/components/admin/AdminComments";
import { AdminMessages } from "@/components/admin/AdminMessages";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminSystem } from "@/components/admin/AdminSystem";
import { AdminAggregator } from "@/components/admin/AdminAggregator";
import { AdminLearning } from "@/components/admin/AdminLearning";
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  Users,
  MessageSquare,
  Mail,
  Settings,
  LogOut,
  Home,
  User,
  Server,
  Radar,
  BookOpen,
} from "lucide-react";
import { cn, userRoleLabels } from "@/lib/utils";

type AdminSection =
  | "dashboard"
  | "articles"
  | "aggregator"
  | "aggregator-rules"
  | "aggregator-logs"
  | "aggregator-settings"
  | "learning"
  | "categories"
  | "users"
  | "comments"
  | "messages"
  | "settings"
  | "system";

export function AdminPanelPage() {
  const { user, navigate, loadingUser } = useStore();
  const { logout } = useAuth();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate("auth");
    } else if (
      !loadingUser &&
      user &&
      user.role !== "ADMIN" &&
      user.role !== "EDITOR"
    ) {
      navigate("home");
    }
  }, [user, loadingUser, navigate]);

  if (loadingUser) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-secondary rounded-xl" />
          <div className="h-96 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-64 bg-sidebar border-l border-sidebar-border lg:min-h-screen sticky top-16 lg:top-16 z-30">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center text-primary-foreground font-bold">
                ر
              </div>
              <div>
                <div className="font-bold text-sidebar-foreground text-sm">
                  راهکار جوان
                </div>
                <div className="text-[10px] text-muted-foreground">
                  پنل مدیریت
                </div>
              </div>
            </div>
          </div>

          {/* User greeting */}
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-xs text-muted-foreground mb-1">خسته نباشید،</p>
            <p className="text-sm font-bold text-sidebar-foreground">
              {user.displayName || user.name}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
              {userRoleLabels[user.role]}
            </div>
          </div>

          {/* Nav */}
          <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            <NavButton
              active={section === "dashboard"}
              onClick={() => setSection("dashboard")}
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="داشبورد"
            />

            <GroupLabel label="محتوا" />
            <NavButton
              active={section === "articles"}
              onClick={() => setSection("articles")}
              icon={<Newspaper className="h-4 w-4" />}
              label="اخبار و مقالات"
            />

            <GroupLabel label="خودکارسازی خبر" />
            <NavButton
              active={section === "aggregator"}
              onClick={() => setSection("aggregator")}
              icon={<Radar className="h-4 w-4" />}
              label="منابع خبر"
            />
            <NavButton
              active={section === "aggregator-rules"}
              onClick={() => setSection("aggregator-rules")}
              icon={<Radar className="h-4 w-4" />}
              label="قوانین پاکسازی"
            />
            <NavButton
              active={section === "aggregator-logs"}
              onClick={() => setSection("aggregator-logs")}
              icon={<Radar className="h-4 w-4" />}
              label="گزارش‌ها"
            />
            <NavButton
              active={section === "aggregator-settings"}
              onClick={() => setSection("aggregator-settings")}
              icon={<Radar className="h-4 w-4" />}
              label="تنظیمات تجمیع"
            />
            <NavButton
              active={section === "learning"}
              onClick={() => setSection("learning")}
              icon={<BookOpen className="h-4 w-4" />}
              label="یادگیری"
            />

            {user.role === "ADMIN" && (
              <>
                <GroupLabel label="مدیریت" />
                <NavButton
                  active={section === "categories"}
                  onClick={() => setSection("categories")}
                  icon={<FolderTree className="h-4 w-4" />}
                  label="دسته‌بندی‌ها"
                />
                <NavButton
                  active={section === "comments"}
                  onClick={() => setSection("comments")}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="نظرات"
                />
                <NavButton
                  active={section === "messages"}
                  onClick={() => setSection("messages")}
                  icon={<Mail className="h-4 w-4" />}
                  label="پیام‌ها"
                />
                <NavButton
                  active={section === "users"}
                  onClick={() => setSection("users")}
                  icon={<Users className="h-4 w-4" />}
                  label="کاربران"
                />
                <NavButton
                  active={section === "settings"}
                  onClick={() => setSection("settings")}
                  icon={<Settings className="h-4 w-4" />}
                  label="تنظیمات"
                />
                <NavButton
                  active={section === "system"}
                  onClick={() => setSection("system")}
                  icon={<Server className="h-4 w-4" />}
                  label="وضعیت سیستم"
                />
              </>
            )}
          </nav>

          {/* Footer actions */}
          <div className="p-2 border-t border-sidebar-border mt-auto hidden lg:block">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent w-full"
            >
              <Home className="h-4 w-4" />
              <span>بازگشت به سایت</span>
            </button>
            <button
              onClick={() => navigate("profile")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent w-full"
            >
              <User className="h-4 w-4" />
              <span>پروفایل من</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {section === "dashboard" && <AdminDashboard />}
          {section === "articles" && <AdminArticles />}
          {section === "categories" && user.role === "ADMIN" && (
            <AdminCategories />
          )}
          {section === "users" && user.role === "ADMIN" && <AdminUsers />}
          {section === "comments" && <AdminComments />}
          {section === "messages" && user.role === "ADMIN" && <AdminMessages />}
          {section === "settings" && user.role === "ADMIN" && <AdminSettings />}
          {section === "system" && user.role === "ADMIN" && <AdminSystem />}
          {section === "aggregator" && (
            <AdminAggregator section="sources" categories={categories} />
          )}
          {section === "aggregator-rules" && (
            <AdminAggregator section="rules" categories={categories} />
          )}
          {section === "aggregator-logs" && (
            <AdminAggregator section="logs" categories={categories} />
          )}
          {section === "aggregator-settings" && (
            <AdminAggregator section="settings" categories={categories} />
          )}
          {section === "learning" && <AdminLearning />}
        </main>
      </div>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-right shrink-0",
        active
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Section divider/label for the sidebar grouping (always visible)
function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground shrink-0 lg:w-full">
      {label}
    </div>
  );
}
