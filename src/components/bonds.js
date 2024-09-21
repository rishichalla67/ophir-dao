import React, { useState } from 'react';
import WalletConnect from "./walletConnect";

const bondData = [
  { name: 'OPHIR', status: 'COMPLETED', totalBonded: '50,000,000', purchasingDenom: 'USDC', price: '0.0025', ratio: '8%' },
  { name: 'qcFUZN', status: 'MATURE', totalBonded: '125,000', purchasingDenom: 'USK', price: '0.0575', ratio: '100%' },
  // Add more mock data here...
];

const Bonds = () => {
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address);
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  return (
    <div className="global-bg text-white min-h-screen w-full pt-20 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold h1-color">Bond Listing</h1>
          <div className="flex space-x-4 items-center">
            <button className="landing-button px-4 py-1.5 rounded-md hover:bg-yellow-500 transition duration-300 text-sm">Create Bond</button>
            <WalletConnect
              handleConnectedWalletAddress={handleConnectedWalletAddress}
              handleLedgerConnectionBool={handleLedgerConnection}
            />
          </div>
        </div>

        <div className="mb-6">
          <span className="mr-4">Filter by</span>
          <select className="input-bg px-3 py-1 rounded-md mr-2">
            <option>STATUS</option>
          </select>
          <select className="input-bg px-3 py-1 rounded-md">
            <option>TOKEN</option>
          </select>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-2">Bond Name</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Total Bonded Tokens</th>
              <th className="text-left py-2">Purchasing Denom</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Ratio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bondData.map((bond, index) => (
              <tr key={index} className="border-b border-gray-800">
                <td className="py-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full mr-2 ${bond.name === 'OPHIR' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
                  {bond.name}
                </td>
                <td className={`py-4 ${bond.status === 'COMPLETED' ? 'text-blue-400' : 'text-green-400'}`}>{bond.status}</td>
                <td className="py-4">{bond.totalBonded}</td>
                <td className="py-4 flex items-center">
                  <div className="w-6 h-6 bg-blue-400 rounded-full mr-2"></div>
                  {bond.purchasingDenom}
                </td>
                <td className="py-4">{bond.price}</td>
                <td className="py-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    {bond.ratio}
                  </div>
                </td>
                <td className="py-4">
                  <button className="text-gray-400 hover:text-white transition duration-300">→</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bonds;
