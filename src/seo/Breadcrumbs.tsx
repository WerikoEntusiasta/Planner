import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  item: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  lang?: 'pt-BR' | 'en';
}

export default function Breadcrumbs({ items, lang = 'pt-BR' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="my-4 py-2 px-4 rounded-lg bg-panel-card/60 border border-panel-border/60 text-xs font-mono text-zinc-400 overflow-x-auto">
      <ol className="flex items-center space-x-2 whitespace-nowrap">
        <li>
          <a href={lang === 'en' ? '/en' : '/'} className="flex items-center gap-1 hover:text-accent-purple transition-colors">
            <Home size={12} />
            <span>{lang === 'en' ? 'Home' : 'Início'}</span>
          </a>
        </li>
        {items.map((b, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight size={12} className="text-zinc-600" />
              {isLast ? (
                <span className="text-white font-bold" aria-current="page">
                  {b.name}
                </span>
              ) : (
                <a href={b.item} className="hover:text-accent-purple transition-colors">
                  {b.name}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
