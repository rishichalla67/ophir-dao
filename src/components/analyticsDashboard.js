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
    
    const fetchData = async () => {
        try {
            const response = await axios.get('https://parallax-analytics.onrender.com/ophir/stats');
            setOphirStats(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    if (!ophirStats) {
        return (
          <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
        );
      }
  return (
    <>
        {ophirStats && 
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
            </div>
        }
    </>
  );
};

export default AnalyticsDashboard;
