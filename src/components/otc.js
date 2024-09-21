import React, { useState, useMemo, useEffect } from 'react';
import WalletConnect from "./walletConnect";
import { tokenMappings } from '../helper/tokenMappings';
import { tokenImages } from '../helper/tokenImages';
import { SigningStargateClient } from "@cosmjs/stargate";

// Add these constants at the top of your file
const MAINNET_CHAIN_ID = "migaloo-1";
const TESTNET_CHAIN_ID = "narwhal-2";
const MAINNET_RPC = "https://migaloo-rpc.polkachu.com/";
const TESTNET_RPC = "https://migaloo-testnet-rpc.polkachu.com:443";

const getUniqueAssets = () => {
  const uniqueSymbols = new Set();
  const assets = [];

  Object.values(tokenMappings).forEach(token => {
    const lowerSymbol = token.symbol.toLowerCase();
    if (!uniqueSymbols.has(lowerSymbol) && lowerSymbol !== 'ophir' && lowerSymbol !== 'bophir01') {
      uniqueSymbols.add(lowerSymbol);
      assets.push({
        symbol: token.symbol,
        name: token.symbol,
        image: tokenImages[lowerSymbol] || '',
      });
    }
  });

  return assets;
};

const AssetImage = ({ image, symbol }) => {
  if (Array.isArray(image)) {
    return (
      <div className="flex">
        {image.map((src, index) => (
          <img key={index} src={src} alt={`${symbol} ${index + 1}`} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full mr-1" />
        ))}
      </div>
    );
  }
  return image ? <img src={image} alt={symbol} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2" /> : null;
};

const OTCDesk = () => {
  const supportedAssets = useMemo(() => getUniqueAssets(), []);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(supportedAssets[0]);
  const [amount, setAmount] = useState("");
  const [estimatedOPHIR, setEstimatedOPHIR] = useState("0");
  const [assetBalances, setAssetBalances] = useState({});
  const [isTestnet, setIsTestnet] = useState(false);
  const [chainId, setChainId] = useState(MAINNET_CHAIN_ID);
  const [rpc, setRpc] = useState(MAINNET_RPC);

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address);
    if (address) {
      checkBalances(address);
    } else {
      setAssetBalances({});
    }
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  const handleAssetChange = (e) => {
    setSelectedAsset(supportedAssets.find(asset => asset.symbol === e.target.value));
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    // Mock calculation - replace with actual rate calculation
    setEstimatedOPHIR((parseFloat(e.target.value) * 100).toFixed(2));
  };

  const handleSwap = () => {
    // Implement the swap logic here
    console.log(`Swapping ${amount} ${selectedAsset.symbol} for ${estimatedOPHIR} OPHIR`);
  };

  const checkBalances = async (address) => {
    try {
      if (!window.keplr) {
        console.error("Keplr wallet is not installed.");
        return;
      }

      await window.keplr.enable(chainId);
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);

      const balances = await client.getAllBalances(address);
      const formattedBalances = {};

      balances.forEach(balance => {
        const key = Object.keys(tokenMappings).find(key => 
          tokenMappings[key].denom === balance.denom
        );

        const symbol = key ? tokenMappings[key].symbol : null;

        console.log(symbol);
        if (symbol) {
          const amount = parseFloat(balance.amount) / Math.pow(10, tokenMappings[symbol].decimals || 6);
          formattedBalances[symbol] = amount.toFixed(6);
        }
      });

      // Add zero balances for supported assets not found in the wallet
      supportedAssets.forEach(asset => {
        if (!(asset.symbol in formattedBalances)) {
          formattedBalances[asset.symbol] = '0';
        }
      });

      console.log(formattedBalances);
      setAssetBalances(formattedBalances);
    } catch (error) {
      console.error("Error checking balances:", error);
    }
  };

  return (
    <div className="global-bg text-white min-h-screen w-full sm:pt-20 pt-20 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold h1-color mb-4 sm:mb-0">OTC Desk</h1>
          <WalletConnect
            handleConnectedWalletAddress={handleConnectedWalletAddress}
            handleLedgerConnectionBool={handleLedgerConnection}
          />
        </div>

        <div className="input-bg rounded-lg p-4 sm:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Asset</label>
            <select
              className="w-full input-bg px-3 py-2 rounded-md"
              onChange={handleAssetChange}
              value={selectedAsset.symbol}
            >
              {supportedAssets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>{asset.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="flex items-center">
              <input
                type="number"
                className="w-full input-bg px-3 py-2 rounded-l-md"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
              />
              <div className="px-3 py-2 rounded-r-md bg-gray-700 flex items-center">
                {selectedAsset.image ? (
                  <AssetImage image={selectedAsset.image} symbol={selectedAsset.symbol} />
                ) : (
                  <span>{selectedAsset.symbol}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Estimated OPHIR</label>
            <input
              type="text"
              className="w-full input-bg px-3 py-2 rounded-md"
              value={estimatedOPHIR}
              readOnly
            />
          </div>

          <button
            className="w-full landing-button px-4 py-2 rounded-md hover:bg-yellow-500 transition duration-300 text-sm sm:text-base"
            onClick={handleSwap}
            disabled={!connectedWalletAddress || amount <= 0}
          >
            Exchange for OPHIR
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Supported Assets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {supportedAssets.map((asset) => (
              <div key={asset.symbol} className="flex items-center">
                <AssetImage image={asset.image} symbol={asset.symbol} />
                <span className="text-sm sm:text-base">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>

        {connectedWalletAddress && Object.keys(assetBalances).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Asset Balances</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {supportedAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AssetImage image={asset.image} symbol={asset.symbol} />
                    <span className="text-sm sm:text-base ml-2">{asset.name}</span>
                  </div>
                  <span className="text-sm sm:text-base">{assetBalances[asset.symbol]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTCDesk;
