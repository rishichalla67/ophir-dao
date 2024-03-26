import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';


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
                borderColor: 'rgba(255, 206, 86)',
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
            },
            ticks: {
                color: 'white', // Change Y-axis ticks color to white
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)', // Change Y-axis grid lines color to white with some transparency
            }
        },
        x: {
            ticks: {
                color: 'white', // Change X-axis ticks color to white
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)', // Change X-axis grid lines color to white with some transparency
            }
        }
    }
};

const options = {
    scales: {
        y: {
            beginAtZero: false,
            ticks: {
                color: 'white', // Change Y-axis ticks color to white
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)', // Change Y-axis grid lines color to white with some transparency
            }
        },
        x: {
            ticks: {
                color: 'white', // Change X-axis ticks color to white
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.1)', // Change X-axis grid lines color to white with some transparency
            }
        }
    }
};

const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));


const Charts = () => {

    const [chartData, setChartData] = useState(null);
    const [totalTreasuryChartData, setTotalTreasuryChartData] = useState(null);
    const [chartOption, setChartOption] = useState('value'); // 'amount', 'value', 'price'
    const [selectedAsset, setSelectedAsset] = useState(''); // State to manage selected asset for mobile view

    const chartOptionChangeHandler = (event) => {
        setChartOption(event.target.value);
    };
    const selectedAssetChangeHandler = (event) => {
        setSelectedAsset(event.target.value);
    };
    const totalTreasuryChartConfig = prepareTotalTreasuryChartData(totalTreasuryChartData);
    const isMobile = window.innerWidth <= 768;

    const prodUrl = 'https://parallax-analytics.onrender.com';
    const localUrl = 'http://localhost:225';

    const fetchData = async () => {
        const cacheTime = 15 * 60 * 1000; // 15 minutes in milliseconds
        const now = new Date().getTime();
        const chartDataCache = localStorage.getItem('chartData');
        const totalTreasuryChartDataCache = localStorage.getItem('totalTreasuryChartData');
        const cacheTimestamp = localStorage.getItem('cacheTimestamp');
    
        if (chartDataCache && totalTreasuryChartDataCache && cacheTimestamp && now - cacheTimestamp < cacheTime) {
            setChartData(JSON.parse(chartDataCache));
            setTotalTreasuryChartData(JSON.parse(totalTreasuryChartDataCache));
        } else {
            try {
                const chartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/chartData`);
                const totalTreasuryChartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/totalValueChartData`);
    
                setChartData(chartDataResponse.data);
                setTotalTreasuryChartData(totalTreasuryChartDataResponse.data);
                // Cache the data
                localStorage.setItem('chartData', JSON.stringify(chartDataResponse.data));
                localStorage.setItem('totalTreasuryChartData', JSON.stringify(totalTreasuryChartDataResponse.data));
                localStorage.setItem('cacheTimestamp', now.toString());
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const prepareChartDataForSelectedAsset = () => {
        if (!chartData || !selectedAsset || !chartData[selectedAsset]) return null;

        const dataPoints = chartData[selectedAsset];
        const chartLabels = dataPoints.map(dataPoint => new Date(dataPoint?.timestamp).toLocaleDateString());
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

        return {
            labels: chartLabels,
            datasets: [
                {
                    label: `${labelSuffix}`,
                    data: chartDataValues,
                    fill: false,
                    backgroundColor: 'rgb(255, 206, 86)',
                    borderColor: 'rgba(255, 206, 86, 2)',
                    pointRadius: 0.1,
                    pointHoverRadius: 5,
                    tension: 0.2
                },
            ],
        };
    };

    return(
        <>
            <style>
                {`
                    @keyframes fadeInOut {
                        0% { opacity: 0.5; }
                        50% { opacity: 1; }
                        100% { opacity: 0.5; }
                    }
                    .loading-animation {
                        animation: fadeInOut 2s linear infinite;
                    }
                `}
            </style>
            {(!chartData || !totalTreasuryChartData) && <div className="loading-animation text-white flex items-center justify-center">Gathering Chart Data...</div>}
            {chartData && totalTreasuryChartData && (
                <>
                    <div className="p-3 charts-bg">
                        {/* <div className="text-3xl font-bold text-white mb-4">Charts</div> */}
                        {/* Selector for chart options */}
                                                        
                            <div className="relative mb-4">
                                <div className="bg-transparent text-white p-2 rounded cursor-pointer text-center font-bold text-xl hover:bg-white hover:text-black transition-colors duration-300 ease-in-out flex items-center justify-center" onClick={() => document.getElementById('selectedAssetSelect').click()}>
                                    {selectedAsset ? selectedAsset.toUpperCase() : "Select Asset"} <span className="ml-2">▼</span>
                                </div>
                                <select id="selectedAssetSelect" onChange={selectedAssetChangeHandler} value={selectedAsset} className="absolute bg-black top-0 left-0 w-full h-full opacity-0 cursor-pointer">
                                    <option value="">Select Asset</option>
                                    {Object.keys(chartData).map((denom, index) => (
                                        <option key={index} value={denom}>{denom.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedAsset && (
                                <>
                                    <div className="relative mb-4">
                                        <div className="bg-transparent text-white p-2 rounded cursor-pointer text-center font-bold text-xl hover:bg-white hover:text-black transition-colors duration-300 ease-in-out flex items-center justify-center" onClick={() => document.getElementById('chartOptionSelect').click()}>
                                            {chartOption.charAt(0).toUpperCase() + chartOption.slice(1)} <span className="ml-2">▼</span>
                                        </div>
                                        <select id="chartOptionSelect" onChange={chartOptionChangeHandler} value={chartOption} className="absolute bg-black top-0 left-0 w-full h-full opacity-0 cursor-pointer">
                                            <option value="value">Asset Value</option>
                                            <option value="amount">Asset Amount</option>
                                            <option value="price">Asset Price</option>
                                        </select>
                                    </div>
                                    <Line data={prepareChartDataForSelectedAsset()} options={options} />
                                </>
                            )}                            
                            <hr className="border-t border-white w-full my-4"/>
                            <>
                                <div className="pt-2 text-white">
                                    <div className="p-1"> 
                                        <div className="text-3xl font-bold text-white mb-2">Total Treasury Value Over Time</div>
                                        <Line data={totalTreasuryChartConfig} options={options} />
                                    </div>
                                </div>
                                <div className="p-1">
                                    <div className="text-3xl font-bold text-white mb-4">Total Treasury vs BTC Price</div>
                                    <Line data={prepareComparisonChartData(totalTreasuryChartData, chartData)} options={comparisonOptions} />
                                </div>
                            </>
                    </div>
                </>
            )}
        </>
    );
}
export default Charts;