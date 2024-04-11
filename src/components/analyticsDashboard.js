import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import 'chart.js/auto';
import CryptoPieChart from './pieChart';
import Charts from './charts';
import { tokenMappings } from '../helper/tokenMappings';
import { CosmWasmClient  } from "@cosmjs/cosmwasm-stargate";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { tokenImages } from '../helper/tokenImages';
import PriceDisplay from './priceDisplay';
import NFTGallery from './ntfGallery';

const Modal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const { composition, price } = data;

    return (
        <div className="fixed inset-0 flex justify-center items-center p-4 md:p-10">
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
                                    <td className="text-sm py-2 px-3 text-right">{(amount * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
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

const formatNumber = (number, digits) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  const prodUrl = 'https://parallax-analytics.onrender.com';
  const localUrl = 'http://localhost:225';
const contractAddress = 'migaloo1esxyqwqn33uckkzlcc26zc8d0yy94pcfac4epnc7rtfxte63gwlqqxux3s';

const AnalyticsDashboard = () => {
    const [ophirStats, setOphirStats] = useState(null);
    const [ophirTreasury, setOphirTreasury] = useState(null);
    const [priceData, setPriceData] = useState(null);
    const [inBitcoin, setInBitcoin] = useState(false);
    const [inLuna, setInLuna] = useState(false);
    const [inWhale, setInWhale] = useState(false);
    const [sort, setSort] = useState('descending');
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({});
    const [showProgressBar, setShowProgressBar] = useState(true);
    const [activeTab, setActiveTab] = useState('treasury'); // Add this line to manage active tab
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [redemptionPrice, setRedemptionPrice] = useState(0);
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
    const [runestoneData, setRunestoneData] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
    
        window.addEventListener('resize', handleResize);
    
        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showAlert = (message, severity = 'info', htmlContent = null) => {
        setAlertInfo({ open: true, message, severity, htmlContent });
    };

    const handleCellClick = (value, key) => {
        setModalData({ composition: value?.composition, symbol: key, price: priceData[key] });
        if (value?.composition) toggleModal();
      };
      
      const handleRewardsClick = (location) => {
        if (location.includes('Luna Alliance') || location.includes('ampRoar Alliance Staked')) {
          toggleLunaDenomination();
        } else if (location === 'Migaloo Alliance') {
          toggleWhaleDenomination();
        }
      };
      
      const renderRewards = (value) => {
        const { rewards, location } = value;
        if (!rewards || !['Luna Alliance', 'Migaloo Alliance', 'ampRoar Alliance Staked'].some(l => location.includes(l))) {
          return null;
        }
      
        if (inLuna && (location.includes('Luna Alliance') || location === 'ampRoar Alliance Staked')) {
          return `${parseFloat(rewards).toLocaleString()} luna`;
        } else if (!inLuna && (location.includes('Luna Alliance') || location === 'ampRoar Alliance Staked')) {
          return `$${formatNumber(parseFloat(rewards * priceData['luna']), 2)}`;
        } else if (inWhale && location === 'Migaloo Alliance') {
          return `${parseFloat(rewards).toLocaleString()} whale`;
        } else {
          return `$${formatNumber(parseFloat(rewards * priceData['whale']), 2)}`;
        }
      };

    const toggleModal = () => setModalOpen(!isModalOpen);

    const totalSupply = 1000000000;

    const formatNumberInBitcoin = (number) => {
        let numericValue = typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
        if (isNaN(numericValue)) {
            throw new Error('Invalid number input');
        }
        return formatNumber(numericValue / priceData['wBTC'], 4);
    }

    const calculateTotalValue = (redemptionValues, prices) => {
        let totalValue = 0;
        let allDenomsUsed = true;
        if (Object.keys(prices).length > 0) {
            Object.keys(redemptionValues).forEach(denom => {
                const priceInfo = prices[denom] || 0; // Default to a price of 0 if not found
                // console.log('Token Denom:', denom);
                // console.log('Price Info:', priceInfo);
                if (priceInfo !== 0) {
                    // console.log(redemptionValues);
                    const value = redemptionValues[denom] * priceInfo;
                    // console.log('Token Value:', value);
                    totalValue += value;
                } else {
                    allDenomsUsed = false;
                }
            });
        }
        return { totalValue, allDenomsUsed };
    };

    async function getRedemptionPrice (prices) {
        try {
            const message = {
                get_redemption_calculation: {
                    amount: "10000000000",
                }
            };
    
            const client = await CosmWasmClient.connect('https://migaloo-rpc.polkachu.com/');

            // Query the smart contract directly using CosmWasmClient.queryContractSmart
            const queryResponse = await client.queryContractSmart(contractAddress, message);
            let updatedRedemptionValues;
            console.log(queryResponse)
            // Process the query response as needed
            if (queryResponse && queryResponse.redemptions) {
                updatedRedemptionValues = queryResponse.redemptions.reduce((acc, redemption) => {
                    // Retrieve token information from the mappings or use default values
                    const tokenInfo = tokenMappings[redemption.denom] || { symbol: redemption.denom, decimals: 6 };
                    // Adjust the amount by the token's decimals
                    const adjustedAmount = Number(redemption.amount) / Math.pow(10, tokenInfo.decimals);            
                    // Accumulate the adjusted amounts by token symbol
                    acc[tokenInfo.symbol] = adjustedAmount;
            
                    return acc;
                }, {});
        
            }
            console.log(updatedRedemptionValues)
            // Assuming calculateTotalValue uses the latest state directly or you pass the latest state as arguments
            const { totalValue, allDenomsUsed } = calculateTotalValue(updatedRedemptionValues, prices);
            setRedemptionPrice(totalValue/10000);
        } catch (error) {
            console.error('Error querying contract:', error);
            showAlert(`Error querying contract. ${error.message}`, 'error');
        }
    };

    const fetchData = async () => {
        const cacheKey = 'ophirDataCache';
        const cachedData = localStorage.getItem(cacheKey);
        const now = new Date();
        
        if (cachedData) {
            const { stats, treasury, prices, timestamp } = JSON.parse(cachedData);
            const cacheAge = now.getTime() - timestamp;
    
            if (cacheAge < 5 * 60 * 1000) { // Cache is younger than 5 minutes
                setOphirStats(stats);
                setOphirTreasury(treasury);
                setPriceData(prices);
                return;
            }
        }
    
        try {
            const statsResponse = await axios.get(`${prodUrl}/ophir/stats`);
            const treasuryResponse = await axios.get(`${prodUrl}/ophir/treasury`);
            const pricesResponse = await axios.get(`${prodUrl}/ophir/prices`);
            getRedemptionPrice(pricesResponse.data);
            const dataToCache = {
                stats: statsResponse.data,
                treasury: treasuryResponse.data,
                prices: pricesResponse.data,
                timestamp: now.getTime()
            };

            const magicEdenResponse = await axios.get('https://api-mainnet.magiceden.io/v2/ord/btc/stat?collectionSymbol=runestone');
            setRunestoneData(magicEdenResponse.data);
    
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    
            setOphirStats(statsResponse.data);
            setOphirTreasury(treasuryResponse.data);
            setPriceData(pricesResponse.data);
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
            if (!asset || asset.balance === undefined || asset.rewards === undefined) {
                console.warn(`Missing asset data for key: ${key}`, asset);
                return null; // Skip this asset if it's missing required data
            }
    
            const price = prices[key] || 0;
            const totalValue = (parseFloat(asset.balance) + parseFloat(asset.rewards)) * price;
    
            // Exclude specific keys from truncation
            const excludeTruncation = ['ophirRedemptionPrice', 'treasuryValueWithoutOphir', 'totalTreasuryValue'];
            let truncatedKey = key;
            if (!excludeTruncation.includes(key) && key.length > 15) {
                truncatedKey = `${key.substring(0, 8)}...`;
            }
            
            return { key: truncatedKey, originalKey: key, ...asset, totalValue };
        }).filter(asset => asset && asset.totalValue > 0); // Filter out assets with a total value of 0 or missing data
    
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
          if (!asset) return; // Skip if asset is null
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
            // Check if data[key] is not null or undefined before proceeding
            if (!data[key]) {
                console.warn(`Missing data for key: ${key}`);
                continue; // Skip this iteration if data[key] is null or undefined
            }
    
            // Exclude the "ophir" key
            if (key === 'ophir') {
                continue;
            }
            if (data[key].hasOwnProperty('balance')) {
                // Ensure priceData[key] is not undefined before attempting multiplication
                if(isNaN(data[key].balance * priceData[key])){
                    continue;
                }
                formattedData.push({
                    name: key,
                    value: parseFloat((data[key].balance * priceData[key]))
                });
            }
        }
    
        return formattedData;
    }


    if (!ophirStats && showProgressBar) {
        return (
          <>
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="text-white mb-4">Fetching On-Chain Data...</div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
          </>
        );
    }

    

    const renderTabContent = () => {
        switch (activeTab) {
            case 'treasury':
                return (
                    // Existing Ophir Treasury JSX goes here
                    <div className="p-3">
                        {/* <div className="text-3xl font-bold text-white mb-4">Ophir Treasury</div> */}
                        <div className="treasury-content overflow-x-auto">
                        <table className="max-w-full mx-auto table-auto sm:w-full">
                            <thead className="treasury-header text-black">
                                <tr>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xxs sm:text-xs">Asset</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xxs sm:text-xs">Balance</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xxs sm:text-xs hover:cursor-pointer" onClick={toggleSortOrder}>Value (USD)</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xxs sm:text-xs">Rewards</th>
                                    <th className="text-center py-1 px-1 uppercase font-semibold text-xxs sm:text-xs">Location</th>
                                </tr>
                            </thead>
                            <tbody className="text-white text-xxs md:text-sm sm:text-lg">
                                {Object.entries(sortAssetsByValue(ophirTreasury, priceData, sort)).filter(([key]) => key !== 'totalTreasuryValue' && key !== 'treasuryValueWithoutOphir' && key !== 'ophirRedemptionPrice').map(([key, value]) => (
                                    <tr className={`... ${value.composition ? 'hover:cursor-pointer hover:bg-yellow-400 hover:text-black' : ''}`} key={key}>
                                        <td className="text-left asset-padding py-4 px-1 sm:px-1" title={value?.originalKey} onClick={() => handleCellClick(value, key)}>
                                            <div className="flex items-center">
                                                {Array.isArray(tokenImages[key]) ? 
                                                    tokenImages[key].map((imgUrl, index) => (
                                                        // Adjust the base size to be slightly larger, e.g., h-5 w-5
                                                        <img key={index} src={imgUrl} alt={`${key}-${index}`} className={`h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-11 lg:w-11 mr-2 ${tokenImages[key].length > 1 ? 'sm:h-5 sm:w-5' : ''}`} />
                                                    ))
                                                    :
                                                    // Adjust the base size for single images as well
                                                    <img src={tokenImages[key]}  alt={key} className="h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-11 lg:w-11 mr-2" />
                                                }
                                                <span className="hidden sm:inline">{key}</span>
                                            </div>
                                        </td>
                                        <td className="text-center py-4 px-1 sm:px-1" onClick={() => handleCellClick(value, key)}>{parseFloat(value.balance).toLocaleString()}</td>
                                        <td className="text-center py-4 px-1 sm:px-1" onClick={() => handleCellClick(value, key)}>${!isNaN(value.balance * priceData[key]) ? formatNumber((value.balance * priceData[key]), 2) : 0}</td>
                                        <td className="text-center py-4 px-1 sm:px-1 cursor-pointer" onClick={() => handleRewardsClick(value.location)}>
                                            {renderRewards(value)}
                                        </td>
                                        <td className="text-center py-2 px-1 sm:px-1" onClick={() => handleCellClick(value, key)}>{value.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                        <div className="flex justify-center pb-2 pie-chart-container">
                            <CryptoPieChart data={formatDataForChart(ophirTreasury)} />
                        </div>
                        
                    </div>
                );
            case 'charts':
                return (
                    <div>
                        <Charts />
                    </div>
                );
            case 'prices':
                return <PriceDisplay priceData={priceData} />;
            case 'nfts':
                return <NFTGallery prices={priceData} runestoneData={runestoneData}/>;
            default:
                return null;
        }
    };

  return (
    <>
        {ophirStats && ophirTreasury && priceData &&
            <div className="pt-12 page-wrapper global-bg text-white min-h-screen">
                <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    {alertInfo.htmlContent ? (
                        <SnackbarContent
                            style={{color: 'black', backgroundColor: alertInfo.severity === 'error' ? '#ffcccc' : '#ccffcc' }} // Adjusted colors to be less harsh
                            message={<span dangerouslySetInnerHTML={{ __html: alertInfo.htmlContent }} />}
                        />
                    ) : (
                        <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                            {alertInfo.message}
                        </Alert>
                    )}
                </Snackbar>
                <div className="p-3">
                    <div className="title text-3xl font-bold text-white">Ophir Statistics</div>
                    <div className="tot-treasury-wrapper">
                            <div className="tot-treasury-div rounded-lg p-2 shadow-md min-w-[250px] m-2 flex flex-col items-center justify-center cursor-pointer" onClick={toggleBitcoinDenomination}>
                                <img src="https://i.ibb.co/d5rJ2qd/7185535-yellow.png" alt="Icon" className="h-8 w-8 mb-1" />
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
                    <div className="
                    grid 
                    grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
                    ">
                        {/* Ophir Price */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Price</div>
                            <div className="sm:text-xl text-md">${formatNumber(ophirStats?.price, 5)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="Redemption Price">RP: ${formatNumber(redemptionPrice, 4)}</div>

                        </div>
                        {/* Market Cap */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://i.ibb.co/d20VfyL/3313489-200-yellow.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Market Cap</div>
                            <div className="sm:text-xl text-md" title="(ophir price) * (circulating supply)">${formatNumber(ophirStats?.marketCap,0)}</div>
                        </div>
                        {/* FDV */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://i.ibb.co/RpV2Lq9/70884-200-yellow.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">FDV</div>
                            <div className="sm:text-xl text-md" title="(ophir price) * (total supply)">${formatNumber(ophirStats?.fdv,0)}</div>
                        </div>
                        {/* Ophir Mine */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center" title="Ophir that will be distributed to stakers...">
                            <img src="https://i.ibb.co/bQbQ8vs/5895891-yellow.png" alt="Icon" className="h-8 w-8 mb-1" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Mined Ophir</div>
                            <div className="sm:text-xl text-md ">{formatNumber(ophirStats?.ophirInMine,0)}</div>
                        </div>
                        {/* Circulating Supply */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://i.ibb.co/wLDhcxv/3844310-200-yellow.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Circulating Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.circulatingSupply,0)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="(circulating supply / total supply) * 100">{formatNumber(getPercentageOfTotalOphirSupply(ophirStats?.circulatingSupply),2)}%</div>

                        </div>
                        {/* Staked Supply */}
                        <div className="stats-divs rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://i.ibb.co/WnspwH3/904757-200-yellow.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Staked Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.stakedSupply,0)}</div>
                            <div className="sm:text-sm text-sm text-center text-slate-600" title="(staked supply / total supply) * 100">{formatNumber(getPercentageOfTotalOphirSupply(ophirStats?.stakedSupply),2)}%</div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-left space-x-4 p-4">
                    <button
                        className={`text-base md:text-lg lg:text-xl font-bold mb-1 hover:cursor-pointer px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 rounded-full border-2 border-gold shadow-lg transform transition duration-300 ease-in-out hover:scale-105 ${activeTab === 'treasury' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white'}`}
                        onClick={() => setActiveTab('treasury')}
                    >
                        Treasury
                    </button>
                    <button
                        className={`text-base md:text-lg lg:text-xl font-bold mb-1 hover:cursor-pointer px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 rounded-full border-2 border-gold shadow-lg transform transition duration-300 ease-in-out hover:scale-105 ${activeTab === 'charts' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white'}`}
                        onClick={() => setActiveTab('charts')}                            
                    >
                        Charts
                    </button>
                    <button
                        className={`text-base md:text-lg lg:text-xl font-bold mb-1 hover:cursor-pointer px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 rounded-full border-2 border-gold shadow-lg transform transition duration-300 ease-in-out hover:scale-105 ${activeTab === 'nfts' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white'}`}
                        onClick={() => setActiveTab('nfts')}
                    >
                        NFTs
                    </button>
                    <button
                        className={`text-base md:text-lg lg:text-xl font-bold mb-1 hover:cursor-pointer px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 rounded-full border-2 border-gold shadow-lg transform transition duration-300 ease-in-out hover:scale-105 ${activeTab === 'prices' ? 'bg-yellow-400 text-black' : 'bg-transparent text-white'}`}
                        onClick={() => setActiveTab('prices')}
                    >
                        Prices
                    </button>
                </div>
                {renderTabContent()}
                <Modal isOpen={isModalOpen} onClose={toggleModal} data={modalData} />
            </div>
        }
    </>
  );
};

export default AnalyticsDashboard;
