// src/app/(admin)/(dashboards)/chef/page.tsx

"use client";
import { ChefMetrics } from "@/components/dashboard/ChefMetrics";
import React, { useState, useEffect } from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { withAuth } from '@/utils/withAuth';
import { apiFetch } from "@/utils/api"; // Assuming you have an apiFetch utility for API calls
import { useRouter } from 'next/navigation';
import Loading from "@/app/loading";

const ChefDashboard = () => {
  const [metricesData, setMetricesData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    document.title = "Chef Dashboard | Food Now";

    const fetchData = async () => {
      try {
        const res = await apiFetch("/chef_dashboard/"); // Example endpoint
        setMetricesData(res.metrices);
        setLoading(false);
        console.log("Dashboard data loaded successfully:", res.metrices);
      } catch (err) {
        if (err instanceof Error) {
          console.log("Failed to load dashboard data:", err);
          setLoading(false);
          // Optionally, you can set an error state here to display an error message in the UI
          // router.push('/login'); // Redirect to login on error
          router.push(`/login?error=${encodeURIComponent(err.message)}`);
        } else {
          // router.push(`/login?error=${encodeURIComponent(err)}`);
          console.log("Failed to load dashboard data:", err);
        }
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <ChefMetrics data = {metricesData} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <RecentOrders />
      </div>
    </div>
  );
}

export default withAuth(ChefDashboard, 'chef');
// export default ChefDashboard;