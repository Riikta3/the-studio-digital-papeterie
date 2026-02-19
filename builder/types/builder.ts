// --- Module System ---

export type ModuleType =
  | "hero"
  | "text"
  | "image-text"
  | "gallery"
  | "rsvp"
  | "schedule"
  | "faq";

export type ModuleCategory = "basics" | "media" | "interactive" | "layout";

export interface ModuleDefinition {
  type: ModuleType;
  label: string;
  description: string;
  category: ModuleCategory;
  icon: React.ComponentType<{ className?: string }>;
  isPremium: boolean;
  defaultContent: Record<string, any>;
  component: React.ComponentType<ModuleProps>;
}

export interface ModuleProps {
  id: string; // The instance ID
  content: Record<string, any>;
  isEditing?: boolean;
}

// --- Project Data ---

export interface ModuleInstance {
  id: string;
  type: ModuleType;
  content: Record<string, any>;
  isPremium?: boolean;
}

export interface ProjectMeta {
  title: string;
  coupleNames: string;
  date: string; // ISO String
  themeId: string;
}

export interface Project {
  id: string;
  userId: string;
  meta: ProjectMeta;
  modules: ModuleInstance[];
  status: "draft" | "published";
  paidModules: string[];
}
