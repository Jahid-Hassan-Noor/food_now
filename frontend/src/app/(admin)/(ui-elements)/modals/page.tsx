import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DefaultModal from "@/components/modals/DefaultModal";
import FormInModal from "@/components/modals/FormInModal";
import FullScreenModal from "@/components/modals/FullScreenModal";
import ModalBasedAlerts from "@/components/modals/ModalBasedAlerts";
import VerticallyCenteredModal from "@/components/modals/VerticallyCenteredModal";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Modals | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Modals page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Modals() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Modals" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
        <DefaultModal />
        <VerticallyCenteredModal />
        <FormInModal />
        <FullScreenModal />
        <ModalBasedAlerts />
      </div>
    </div>
  );
}
