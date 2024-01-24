import React from 'react';
import Nav from './nav';

const Card = ({ title, value, additionalInfo, icon }) => {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex items-center">
        <div className="mr-4">
          {icon ? (
            <img src={icon} alt="Icon" className="h-8 w-8" /> // Adjust the size as needed
          ) : (
            <div className="bg-yellow-400 p-2 rounded-full" /> // Default placeholder
          )}
        </div>
        <div>
          <div className="text-sm">{title}</div>
          <div className="text-lg font-bold">{value}</div>
          {additionalInfo && <div className="text-xs text-gray-400">{additionalInfo}</div>}
        </div>
      </div>
    );
};



const AnalyticsDashboard = () => {
  return (
    <>
        <div className="pt-12 bg-black text-white min-h-screen">
            <div className="p-6 bg-black">
            <div className="text-3xl font-bold text-white mb-4">Ophir Statistics</div>
                <div className="
                grid 
                grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
                ">
                    {/* Ophir Price */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">Price</div>
                        <div className="text-xl sm:text-lg">${0}</div>
                    </div>
                    {/* Market Cap */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://static.thenounproject.com/png/3313489-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">Market Cap</div>
                        <div className="text-xl">${0}</div>
                    </div>
                    {/* FDV */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://static.thenounproject.com/png/70884-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">FDV</div>
                        <div className="text-xl">${0}</div>
                    </div>
                    {/* Circulating Supply */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://static.thenounproject.com/png/3313489-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">Circulating Supply</div>
                        <div className="text-xl">${0}</div>
                    </div>
                    {/* Staked Supply */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://static.thenounproject.com/png/3313489-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">Staked Supply</div>
                        <div className="text-xl">${0}</div>
                    </div>
                    {/* Total Supply */}
                    <div className="bg-yellow-400 text-black rounded-lg p-4 shadow-md min-w-[100px] m-2 flex flex-col items-center justify-center">
                        <img src="https://static.thenounproject.com/png/3313489-200.png" alt="Icon" className="h-8 w-8 mb-2" />
                        <div className="sm:text-2xl text-lg font-bold mb-1">Total Supply</div>
                        <div className="sm:text-xl text-lg ">1,000,000,000</div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default AnalyticsDashboard;
