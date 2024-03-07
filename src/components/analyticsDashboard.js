import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import CryptoPieChart from './pieChart';

const Modal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;
    console.log(data)
    let composition = data.composition;
    return (
        <div className="absolute inset-0 mt-[20%] bg-black bg-opacity-50 flex justify-center items-center p-4 md:p-10">
  <div className="bg-black border border-yellow-400 p-4 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl overflow-auto">
    <h2 className="text-lg font-bold mb-4">Composition</h2>
    <div className="overflow-auto max-h-[80vh]">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left py-2 px-3">Location</th>
            <th className="text-right py-2 px-3">Amount</th>
            <th className="text-right py-2 px-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(composition).map(([walletName, amount], index) => (
            <tr key={index}>
              <td className="text-sm font-medium py-2 px-3">{walletName}</td>
              <td className="text-sm py-2 px-3 text-right">{amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
              <td className="text-sm py-2 px-3 text-right">{(amount * data.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button onClick={onClose} className="mt-4 py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500 md:hover:bg-slate-700 hover:text-white w-full">
      Close
    </button>
  </div>
</div>

    );
  };

  const prepareTotalTreasuryChartData = (data) => {
    // Sort data by date
    if (!data) {
        // Handle the case where data is null or undefined
        // For example, you could return an empty object or some default value
        return {
            labels: [],
            datasets: []
        };
    }
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartLabels = sortedData.map(item => item.date);
    const chartDataValues = sortedData.map(item => item.totalValue);

    return {
        labels: chartLabels,
        datasets: [
            {
                label: 'Total Treasury Value',
                data: chartDataValues,
                fill: false,
                backgroundColor: 'rgb(255, 206, 86)',
                borderColor: 'rgba(255, 206, 86, 0.2)',
                tension: 0.1
            }
        ]
    };
};

const prepareComparisonChartData = (totalTreasuryData, chartData) => {
    const chartLabels = totalTreasuryData.map(item => item.date);
    // Ensure there's at least one value and it's not null for both datasets
    if (!totalTreasuryData.length || !chartData['wBTC'].length) return { labels: [], datasets: [] };

    // Initialize starting values
    const startTreasuryValue = totalTreasuryData[0].totalValue;
    const startWBTCValue = chartData['wBTC'].find(data => data.price !== null)?.price || 0;

    // Avoid division by zero
    if (startTreasuryValue === 0 || startWBTCValue === 0) return { labels: [], datasets: [] };

    // Calculate percentage change from the start for each value
    const treasuryValues = totalTreasuryData.map(item => ((item.totalValue - startTreasuryValue) / startTreasuryValue) * 100);
    const wBTCValues = chartLabels.map(label => {
        const labelDate = new Date(label).toISOString().slice(0, 10);
        const matchingWBTCData = chartData['wBTC'].find(data => {
            const dataDate = new Date(data.timestamp).toISOString().slice(0, 10);
            return dataDate === labelDate;
        });
        if (matchingWBTCData) {
            return ((matchingWBTCData.price - startWBTCValue) / startWBTCValue) * 100;
        }
        return null;
    });
    console.log(wBTCValues);
    return {
        labels: chartLabels,
        datasets: [
            {
                label: 'Total Treasury Value (% Change)',
                data: treasuryValues,
                fill: false,
                borderColor: 'rgb(255, 206, 86)',
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'BTC Price (% Change)',
                data: wBTCValues,
                fill: false,
                borderColor: 'rgb(255, 255, 255)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                yAxisID: 'y',
            }
        ]
    };
};


const comparisonOptions = {
    scales: {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '% Change from Start'
            }
        }
    }
};

  const createChartData = (chartData) => {
    const datasets = Object.keys(chartData).filter(denom => denom.toLowerCase() !== 'ophir').map((denom) => {
        const dataPoints = chartData[denom];
        const chartDataValues = dataPoints.map(dataPoint => dataPoint.value);
        const chartLabels = dataPoints.map(dataPoint => new Date(dataPoint.timestamp).toLocaleDateString());

        return {
            label: `${denom.toUpperCase()} Value`,
            data: chartDataValues,
            fill: false,
            borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color for each dataset
            tension: 0.1,
            pointRadius: 3, // Smaller point size
            pointHoverRadius: 5 // Slightly larger when hovered for better visibility
        };
    });

    // Assuming all data points have the same timestamps, use the first denom (excluding 'Ophir') to get labels
    const firstNonOphirDenom = Object.keys(chartData).find(denom => denom.toLowerCase() !== 'ophir');
    const labels = chartData[firstNonOphirDenom].map(dataPoint => new Date(dataPoint.timestamp).toLocaleDateString());

    return {
        labels,
        datasets
    };
};

const options = {
    scales: {
        y: {
            beginAtZero: false
        }
    }
};

const formatNumber = (number, digits) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const prodUrl = 'https://parallax-analytics.onrender.com';
  const localUrl = 'http://localhost:225';


const AnalyticsDashboard = () => {
    const [ophirStats, setOphirStats] = useState(null);
    const [ophirTreasury, setOphirTreasury] = useState(null);
    const [priceData, setPriceData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [totalTreasuryChartData, setTotalTreasuryChartData] = useState(null);
    const [chartOption, setChartOption] = useState('value'); // 'amount', 'value', 'price'
    const [inBitcoin, setInBitcoin] = useState(false);
    const [inLuna, setInLuna] = useState(false);
    const [inWhale, setInWhale] = useState(false);
    const [sort, setSort] = useState('descending');
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({});

    const toggleModal = () => setModalOpen(!isModalOpen);

    const totalSupply = 1000000000;

    const formatNumberInBitcoin = (number) => {
        let numericValue = typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
        if (isNaN(numericValue)) {
            throw new Error('Invalid number input');
        }
        return formatNumber(numericValue / priceData['wBTC'], 4);
    }

    const chartOptionChangeHandler = (event) => {
        setChartOption(event.target.value);
    };

    const fetchData = async () => {
        try {
            const statsResponse = await axios.get(`${prodUrl}/ophir/stats`);
            const treasuryResponse = await axios.get(`${prodUrl}/ophir/treasury`);
            const prices = await axios.get(`${prodUrl}/ophir/prices`);
            const chartData = await axios.get(`${prodUrl}/ophir/treasury/chartData`)
            const totalTreasuryChartData = await axios.get(`${prodUrl}/ophir/treasury/totalValueChartData`)
            setOphirStats(statsResponse.data);
            setOphirTreasury(treasuryResponse.data);
            setPriceData(prices.data);
            setChartData(chartData.data);
            setTotalTreasuryChartData(totalTreasuryChartData.data)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const toggleBitcoinDenomination = () => {
        setInBitcoin(!inBitcoin);
    };

    const toggleLunaDenomination = () => {
        setInLuna(!inLuna);
    };

    const toggleWhaleDenomination = () => {
        setInWhale(!inWhale);
    };

    const toggleSortOrder = () => {
        setSort(sort === 'ascending' ? 'descending' : 'ascending');
    };


    function sortAssetsByValue(data, prices, order = 'ascending') {
        // Calculate total value for each asset
        const calculatedValues = Object.entries(data).map(([key, asset]) => {
            const price = prices[key] || 0;
            const totalValue = (parseFloat(asset.balance) + parseFloat(asset.rewards)) * price;
    
            // Exclude specific keys from truncation
            const excludeTruncation = ['ophirRedemptionPrice', 'treasuryValueWithoutOphir', 'totalTreasuryValue'];
            let truncatedKey = key;
            if (!excludeTruncation.includes(key) && key.length > 15) {
                truncatedKey = `${key.substring(0, 8)}...`;
            }
            
            return { key: truncatedKey, originalKey: key, ...asset, totalValue };
        }).filter(asset => asset.totalValue > 0); // Filter out assets with a total value of 0
    
        // Sort based on total value
        calculatedValues.sort((a, b) => {
          if (order === 'ascending') {
            return a.totalValue - b.totalValue;
          } else {
            return b.totalValue - a.totalValue;
          }
        });
    
        // Convert back to original data format, preserving sorted order
        const sortedData = {};
        calculatedValues.forEach(asset => {
          const { key, originalKey, totalValue, ...rest } = asset; // Exclude totalValue from final output
          sortedData[key] = { ...rest, originalKey };
        });
    
        return sortedData;
    }
    

    const getPercentageOfTotalOphirSupply = (value) => {
        return (value/totalSupply)*100;
    }

    function formatDataForChart(data) {
        let formattedData = [];
    
        for (const key in data) {
            // Exclude the "ophir" key
            if (key === 'ophir') {
                continue;
            }
            if (data[key].hasOwnProperty('balance')) {
                console.log(data[key].balance * priceData[key])
                if(isNaN(data[key].balance * priceData[key])){
                    continue;
                }
                formattedData.push({
                    name: key,
                    value: parseFloat((data[key].balance*priceData[key]))
                });
            }
        }
    
        return formattedData;
    }

    const totalTreasuryChartConfig = prepareTotalTreasuryChartData(totalTreasuryChartData);


    if (!ophirStats) {
        return (
          <div className="flex flex-col justify-center items-center h-screen">
              <div className="text-white mb-4">Fetching On-Chain Data...</div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        );
      }
  return (
    <>
        {ophirStats && ophirTreasury && priceData &&
            <div className="pt-12 bg-black text-white min-h-screen">
                <div className="p-3 bg-black">
                    <div className="text-3xl font-bold text-white mb-4">Ophir Statistics</div>
                    
                    <div className="
                    grid 
                    grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
                    ">
                        {/* Ophir Price */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Price</div>
                            <div className="sm:text-xl text-md">${formatNumber(ophirStats?.price, 5)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="Redemption Price">RP: ${formatNumber(ophirTreasury?.ophirRedemptionPrice, 4)}</div>

                        </div>
                        {/* Market Cap */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/3313489-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Market Cap</div>
                            <div className="sm:text-xl text-md">${formatNumber(ophirStats?.marketCap,0)}</div>
                        </div>
                        {/* FDV */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/70884-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">FDV</div>
                            <div className="sm:text-xl text-md">${formatNumber(ophirStats?.fdv,0)}</div>
                        </div>
                        {/* Ophir Mine */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center" title="Ophir that will be distributed to stakers...">
                            <img src="https://cdn-icons-png.flaticon.com/512/5895/5895891.png" alt="Icon" className="h-8 w-8 mb-1" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Mined Ophir</div>
                            <div className="sm:text-xl text-md ">{formatNumber(ophirStats?.ophirInMine,0)}</div>
                        </div>
                        {/* Circulating Supply */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/3844310-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Circulating Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.circulatingSupply,0)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="(circulating supply / total supply) * 100">{formatNumber(getPercentageOfTotalOphirSupply(ophirStats?.circulatingSupply),2)}%</div>

                        </div>
                        {/* Staked Supply */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/904757-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Staked Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.stakedSupply,0)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="(staked supply / total supply) * 100">{formatNumber(getPercentageOfTotalOphirSupply(ophirStats?.stakedSupply),2)}%</div>
                        </div>
                    </div>
                </div>
                <Modal isOpen={isModalOpen} onClose={toggleModal} data={modalData} />
                    <div className="p-3 bg-black">
                        <div className="text-3xl font-bold text-white mb-4">Ophir Treasury</div>
                        <div className="overflow-x-auto pb-2">
                        <table className="max-w-full bg-black mx-auto table-auto sm:w-full">
                            <thead className="bg-yellow-400 text-black">
                                <tr>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xs sm:text-xs">Asset</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xs sm:text-xs">Balance</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xs sm:text-xs hover:cursor-pointer" onClick={toggleSortOrder}>Value (USD)</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xs sm:text-xs">Rewards</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xs sm:text-xs">Location</th>
                                </tr>
                            </thead>
                            <tbody className="text-white text-xs sm:text-xs">
                                {Object.entries(sortAssetsByValue(ophirTreasury, priceData, sort)).filter(([key]) => key !== 'totalTreasuryValue' && key !== 'treasuryValueWithoutOphir' && key !== 'ophirRedemptionPrice').map(([key, value]) => (
                                    <tr className={`... ${value.composition ? 'hover:cursor-pointer hover:bg-yellow-400 hover:text-black' : ''}`} onClick={() => {setModalData({composition: value?.composition, symbol: key, price: priceData[key]}); value?.composition && toggleModal()}} key={key}>
                                        <td className="text-left py-2 px-1 sm:px-1" title={value?.originalKey}>{key}</td>
                                        <td className="text-center py-2 px-1 sm:px-1">{parseFloat(value.balance).toLocaleString()}</td>
                                        <td className="text-center py-2 px-1 sm:px-1">${!isNaN(value.balance * priceData[key]) ? formatNumber((value.balance * priceData[key]), 2) : 0}</td>
                                        <td className="text-center py-2 px-1 sm:px-1 cursor-pointer" onClick={value.location.includes('Luna Alliance') || value.location.includes('ampRoar Alliance Staked') ? toggleLunaDenomination : value.location === 'Migaloo Alliance' ? toggleWhaleDenomination : null}>
                                            {value.rewards && (value.location.includes('Luna Alliance') || value.location === 'Migaloo Alliance' || value.location === 'ampRoar Alliance Staked') && (
                                                inLuna && (value.location.includes('Luna Alliance') || value.location === 'ampRoar Alliance Staked') ? `${parseFloat(value.rewards).toLocaleString()} luna` :
                                                !inLuna && (value.location.includes('Luna Alliance') || value.location === 'ampRoar Alliance Staked') ? `$${formatNumber(parseFloat(value.rewards * priceData['luna']), 2)}` :
                                                inWhale && value.location === 'Migaloo Alliance' ? `${parseFloat(value.rewards).toLocaleString()} whale` :
                                                `$${formatNumber(parseFloat(value.rewards * priceData['whale']), 2)}`
                                            )}
                                        </td>
                                        <td className="text-center py-2 px-1 sm:px-1">{value.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                    <div className="flex justify-center pb-2">
                        <CryptoPieChart data={formatDataForChart(ophirTreasury)} />
                    </div>
                    <div className="mx-[20dvw]">
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center cursor-pointer" onClick={toggleBitcoinDenomination}>
                            <img src="https://cdn-icons-png.flaticon.com/512/7185/7185535.png" alt="Icon" className="h-8 w-8 mb-1" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Total Treasury Value</div>
                            {inBitcoin ? 
                                <div className="sm:text-xl text-md ">{formatNumberInBitcoin(ophirTreasury?.totalTreasuryValue)} BTC</div>
                                :
                                <div className="sm:text-xl text-md ">${formatNumber(ophirTreasury?.totalTreasuryValue,0)}</div>
                            }
                            {inBitcoin ? 
                                <div className="sm:text-md text-sm text-center mt-1"><a className="font-bold sm:text-sm text-xsm">W/O Ophir:</a> {formatNumberInBitcoin(ophirTreasury?.treasuryValueWithoutOphir)} BTC</div>
                                :
                                <div className="sm:text-md text-sm text-center mt-1"><a className="font-bold sm:text-sm text-xsm">W/O Ophir:</a> ${formatNumber(ophirTreasury?.treasuryValueWithoutOphir,0)}</div>
                            }
                            
                        </div>
                    </div>
                    
                </div>
                <hr className="border-t border-white" />
                <div className="p-3 bg-black">
                <div className="text-3xl font-bold text-white mb-4">Charts</div>
                {/* Selector for chart options */}
                <div className='pl-2'>
                    <select onChange={chartOptionChangeHandler} value={chartOption} className="mb-4 bg-slate-800 text-white p-2 rounded">
                        <option value="value">Asset Value</option>
                        <option value="amount">Asset Amount</option>
                        <option value="price">Asset Price</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(chartData).map((denom, index) => {
                        const dataPoints = chartData[denom];
                        const chartLabels = dataPoints.map(dataPoint => new Date(dataPoint.timestamp).toLocaleDateString());
                        let chartDataValues;
                        let labelSuffix;

                        switch (chartOption) {
                            case 'amount':
                                chartDataValues = dataPoints.map(dataPoint => dataPoint.asset);
                                labelSuffix = 'Amount';
                                break;
                            case 'price':
                                chartDataValues = dataPoints.map(dataPoint => dataPoint.price);
                                labelSuffix = 'Price';
                                break;
                            case 'value':
                            default:
                                chartDataValues = dataPoints.map(dataPoint => dataPoint.value);
                                labelSuffix = '$ Value';
                                break;
                        }

                        const data = {
                            labels: chartLabels,
                            datasets: [
                                {
                                    label: `${denom.toUpperCase()} ${labelSuffix}`,
                                    data: chartDataValues,
                                    fill: false,
                                    backgroundColor: 'rgb(255, 206, 86)',
                                    borderColor: 'rgba(255, 206, 86, 0.2)',
                                    pointRadius: 0.1,
                                    pointHoverRadius: 5
                                },
                            ],
                        };

                        const options = {
                            scales: {
                                y: {
                                    beginAtZero: false
                                }
                            }
                        };

                        return (
                            <div key={index} className="bg-slate-800 text-white rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                                <div className="sm:text-2xl text-sm font-bold mb-1 text-center">{denom.toUpperCase()}</div>
                                <Line data={data} options={options} />
                            </div>
                        );
                    })}
                </div>
                    {ophirStats && ophirTreasury && priceData &&
                        <div className="pt-12 bg-black text-white min-h-screen">
                            <div className="p-3 bg-black">
                                <div className="text-3xl font-bold text-white mb-4">Total Treasury Value Over Time</div>
                                <Line data={totalTreasuryChartConfig} options={options} />
                            </div>
                        </div>
                    }
                    <div className="p-3 bg-black">
                        <div className="text-3xl font-bold text-white mb-4">Total Treasury vs BTC Price</div>
                        <Line data={prepareComparisonChartData(totalTreasuryChartData, chartData)} options={comparisonOptions} />
                    </div>
                    {/* <div className="my-8">
                        <h2 className="text-xl font-bold mb-4 text-center">Combined Asset Values</h2>
                        <Line data={createChartData(chartData)} options={options} />
                    </div> */}
                </div>
            </div>
        }
    </>
  );
};

export default AnalyticsDashboard;
