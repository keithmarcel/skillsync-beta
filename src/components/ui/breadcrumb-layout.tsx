'use client'

import React from 'react'
import Breadcrumb, { BreadcrumbItem } from './breadcrumb'

interface BreadcrumbLayoutProps {
  items: BreadcrumbItem[]
  children: React.ReactNode
}

/**
 * Standardized breadcrumb layout component that enforces consistent spacing:
 * - 40px spacing below PageHeader
 * - Breadcrumbs
 * - 40px spacing below breadcrumbs  
 * - Separator line
 * - 40px spacing below separator
 * - Main content
 */
export default function BreadcrumbLayout({ items, children }: BreadcrumbLayoutProps) {
  return (
    <>
      {/* 40px spacing below header */}
      <div className="h-10"></div>

      {/* Breadcrumbs */}
      <div className="max-w-[1280px] mx-auto px-6">
        <Breadcrumb items={items} />
      </div>

      {/* 40px spacing below breadcrumbs */}
      <div className="h-10"></div>

      {/* Separator */}
      <div className="max-w-[1280px] mx-auto px-6">
        <hr className="border-gray-200" />
      </div>

      {/* 40px spacing below separator */}
      <div className="h-10"></div>
      
      {/* Main content */}
      <div className="max-w-[1280px] mx-auto px-6">
        {children}
      </div>
    </>
  )
}
