// src/app/(admin)/(dashboards)/admin/page.tsx

"use client";
import { AdminMetrics } from "@/components/dashboard/AdminMetrics";
import React, { useState, useEffect } from "react";
import MonthlyTarget from "@/components/dashboard/MonthlyTarget";
import { withAuth } from '@/utils/withAuth';

// export default function AdminDashboard() {
const AdminDashboard = () => {
  useEffect(() => {
    document.title = "Admin Dashboard | Food Now";
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <AdminMetrics />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, 'admin');