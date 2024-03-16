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
    const chartOptionChangeHandler = (event) => {
        setChartOption(event.target.value);
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


    return(
        <>
        <Suspense fallback={<div className="text-white">Loading Charts...</div>}>
            {chartData && totalTreasuryChartData && (
                <>
                    <div className="p-3 charts-bg">
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

                                const data = {
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

                                return (
                                    <div key={index} className="bg-black text-white rounded-lg shadow-md min-w-[100px] flex flex-col items-center justify-center">
                                        <div className="sm:text-2xl text-sm font-bold mb-1 text-center">{denom.toUpperCase()}</div>
                                        {/* Conditional rendering based on device type */}
                                        {isMobile ? (
                                            <div>Chart optimized for mobile</div>
                                        ) : (
                                            <Line data={data} options={options} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                            <>
                                <div className="pt-2 bg-black text-white">
                                    <div className="p-1 bg-black"> 
                                        <div className="text-3xl font-bold text-white mb-2">Total Treasury Value Over Time</div>
                                        <Line data={totalTreasuryChartConfig} options={options} />
                                    </div>
                                </div>
                                <div className="p-1 bg-black">
                                    <div className="text-3xl font-bold text-white mb-4">Total Treasury vs BTC Price</div>
                                    <Line data={prepareComparisonChartData(totalTreasuryChartData, chartData)} options={comparisonOptions} />
                                </div>
                            </>
                    </div>
                </>
            )}
        </Suspense>
        </>
    );
}
export default Charts;