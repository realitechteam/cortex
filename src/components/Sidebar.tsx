'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, FileText, MessageSquare, Lightbulb } from 'lucide-react';

const navItems = [
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Insights', href: '/insights', icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-cortex-dark-800 border-r border-cortex-dark-700 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-cortex-dark-700">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cortex-blue-500/20">
            <Brain className="w-5 h-5 text-cortex-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Cortex
            </h1>
            <p className="text-[11px] leading-tight text-gray-500 font-medium">
              Document Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cortex-blue-500/20 text-cortex-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-cortex-dark-700'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-cortex-dark-700">
        <p className="text-[11px] text-gray-600 font-medium">
          Powered by{' '}
          <span className="text-gray-500">Claude</span>
        </p>
      </div>
    </aside>
  );
}
