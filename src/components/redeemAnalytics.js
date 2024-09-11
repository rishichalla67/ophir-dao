import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import allowedAddresses from "../auth/security.json"; // Adjust the path as necessary
import { tokenMappings } from "../helper/tokenMappings";
import { daoConfig } from "../helper/daoConfig";
import { tokenImages } from "../helper/tokenImages";
import "../App.css";

const truncateAddress = (address) => {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatAmount = (amount, denom, prices) => {
  const tokenInfo = tokenMappings[denom];
  if (tokenInfo) {
    const formattedAmount = (amount / Math.pow(10, tokenInfo.decimals)).toFixed(
      6
    );
    const price = prices[tokenInfo.symbol];
    const value = price ? (formattedAmount * price).toFixed(2) : null;
    return { amount: `${formattedAmount} ${tokenInfo.symbol}`, value };
  }
  return { amount: `${amount} ${denom}`, value: null };
};

const TokenIcon = ({ denom, size = 24 }) => {
  const tokenInfo = tokenMappings[denom];
  const symbol = tokenInfo ? tokenInfo.symbol : "";
  const imageUrl = tokenImages[symbol];

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={symbol}
      className="inline-block mr-2 rounded-full"
      width={size}
      height={size}
    />
  );
};

const ToggleableAmount = ({ amount, value }) => {
  const [showValue, setShowValue] = useState(false);

  const toggleDisplay = () => setShowValue(!showValue);

  return (
    <span onClick={toggleDisplay} className="cursor-pointer hover:underline">
      {showValue && value ? `$${value}` : amount}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
    <h2 className="text-center text-white text-xl font-semibold">Loading...</h2>
    <p className="w-1/3 text-center text-white">
      This may take a few seconds, please don't close this page.
    </p>
  </div>
);

const RedemptionAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState("redeemed"); // 'redeemed' or 'fees'

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [analyticsResponse, pricesResponse] = await Promise.all([
        fetch("https://parallax-analytics.onrender.com/ophir/redeemAnalytics"),
        fetch("https://parallax-analytics.onrender.com/ophir/prices"),
      ]);

      if (!analyticsResponse.ok || !pricesResponse.ok) {
        throw new Error(
          `HTTP error! status: ${analyticsResponse.status}, ${pricesResponse.status}`
        );
      }

      const analyticsResult = await analyticsResponse.json();
      const pricesResult = await pricesResponse.json();

      setData(analyticsResult);
      setPrices(pricesResult);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateAssetValue = (asset, prices) => {
    const tokenInfo = tokenMappings[asset.denom];
    if (tokenInfo) {
      const amount = asset.amount / Math.pow(10, tokenInfo.decimals);
      const price = prices[tokenInfo.symbol] || 0;
      return amount * price;
    }
    return 0;
  };

  const calculateTotalValue = (redemptions) => {
    return redemptions.reduce((total, redemption) => {
      if (redemption.receivedAssets) {
        return (
          total +
          redemption.receivedAssets.reduce((assetTotal, asset) => {
            return assetTotal + calculateAssetValue(asset, prices);
          }, 0)
        );
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">No Data!</strong>
          <span className="block sm:inline">
            {" "}
            No data is currently available.
          </span>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    );
  }

  const { redeemSummary, uniqueRedeemers, totalRedemptions } = data;

  const chartData = Object.entries(redeemSummary).map(([address, info]) => {
    const totalValue = calculateTotalValue(info.redemptions);
    return {
      address: truncateAddress(address),
      totalRedeemed: parseFloat(info.totalRedeemed.toFixed(3)),
      totalFees: parseFloat(info.totalFees.toFixed(3)),
      feePercentage: (
        (info.totalFees / (info.totalRedeemed + info.totalFees)) *
        100
      ).toFixed(2),
      totalValue: totalValue.toFixed(2),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">{`Address: ${label}`}</p>
          <p>{`${payload[0].name}: ${payload[0].value.toFixed(3)}`}</p>
          {chartView === "fees" && (
            <p>{`Fee Percentage: ${payload[0].payload.feePercentage}%`}</p>
          )}
          <p>{`Total Value: $${payload[0].payload.totalValue}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container sm:mt-16 mx-auto p-4">
      {refreshing && <LoadingSpinner />}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">
          Redemption Analytics Dashboard
        </h1>
        <button
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Unique Redeemers</h2>
          <p className="text-3xl font-bold">{uniqueRedeemers}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Total Redemptions</h2>
          <p className="text-3xl font-bold">{totalRedemptions}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Total Redeemed Value</h2>
          <p className="text-3xl font-bold">
            <ToggleableAmount
              amount={`${Object.values(redeemSummary)
                .reduce((sum, info) => sum + info.totalRedeemed, 0)
                .toFixed(3)} OPHIR`}
              value={chartData
                .reduce((sum, item) => sum + parseFloat(item.totalValue), 0)
                .toFixed(2)}
            />
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Redemptions by Address</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartView("redeemed")}
              className={`px-3 py-1 rounded ${
                chartView === "redeemed"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Redeemed
            </button>
            <button
              onClick={() => setChartView("fees")}
              className={`px-3 py-1 rounded ${
                chartView === "fees" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Fees
            </button>
          </div>
        </div>
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="address" tick={{ fontSize: 12 }} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey={
                  chartView === "redeemed" ? "totalRedeemed" : "totalFees"
                }
                fill={chartView === "redeemed" ? "#8884d8" : "#82ca9d"}
                name={
                  chartView === "redeemed" ? "Total Redeemed" : "Total Fees"
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(redeemSummary).map(([address, info]) => (
          <div key={address} className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2 break-all">
              {truncateAddress(address)}
            </h2>
            <p>
              <strong>Total Redeemed:</strong>{" "}
              <ToggleableAmount
                amount={`${info.totalRedeemed.toFixed(3)} OPHIR`}
                value={calculateTotalValue(info.redemptions).toFixed(2)}
              />
            </p>
            <p>
              <strong>Total Fees:</strong> {info.totalFees.toFixed(3)} OPHIR
            </p>
            <h4 className="font-semibold mt-4 mb-2">Redemption History:</h4>
            {info.redemptions.map((redemption, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-100 rounded">
                <p>
                  <strong>Amount:</strong>{" "}
                  {redemption.redeemedAmount.toFixed(3)} OPHIR
                </p>
                <p>
                  <strong>Fee:</strong> {redemption.feeAmount.toFixed(3)} OPHIR
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(redemption.timestamp).toLocaleString()}
                </p>
                {redemption.receivedAssets && (
                  <div>
                    <h5 className="font-semibold mt-2 mb-1">
                      Received Assets:
                    </h5>
                    <ul className="list-disc pl-5">
                      {redemption.receivedAssets.map((asset, assetIndex) => {
                        const { amount, value } = formatAmount(
                          asset.amount,
                          asset.denom,
                          prices
                        );
                        return (
                          <li
                            key={assetIndex}
                            className="flex items-center mb-1"
                          >
                            <TokenIcon denom={asset.denom} />
                            <ToggleableAmount amount={amount} value={value} />
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 font-semibold">
                      Total Value: $
                      {redemption.receivedAssets
                        .reduce(
                          (total, asset) =>
                            total + calculateAssetValue(asset, prices),
                          0
                        )
                        .toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RedemptionAnalyticsDashboard;
