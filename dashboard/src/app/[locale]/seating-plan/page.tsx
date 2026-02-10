import { getTables } from "@/actions/table-actions";
import { AddTableButton } from "@/components/seating/AddTableButton";
import { SeatingCanvas } from "@/components/seating/SeatingCanvas";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function SeatingPlanPage() {
  const t = await getTranslations("SeatingPlan");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Tables
  const { data: tables, error: tablesError } = await getTables();

  // 2. Fetch All Guests (to show in sidebar or on tables)
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", user.id);

  if (tablesError || guestsError) {
    console.error("Error loading seating plan data:", tablesError, guestsError);
    return (
      <div className='flex flex-col items-center justify-center h-full p-8 text-center space-y-4'>
        <h2 className='text-xl font-semibold text-red-500'>
          Une erreur est survenue
        </h2>
        <p className='text-muted-foreground'>
          Impossible de charger le plan de table.
        </p>
        {tablesError && (
          <p className='text-xs text-red-400 max-w-lg bg-red-50 p-2 rounded'>
            {typeof tablesError === "object"
              ? JSON.stringify(tablesError)
              : tablesError}
          </p>
        )}
      </div>
    );
  }

  const hasTables = tables && tables.length > 0;

  return (
    <div className='h-screen flex flex-col'>
      <header className='p-4 border-b bg-white flex justify-between items-center z-10 relative shadow-sm'>
        <div>
          <h1 className='text-2xl font-bold font-heading'>Plan de Table</h1>
          <p className='text-sm text-muted-foreground'>
            {hasTables
              ? "Glissez-déposez les tables et les invités."
              : "Commencez par créer votre première table."}
          </p>
        </div>
        <AddTableButton className='bg-primary text-secondary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition shadow-sm flex items-center' />
      </header>

      <div className='flex-1 overflow-hidden relative'>
        {!hasTables ? (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50'>
            <div className='bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-border'>
              <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='text-primary'
                >
                  <circle
                    cx='12'
                    cy='12'
                    r='10'
                  />
                  <path d='M12 8v8' />
                  <path d='M8 12h8' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold mb-2'>
                Votre salle est vide
              </h3>
              <p className='text-muted-foreground mb-6'>
                Créez des tables pour commencer à placer vos invités. Vous
                pourrez ensuite les déplacer librement.
              </p>
              <AddTableButton className='bg-primary text-secondary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition flex items-center mx-auto' />
            </div>
          </div>
        ) : (
          <SeatingCanvas
            initialTables={tables || []}
            initialGuests={guests || []}
          />
        )}
      </div>
    </div>
  );
}
