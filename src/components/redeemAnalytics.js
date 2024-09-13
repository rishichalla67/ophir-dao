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
import { useNavigate } from "react-router-dom";
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
  <div className="flex flex-col justify-center items-center h-screen">
    <div className="text-white mb-4">Fetching On-Chain Data...</div>
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
  </div>
);

const RedemptionAnalyticsDashboard = () => {
  const navigate = useNavigate();

  const [isSpinning, setIsSpinning] = useState(false);
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState("redeemed"); // 'redeemed' or 'fees'\
  const [averageRedemptionPrice, setAverageRedemptionPrice] = useState(0);
  const [totalOphirRedeemed, setTotalOphirRedeemed] = useState(0);
  const [totalRedeemedValue, setTotalRedeemedValue] = useState(0.0);
  const [showDetailedAvgPrice, setShowDetailedAvgPrice] = useState(false);
  const [totalFees, setTotalFees] = useState(0);
  const [averageFeePercentage, setAverageFeePercentage] = useState(0);
  const [showTotalFees, setShowTotalFees] = useState(true);

  const [refreshAvailable, setRefreshAvailable] = useState(true);

  const handleClick = () => {
    navigate("/redeem");
  };

  const handleRefreshClick = () => {
    if (refreshAvailable && !isSpinning) {
      setIsSpinning(true);
      fetchData().finally(() => {
        setTimeout(() => setIsSpinning(false), 1000); // Ensure the icon spins for at least 1 second
      });
    }
  };

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

  const calculateTotalFees = (redeemSummary) => {
    let fees = 0;
    Object.values(redeemSummary).forEach((info) => {
      fees += info.totalFees;
    });
    return fees;
  };

  const calculateAverageFeePercentage = (redeemSummary) => {
    let totalFees = 0;
    let totalRedeemed = 0;
    Object.values(redeemSummary).forEach((info) => {
      totalFees += info.totalFees;
      totalRedeemed += info.totalRedeemed;
    });
    return (totalFees / (totalRedeemed + totalFees)) * 100;
  };

  const toggleFeesDisplay = () => {
    setShowTotalFees(!showTotalFees);
  };

  useEffect(() => {
    if (data && prices) {
      let totalRedeemedValue = 0;
      let totalOphirRedeemed = 0;

      Object.values(data.redeemSummary).forEach((info) => {
        info.redemptions.forEach((redemption) => {
          if (redemption.receivedAssets) {
            totalRedeemedValue += redemption.receivedAssets.reduce(
              (total, asset) => total + calculateAssetValue(asset, prices),
              0
            );
          }
          totalOphirRedeemed += redemption.redeemedAmount;
        });
      });

      const avgPrice =
        totalOphirRedeemed > 0 ? totalRedeemedValue / totalOphirRedeemed : 0;
      setAverageRedemptionPrice(avgPrice);
      setTotalOphirRedeemed(totalOphirRedeemed);
      setTotalRedeemedValue(totalRedeemedValue);

      // Calculate total fees
      const fees = calculateTotalFees(data.redeemSummary);
      setTotalFees(fees);
      const avgFeePercentage = calculateAverageFeePercentage(
        data.redeemSummary
      );
      setAverageFeePercentage(avgFeePercentage);
    }
  }, [data, prices]);

  const toggleAveragePriceDisplay = () => {
    setShowDetailedAvgPrice(!showDetailedAvgPrice);
  };

  // if (loading) {
  //   return <LoadingSpinner />;
  // }

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
    return <LoadingSpinner />;
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
        <div className="redeem-stats p-4 border rounded shadow">
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
    <div className="global-bg">
      <div className="container main-container-margin-top mx-auto p-4">
        {/* {refreshing && <LoadingSpinner />} */}
        <div className="title flex flex-col sm:flex-row justify-between items-center sm:mb-6 mb-0">
          <h1 className="text-2xl font-bold mb-0 sm:mb-4">
            Redemption Analytics Dashboard
          </h1>
          <div className="flex space-x-2 px-4">
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke={refreshAvailable ? "#0092ff" : "#aec5d6"}
              className={`w-6 h-6 hover:cursor-pointer mr-2 transition-transform duration-1000 ease-in-out ${
                isSpinning ? "animate-spin" : ""
              }`}
              onClick={handleRefreshClick}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg> */}

            <button
              onClick={handleClick}
              className="refresh-button text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out"
            >
              Redeem
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="refresh-button text-white font-semibold py-2 px-4 rounded transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="redeem-stats shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Total Redemptions</h2>
            <p className="text-3xl font-bold">
              {totalRedemptions}
              <sub className="text-lg ml-1">({uniqueRedeemers} unique)</sub>
            </p>
          </div>
          {/* <div className="redeem-stats shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Total Redemptions</h2>
            <p className="text-3xl font-bold">{totalRedemptions}</p>
          </div> */}
          <div className="redeem-stats shadow rounded p-4">
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
          <div className="redeem-stats shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2">
              Average Redemption Price
            </h2>
            <p
              className={`${
                showDetailedAvgPrice ? "text-xl" : "text-3xl"
              }  font-bold cursor-pointer`}
              onClick={toggleAveragePriceDisplay}
            >
              {showDetailedAvgPrice
                ? `$${totalRedeemedValue.toFixed(
                    2
                  )}/${totalOphirRedeemed.toFixed(3)} OPHIR`
                : `$${averageRedemptionPrice.toFixed(4)}`}
            </p>
          </div>
          <div
            className="redeem-stats shadow rounded p-4 cursor-pointer"
            onClick={toggleFeesDisplay}
          >
            <h2 className="text-lg font-semibold mb-2">
              {showTotalFees
                ? "Total Fees Generated"
                : "Average Fee Percentage"}
            </h2>
            <p className="text-3xl font-bold">
              {showTotalFees
                ? `${totalFees.toFixed(3)} OPHIR`
                : `${averageFeePercentage.toFixed(2)}%`}
            </p>
          </div>
        </div>

        <div className="redeem-stats shadow rounded p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Redemptions by Address</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartView("redeemed")}
                className={`px-3 py-1 rounded ${
                  chartView === "redeemed"
                    ? "redeemed-fees-button"
                    : "no-redeemed-fees-button"
                }`}
              >
                Redeemed
              </button>
              <button
                onClick={() => setChartView("fees")}
                className={`px-3 py-1 rounded ${
                  chartView === "fees"
                    ? "redeemed-fees-button"
                    : "no-redeemed-fees-button"
                }`}
              >
                Fees
              </button>
            </div>
          </div>
          <div className="h-80 sm:h-96 redemption-chart-text-color">
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

        <div className="space-y-4 redemption-data-flex">
          {Object.entries(redeemSummary).map(([address, info]) => (
            <div
              key={address}
              className="redeem-stats redeem-data-width shadow rounded p-4"
            >
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
                <div
                  key={index}
                  className="mb-4 p-3 bg-redemption-history rounded"
                >
                  <p>
                    <strong>Amount:</strong>{" "}
                    {redemption.redeemedAmount.toFixed(3)} OPHIR
                  </p>
                  <p>
                    <strong>Fee:</strong> {redemption.feeAmount.toFixed(3)}{" "}
                    OPHIR
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
    </div>
  );
};

export default RedemptionAnalyticsDashboard;
