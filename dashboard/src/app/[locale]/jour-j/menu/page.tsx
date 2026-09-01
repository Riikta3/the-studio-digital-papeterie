import { MenuEditor } from "@/components/jour-j/menu/MenuEditor";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function MenuPage() {
  return <MenuEditor initialMenu={JOUR_J_MOCK.menu} />;
}
