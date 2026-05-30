'use client';

import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';

export function Navbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger: 'px-3 py-2 rounded-lg border text-sm',
            },
          }}
        />
      </div>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </header>
  );
}
