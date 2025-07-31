import React from "react";
import SummaryCards from "../pages/summaryCards";
import StockTable from "../pages/stockTable";
import TransactionsTable from "../pages/transactionsTable";

const DashboardPage = () => {
  return (
    <div className="space-y-8 pt-16 md:ml-64 p-4">
      <h1 className="text-2xl text-center">
        Dashboard
      </h1>
      <SummaryCards />
      <StockTable />
      <div className="-ml-67 -mt-20">
      <TransactionsTable />
      </div>
    </div>
  );
};

export default DashboardPage;
