import { getProject, getPurchases, saveProjectState } from "@/actions/project";
import { ModuleInstance, Project } from "@/types/builder";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

interface BuilderState {
  project: Project | null;
  selectedModuleId: string | null;
  isDragging: boolean;
  isLoading: boolean;

  // Actions
  loadProject: () => Promise<void>;
  saveProject: () => Promise<void>;

  setProject: (project: Project) => void;
  addModule: (type: string, index?: number) => void;
  removeModule: (id: string) => void;
  updateModuleContent: (id: string, content: Record<string, any>) => void;
  moveModule: (activeId: string, overId: string) => void;
  selectModule: (id: string | null) => void;
  setDragging: (isDragging: boolean) => void;
}

const DEFAULT_PROJECT: Project = {
  id: "new-project",
  userId: "guest",
  meta: {
    title: "My Wedding Website",
    coupleNames: "Alice & Bob",
    date: new Date().toISOString(),
    themeId: "default",
  },
  modules: [],
  status: "draft",
  paidModules: [],
};

// Debounce helper
let saveTimeout: NodeJS.Timeout;

export const useBuilderStore = create<BuilderState>((set, get) => ({
  project: null, // Start null to show loading
  selectedModuleId: null,
  isDragging: false,
  isLoading: true,

  loadProject: async () => {
    set({ isLoading: true });
    try {
      const { project, error } = await getProject();
      if (project) {
        // Also fetch purchases to mark paid modules
        const { items } = await getPurchases();
        const paidModuleIds =
          items
            ?.filter((p: any) => p.item_type === "module")
            .map((p: any) => p.item_id) || [];

        set({
          project: { ...project, paidModules: paidModuleIds },
          isLoading: false,
        });
      } else {
        console.error("Failed to load project:", error);
        // Fallback for dev/demo if no auth
        set({ project: DEFAULT_PROJECT, isLoading: false });
      }
    } catch (e) {
      console.error(e);
      set({ project: DEFAULT_PROJECT, isLoading: false });
    }
  },

  saveProject: async () => {
    const { project } = get();
    if (!project || project.id === "new-project") return;

    // Save only necessary state
    const stateToSave = {
      modules: project.modules,
    };

    await saveProjectState(project.id, stateToSave);
  },

  setProject: (project) => set({ project }),

  addModule: (type, index) => {
    set((state) => {
      if (!state.project) return state;

      const newModule: ModuleInstance = {
        id: uuidv4(),
        type: type as any,
        content: {},
      };

      const newModules = [...state.project.modules];
      if (index !== undefined && index >= 0) {
        newModules.splice(index, 0, newModule);
      } else {
        newModules.push(newModule);
      }

      return {
        project: {
          ...state.project,
          modules: newModules,
        },
        selectedModuleId: newModule.id,
      };
    });

    // Auto-save
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveProject(), 2000);
  },

  removeModule: (id) => {
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          modules: state.project.modules.filter((m) => m.id !== id),
        },
        selectedModuleId:
          state.selectedModuleId === id ? null : state.selectedModuleId,
      };
    });
    get().saveProject();
  },

  updateModuleContent: (id, content) => {
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          modules: state.project.modules.map((m) =>
            m.id === id ? { ...m, content: { ...m.content, ...content } } : m,
          ),
        },
      };
    });

    // Auto-save debounce
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => get().saveProject(), 2000);
  },

  moveModule: (activeId, overId) => {
    set((state) => {
      if (!state.project) return state;
      const oldIndex = state.project.modules.findIndex(
        (m) => m.id === activeId,
      );
      const newIndex = state.project.modules.findIndex((m) => m.id === overId);

      return {
        project: {
          ...state.project,
          modules: arrayMove(state.project.modules, oldIndex, newIndex),
        },
      };
    });
    get().saveProject();
  },

  selectModule: (id) => set({ selectedModuleId: id }),
  setDragging: (isDragging) => set({ isDragging }),
}));
