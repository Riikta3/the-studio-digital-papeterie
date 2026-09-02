import { listMenu } from "@/actions/menu-actions";
import { MenuEditor } from "@/components/jour-j/menu/MenuEditor";

export default async function MenuPage() {
  const menu = await listMenu();
  return <MenuEditor initialMenu={menu} />;
}
