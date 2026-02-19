import { useBuilderStore } from "@/lib/store";
import { Check, ShoppingBag, X } from "lucide-react";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PublishModal = ({
  isOpen,
  onClose,
  onConfirm,
}: PublishModalProps) => {
  const project = useBuilderStore((state) => state.project);

  if (!isOpen) return null;

  // Identify Premium modules used in the project
  // In a real app, we'd cross-reference with a registry to know which types are premium
  // For now, let's assume 'rsvp' is premium based on our earlier Sidebar code
  // or checks strictly if the module instance has isPremium flag (which we set in Sidebar addModule)

  // NOTE: In our current implementation of addModule in store.ts, we didn't explicitly set isPremium.
  // We should ideally pass that info.
  // Let's assume for this mock that any module with type 'rsvp' is premium.
  const premiumTypes = ["rsvp", "interactive-seating"];

  const usedPremiumModules = project.modules.filter((m) =>
    premiumTypes.includes(m.type),
  );

  const unpaidModules = usedPremiumModules.filter(
    (m) => !project.paidModules.includes(m.id),
  );

  const totalCost = unpaidModules.length * 29; // Mock price: 29€ per premium module

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-bold text-gray-900'>Publish Website</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X size={24} />
          </button>
        </div>

        {unpaidModules.length > 0 ? (
          <div className='space-y-4'>
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3'>
              <ShoppingBag className='text-amber-600 shrink-0' />
              <div>
                <p className='text-sm font-medium text-amber-800'>
                  Premium Features Detected
                </p>
                <p className='text-sm text-amber-700 mt-1'>
                  Your design uses <strong>{unpaidModules.length}</strong>{" "}
                  premium module(s) that haven't been purchased yet.
                </p>
              </div>
            </div>

            <ul className='divide-y divide-gray-100'>
              {unpaidModules.map((m, i) => (
                <div
                  key={i}
                  className='py-2 flex justify-between text-sm'
                >
                  <span className='text-gray-600 capitalize'>
                    {m.type.replace("-", " ")} Module
                  </span>
                  <span className='font-medium text-gray-900'>29.00€</span>
                </div>
              ))}
              <div className='py-3 flex justify-between font-bold text-black border-t border-gray-100 mt-2'>
                <span>Total to Pay</span>
                <span>{totalCost.toFixed(2)}€</span>
              </div>
            </ul>

            <button
              onClick={() => {
                alert("Simulating Payment Gateway...");
                onConfirm();
              }}
              className='w-full py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2'
            >
              Pay & Publish
            </button>
          </div>
        ) : (
          <div className='space-y-6 text-center'>
            <div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto'>
              <Check size={32} />
            </div>
            <div>
              <p className='text-lg font-medium text-gray-900'>
                Ready to go live?
              </p>
              <p className='text-gray-500 mt-2'>
                Your website is drafted and ready. No additional payment is
                required.
              </p>
            </div>
            <button
              onClick={onConfirm}
              className='w-full py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors'
            >
              Publish Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
