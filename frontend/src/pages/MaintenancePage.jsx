import { WrenchIcon } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="border border-primary/25 flex flex-col w-full max-w-2xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <WrenchIcon className="size-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Website Under Maintenance</h1>
          <p className="text-lg opacity-70">
            We're currently performing some maintenance on our site. Please check back soon!
          </p>
          <p className="text-sm opacity-50">
            We apologize for any inconvenience this may cause.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
