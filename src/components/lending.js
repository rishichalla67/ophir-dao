import "../App.css";
import WalletConnect from "./walletConnect";
import React, { useState, useEffect } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { tokenImages } from '../helper/tokenImages';
import { daoConfig } from "../helper/daoConfig";
import BigInt from "big-integer";

const migalooRPC = "https://migaloo-rpc.polkachu.com/";
const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";
const OPHIR_DECIMAL = BigInt(1000000);

const CryptoLendingMarket = () => {
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [ophirBalance, setOphirBalance] = useState(0);
  const [depositAsset, setDepositAsset] = useState('WBTC');
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAsset, setBorrowAsset] = useState('USDC');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [oraclePrices, setOraclePrices] = useState({});
  const [allBalances, setAllBalances] = useState({});
  const [chainId, setChainId] = useState("narwhal-2");
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address);
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  useEffect(() => {
    fetch("https://parallax-analytics.onrender.com/ophir/prices")
      .then((response) => response.json())
      .then((data) => {
        setOraclePrices(data);
      })
      .catch((error) => console.error("Error fetching Oracle prices:", error));
  }, []);

  const getSigner = async () => {
    if (window.keplr?.experimentalSuggestChain) {
      await window.keplr?.experimentalSuggestChain({
        // Chain details
        chainId: "narwhal-2",
        chainName: "Migaloo Testnet",
        rpc: "https://migaloo-testnet-rpc.polkachu.com:443", // Example RPC endpoint, replace with actual
        rest: "https://migaloo-testnet-api.polkachu.com", // Example REST endpoint, replace with actual
        bip44: {
          coinType: 118, // Example coinType, replace with actual
        },
        bech32Config: {
          bech32PrefixAccAddr: "migaloo",
          bech32PrefixAccPub: "migaloopub",
          bech32PrefixValAddr: "migaloovaloper",
          bech32PrefixValPub: "migaloovaloperpub",
          bech32PrefixConsAddr: "migaloovalcons",
          bech32PrefixConsPub: "migaloovalconspub",
        },
        currencies: [
          {
            // Example currency, replace with actual
            coinDenom: "whale",
            coinMinimalDenom: "uwhale",
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            // Example fee currency, replace with actual
            coinDenom: "whale",
            coinMinimalDenom: "uwhale",
            coinDecimals: 6,
          },
        ],
        stakeCurrency: {
          // Example stake currency, replace with actual
          coinDenom: "whale",
          coinMinimalDenom: "uwhale",
          coinDecimals: 6,
        },
        gasPriceStep: {
          low: 0.2,
          average: 0.45,
          high: 0.75,
        },
      });

      // After suggesting the chain, prompt the user to add the OPHIR DAO denom to their Keplr wallet
      // await window.keplr.experimentalSuggestToken(chainId, isTestnet ? OPHIR_DENOM_TESNET : OPHIR_DENOM, "OPHIR", "https://raw.githubusercontent.com/cosmos/chain-registry/master/migaloo/images/ophir.png", 6);
    }

    await window.keplr?.enable(chainId);
    const offlineSigner = window.keplr?.getOfflineSigner(chainId);
    return offlineSigner;
  };

  const checkBalance = async (address) => {
    const signer = await getSigner(); // Assuming getSigner is defined as shown previously

    // Connect with the signer to get a client capable of signing transactions
    const client = await SigningStargateClient.connectWithSigner(
      migalooRPC,
      signer
    ); // Use the mainnet RPC endpoint

    // Query all balances for the address
    const balances = await client.getAllBalances(address);
    console.log(balances);
    setAllBalances(balances);
    // Assuming OPHIR_DENOM is defined elsewhere in your code and represents the denom you're interested in
    const ophirBalance = balances.find(
      (balance) => balance.denom === daoConfig["OPHIR_DENOM"]
    );

    if (ophirBalance) {
      console.log(`Ophir Balance: ${ophirBalance.amount}`);
      return parseFloat(ophirBalance.amount) / OPHIR_DECIMAL; // Adjust the division based on the token's decimals, assuming OPHIR_DECIMAL is defined
    } else {
      console.log("Ophir Balance: 0");
      return 0;
    }
  };

  const assets = ['WHALE', 'ATOM', 'USDC'];
  const maxLTV = 0.6; // 60% max loan-to-value ratio

  const handleDepositAssetChange = (event) => {
    setDepositAsset(event.target.value);
  };

  const handleDepositAmountChange = (event) => {
    setDepositAmount(event.target.value);
  };

  const handleBorrowAssetChange = (event) => {
    setBorrowAsset(event.target.value);
  };

  const handleBorrowAmountChange = (event) => {
    setBorrowAmount(event.target.value);
  };

  const handleBorrow = () => {
    // Implement borrow logic here
    console.log("Borrowing", borrowAmount, borrowAsset);
  };

  // Helper function to render asset icon (you'll need to implement this)
  const renderAssetIcon = (asset) => {
    const lowerAsset = asset.toLowerCase();
    const iconUrl = tokenImages[lowerAsset] || tokenImages[asset] || null;
    
    if (iconUrl) {
      return <img src={iconUrl} alt={asset} className="w-6 h-6 mr-2 inline-block" />;
    } else {
      return <span className="mr-2">{asset.charAt(0)}</span>; // Fallback to first letter if no icon found
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white pt-16">
      <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
        <WalletConnect
          handleConnectedWalletAddress={handleConnectedWalletAddress}
          handleLedgerConnectionBool={handleLedgerConnection}
        />
      </div>
      <div className="w-full max-w-4xl p-6 rounded-lg shadow-md">
        <div className="flex space-x-8">
          {/* Deposit column */}
          <div className="w-1/2">
            <h2 className="text-2xl font-bold mb-4">Deposit</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400">Select Asset</label>
                <span className="text-sm text-gray-400">Max: 19.090</span>
              </div>
              <select
                value={depositAsset}
                onChange={handleDepositAssetChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                {assets.map((asset) => (
                  <option key={asset} value={asset} className="flex items-center">
                    {renderAssetIcon(asset)} {asset}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <input
                type="number"
                value={depositAmount}
                onChange={handleDepositAmountChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>1 {depositAsset}</span>
                <span>$ 0.391</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value</span>
                <span>$ 0.000</span>
              </div>
            </div>
          </div>
          
          {/* Borrow column */}
          <div className="w-1/2">
            <h2 className="text-2xl font-bold mb-4">Borrow</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400">Select Asset</label>
                <span className="text-sm text-gray-400">Max: 0.000</span>
              </div>
              <select
                value={borrowAsset}
                onChange={handleBorrowAssetChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                {assets.map((asset) => (
                  <option key={asset} value={asset}>
                    {renderAssetIcon(asset)} {asset}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <input
                type="number"
                value={borrowAmount}
                onChange={handleBorrowAmountChange}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                placeholder="0"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>1 {borrowAsset}</span>
                <span>$ 1.000</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value</span>
                <span>$ 0.000</span>
              </div>
              <div className="flex justify-between">
                <span>LTV</span>
                <span>0.00%</span>
              </div>
              <div className="flex justify-between">
                <span>Max LTV</span>
                <span>60.00%</span>
              </div>
              <div className="flex justify-between">
                <span>Borrow Fee</span>
                <span>0.000 {borrowAsset}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate</span>
                <span>4.32%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              ⓘ Interest rates are dynamic based on demand. <a href="#" className="text-blue-400">Learn more</a>
            </div>
            <button
              onClick={handleBorrow}
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors mt-4"
            >
              Borrow {borrowAsset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoLendingMarket;