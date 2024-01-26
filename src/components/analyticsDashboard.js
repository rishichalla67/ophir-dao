import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatNumber = (number, digits) => {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };



const AnalyticsDashboard = () => {
    const [ophirStats, setOphirStats] = useState(null);
    const [ophirTreasury, setOphirTreasury] = useState(null);
    const [priceData, setPriceData] = useState(null);
    const [inBitcoin, setInBitcoin] = useState(false);
    const [inLuna, setInLuna] = useState(false);

    

    const formatNumberInBitcoin = (number) => {
        let numericValue = typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
        if (isNaN(numericValue)) {
            throw new Error('Invalid number input');
        }
        return formatNumber(numericValue / priceData['wBTC'], 4);
    }

    const fetchData = async () => {
        try {
            const statsResponse = await axios.get('https://parallax-analytics.onrender.com/ophir/stats');
            const treasuryResponse = await axios.get('https://parallax-analytics.onrender.com/ophir/treasury');
            const prices = await axios.get('https://parallax-analytics.onrender.com/ophir/prices');
            setOphirStats(statsResponse.data);
            setOphirTreasury(treasuryResponse.data);
            setPriceData(prices.data);
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

    if (!ophirStats) {
        return (
          <div className="flex justify-center items-center h-screen">
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
                        {/* Circulating Supply */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/3844310-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Circulating Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.circulatingSupply,0)}</div>
                        </div>
                        {/* Staked Supply */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://static.thenounproject.com/png/904757-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Staked Supply</div>
                            <div className="sm:text-xl text-md">{formatNumber(ophirStats?.stakedSupply,0)}</div>
                        </div>
                        {/* Total Supply */}
                        <div className="bg-yellow-400 text-black rounded-lg p-2 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                            <img src="https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/speedometer-512.png" alt="Icon" className="h-8 w-8 mb-1" />
                            <div className="sm:text-2xl text-sm font-bold mb-1 text-center">Total Supply</div>
                            <div className="sm:text-xl text-md ">{formatNumber(ophirStats?.totalSupply,0)}</div>
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-black">
                    <div className="text-3xl font-bold text-white mb-4">Ophir Treasury</div>
                    <div className="overflow-x-auto pb-2">
                    <table className="max-w-full bg-black mx-auto">
                        <thead className="bg-yellow-400 text-black">
                        <tr>
                            <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Asset</th>
                            <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Balance</th>
                            <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Value (USD)</th>
                            <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Pending Rewards</th>
                            <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Location</th>
                        </tr>
                        </thead>
                        <tbody className="text-white">
                        {Object.entries(ophirTreasury).filter(([key]) => key !== 'totalTreasuryValue' && key !== 'treasuryValueWithoutOphir').map(([key, value]) => (
                            <tr key={key}>
                                <td className="text-left py-3 px-4">{key}</td>
                                <td className="text-center py-3 px-4">{parseFloat(value.balance).toLocaleString()}</td>
                                <td className="text-center py-3 px-4">${!isNaN(value.balance * priceData[key]) ? formatNumber((value.balance * priceData[key]), 2) : 0}</td>
                                {inLuna ? 
                                    <td className="text-center py-3 px-4 cursor-pointer" onClick={toggleLunaDenomination}>{value.rewards && value.location === 'allianceStake' && `${parseFloat(value.rewards).toLocaleString()} luna`}</td>
                                    :
                                    <td className="text-center py-3 px-4 cursor-pointer" onClick={toggleLunaDenomination}>{value.rewards && value.location === 'allianceStake' && `$${formatNumber(parseFloat(value.rewards),2)}`}</td>
                                }
                                <td className="text-center py-3 px-4">{value.location}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                    <div className="mx-[10dvw]">
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
                
            </div>
        }
    </>
  );
};

export default AnalyticsDashboard;
