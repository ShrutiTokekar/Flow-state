import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Consistent title row used at the top of each logged-in page. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6">
    <div className="min-w-0">
      <h1 className="font-heading text-3xl sm:text-4xl text-flow-purple leading-tight">{title}</h1>
      {subtitle && <p className="text-sm sm:text-base text-gray-600 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export default PageHeader;
