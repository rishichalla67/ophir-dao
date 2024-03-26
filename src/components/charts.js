import React, { useState, useEffect, Suspense, lazy } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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
    },
    plugins: {
        legend: {
            display: false // This will hide the legend
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
    },
    plugins: {
        legend: {
            display: false // This will hide the legend
        }
    }
};

const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));

const CustomSelect = ({ options, selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (value) => {
        onSelect(value);
        setIsOpen(false);
    };

    return (

        <>
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px; /* Adjust scrollbar width */
                    }

                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #2e2e2e; /* Adjust track color */
                    }

                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #888; /* Adjust thumb color */
                        border-radius: 4px; /* Rounded corners for the thumb */
                    }

                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #555; /* Color of the thumb on hover */
                    }

                    /* For Firefox */
                    .custom-scrollbar {
                        scrollbar-width: thin; /* "auto" or "thin" */
                        scrollbar-color: #888 #2e2e2e; /* thumb and track color */
                    }
                `}
            </style>
            <div className="flex justify-center">
                <div className="bg-transparent text-white p-2 rounded cursor-pointer text-center font-semibold text-xs sm:text-xl hover:bg-yellow-400 hover:text-black transition-colors duration-300 ease-in-out flex items-center justify-center w-1/4" onClick={() => setIsOpen(!isOpen)}>
                    {selected ? selected.toUpperCase() : "Select Asset"} <span className="ml-2">▼</span>
                </div>
            </div>
            {isOpen && (
                <div className="absolute z-10 bg-black mt-1 left-1/2 transform -translate-x-1/2 w-1/4 rounded shadow-lg custom-scrollbar">
                    <div className="max-h-60 overflow-auto">
                        <div className="py-1">
                            {options.length > 0 ? (
                                options.map((option, index) => (
                                    <div key={index} className="text-white text-xxs sm:text-xl font-semibold hover:bg-gray-700 p-2 cursor-pointer text-center" onClick={() => handleSelect(option)}>
                                        {option.toUpperCase()}
                                    </div>
                                ))
                            ) : (
                                <div className="text-white text-xs sm:text-xl p-2 text-center">No options</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

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

    // const fetchData = async () => {
    //     const cacheTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    //     const now = new Date().getTime();
    //     const chartDataCache = localStorage.getItem('chartData');
    //     const totalTreasuryChartDataCache = localStorage.getItem('totalTreasuryChartData');
    //     const cacheTimestamp = localStorage.getItem('cacheTimestamp');
    
    //     if (chartDataCache && totalTreasuryChartDataCache && cacheTimestamp && now - cacheTimestamp < cacheTime) {
    //         setChartData(JSON.parse(chartDataCache));
    //         setTotalTreasuryChartData(JSON.parse(totalTreasuryChartDataCache));
    //     } else {
    //         try {
    //             const chartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/chartData`);
    //             const totalTreasuryChartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/totalValueChartData`);
    
    //             setChartData(chartDataResponse.data);
    //             setTotalTreasuryChartData(totalTreasuryChartDataResponse.data);
    //             // Cache the data
    //             localStorage.setItem('chartData', JSON.stringify(chartDataResponse.data));
    //             localStorage.setItem('totalTreasuryChartData', JSON.stringify(totalTreasuryChartDataResponse.data));
    //             localStorage.setItem('cacheTimestamp', now.toString());
    //         } catch (error) {
    //             console.error('Error fetching data:', error);
    //         }
    //     }
    // };
    const fetchData = async () => {
        try {
            const chartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/chartData`);
            const totalTreasuryChartDataResponse = await axios.get(`${prodUrl}/ophir/treasury/totalValueChartData`);
    
            setChartData(chartDataResponse.data);
            setTotalTreasuryChartData(totalTreasuryChartDataResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
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
    
        switch (chartOption) {
            case 'amount':
                chartDataValues = dataPoints.map(dataPoint => dataPoint.asset);
                break;
            case 'price':
                chartDataValues = dataPoints.map(dataPoint => dataPoint.price);
                break;
            case 'value':
            default:
                chartDataValues = dataPoints.map(dataPoint => dataPoint.value);
                break;
        }
    
        return {
            labels: chartLabels,
            datasets: [
                {
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
                    <hr className="border-t border-gray-200 my-4"/>
                    <div className="p-3">
                        {/* <div className="text-3xl font-bold text-white mb-4">Charts</div> */}
                        {/* Selector for chart options */}
                        <div className="border pt-3 pb-3 rounded-lg shadow-md ">
                            <CustomSelect
                                options={Object.keys(chartData)}
                                selected={selectedAsset}
                                onSelect={setSelectedAsset}
                            />
                            {selectedAsset && (
                                <div className="mt-4 mb-4">
                                    <CustomSelect
                                        options={['value', 'amount', 'price']}
                                        selected={chartOption}
                                        onSelect={setChartOption}
                                    />
                                </div>
                            )}
                        </div>
                        {selectedAsset && prepareChartDataForSelectedAsset() && (
                            <div className="pt-2">
                                <Line data={prepareChartDataForSelectedAsset()} options={options} />
                            </div>
                        )}      
                        <hr className="border-t border-white w-full my-4"/>
                        <>
                            {totalTreasuryChartData && totalTreasuryChartConfig && totalTreasuryChartConfig.labels.length > 0 && (
                                <div className="pt-2 text-white">
                                    <div className="p-1"> 
                                        <div className="text-md sm:text-3xl font-bold text-white mb-2">Total Treasury Value Over Time</div>
                                        <Line data={totalTreasuryChartConfig} options={options} />
                                    </div>
                                </div>
                            )}
                            {totalTreasuryChartData && chartData && prepareComparisonChartData(totalTreasuryChartData, chartData) && (
                                <div className="p-1">
                                    <div className="text-md sm:text-3xl font-bold text-white mb-4">Total Treasury vs BTC Price</div>
                                    <Line data={prepareComparisonChartData(totalTreasuryChartData, chartData)} options={comparisonOptions} />
                                </div>
                            )}
                        </>
                    </div>
                </>
            )}
        </>
    );
}
export default Charts;