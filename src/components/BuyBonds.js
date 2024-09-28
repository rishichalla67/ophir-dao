import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from "./walletConnect";
import { tokenMappings } from "../helper/tokenMappings";
import { daoConfig } from "../helper/daoConfig";
import { tokenImages } from "../helper/tokenImages";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { SigningStargateClient } from "@cosmjs/stargate";
import Countdown from 'react-countdown';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const BuyBonds = () => {
  const { bondId } = useParams();
  const navigate = useNavigate();
  const [bond, setBond] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  const [isTestnet, setIsTestnet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(null);

  const migalooRPC = "https://migaloo-rpc.polkachu.com/";
  const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";
  const rpc = isTestnet ? migalooTestnetRPC : migalooRPC;
  const contractAddress = daoConfig.BONDS_CONTRACT_ADDRESS_TESTNET;

  useEffect(() => {
    fetchBondDetails();
  }, [bondId]);

  const getSigner = async () => {
    if (window.keplr?.experimentalSuggestChain) {
      await window.keplr?.experimentalSuggestChain({
        chainId: "narwhal-2",
        chainName: "Migaloo Testnet",
        rpc: rpc,
        rest: "https://migaloo-testnet-api.polkachu.com",
        bip44: { coinType: 118 },
        bech32Config: {
          bech32PrefixAccAddr: "migaloo",
          bech32PrefixAccPub: "migaloopub",
          bech32PrefixValAddr: "migaloovaloper",
          bech32PrefixValPub: "migaloovaloperpub",
          bech32PrefixConsAddr: "migaloovalcons",
          bech32PrefixConsPub: "migaloovalconspub",
        },
        currencies: [{ coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 }],
        feeCurrencies: [{ coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 }],
        stakeCurrency: { coinDenom: "whale", coinMinimalDenom: "uwhale", coinDecimals: 6 },
        gasPriceStep: { low: 0.2, average: 0.45, high: 0.75 },
      });
    }
  
    await window.keplr?.enable("narwhal-2");
    const offlineSigner = window.keplr?.getOfflineSigner("narwhal-2");
    return offlineSigner;
  };

  const queryContract = async (message) => {
    try {
      const signer = await getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
  
      // Query the smart contract directly using SigningCosmWasmClient.queryContractSmart
      const queryResponse = await client.queryContractSmart(
        contractAddress,
        message
      );
  
      console.log(queryResponse);
  
      return queryResponse;
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract. ${error.message}`, "error");
    }
  };

  const fetchBondDetails = async () => {
    try {
      const queryMsg = { get_bond_offer: { bond_id: bondId } };
      const result = await queryContract(queryMsg);
      console.log(result);
      setBond(result);
    } catch (error) {
      console.error("Error fetching bond details:", error);
      showAlert("Error fetching bond details", "error");
    }
  };

  const getTokenSymbol = (denom) => {
    return tokenMappings[denom]?.symbol || denom;
  };

  const getBondStatus = (bond) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < bond.start_time) return "Upcoming";
    if (now >= bond.start_time && now <= bond.end_time) return "Active";
    if (now > bond.end_time && now < bond.maturity_date) return "Ended";
    return "Matured";
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const showAlert = (message, severity = 'info') => {
    setAlertInfo({ open: true, message, severity });
  };

  const handleConnectedWalletAddress = async (address) => {
    setConnectedWalletAddress(address);
    if (address && bond) {
      await fetchUserBalance(address, bond.purchasing_denom);
    }
  };

  const fetchUserBalance = async (address, denom) => {
    try {
      const signer = await getSigner();
      const client = await SigningStargateClient.connectWithSigner(rpc, signer);
      const balance = await client.getBalance(address, denom);
      const tokenInfo = tokenMappings[denom] || { decimals: 6 };
      const formattedBalance = parseFloat(balance.amount) / Math.pow(10, tokenInfo.decimals);
      setUserBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching user balance:", error);
      showAlert("Error fetching user balance", "error");
    }
  };

  useEffect(() => {
    fetchBondDetails();
  }, [bondId]);

  useEffect(() => {
    if (connectedWalletAddress && bond) {
      fetchUserBalance(connectedWalletAddress, bond.purchasing_denom);
    }
  }, [connectedWalletAddress, bond]);

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const signer = await getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      
      const purchaseMsg = {
        purchase_bond: {
          bond_id: bondId,
          amount: purchaseAmount
        }
      };

      const fee = {
        amount: [{ denom: "uwhale", amount: "5000" }],
        gas: "500000",
      };

      const result = await client.execute(
        connectedWalletAddress,
        contractAddress,
        purchaseMsg,
        fee,
        `Purchase Bond: ${bondId}`
      );

      console.log(result);
      showAlert("Bond purchased successfully!", "success");
      setPurchaseAmount('');
    } catch (error) {
      console.error("Error purchasing bond:", error);
      showAlert(`Error purchasing bond: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const CountdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span>Bond is now active!</span>;
    } else {
      return (
        <div className="text-center">
          <div className="text-xl sm:text-3xl font-bold mb-2">Bond Purchase Opens In...</div>
          <div className="flex justify-center space-x-2 sm:space-x-4">
            {[
              { value: days, label: "Days" },
              { value: hours, label: "Hours" },
              { value: minutes, label: "Min" },
              { value: seconds, label: "Sec" }
            ].map(({ value, label }) => (
              <div key={label} className="bg-gray-700 rounded-lg p-2 sm:p-3 w-16 sm:w-24">
                <div className="text-lg sm:text-2xl font-bold">{value}</div>
                <div className="text-xs sm:text-sm text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  if (!bond) {
    return (<>
      <div className="global-bg flex flex-col justify-center items-center h-screen">
          <div className="text-white mb-4">Fetching Bond Data...</div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    </>);
  }

  const bondSymbol = getTokenSymbol(bond.token_denom);
  const purchasingSymbol = getTokenSymbol(bond.purchasing_denom);

  const handleGoBack = () => {
    navigate('/bonds');
  };

  const isBondActive = getBondStatus(bond) === "Active";

  return (
    <div className="global-bg text-white min-h-screen w-full pt-20 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center text-gray-300 hover:text-white transition duration-300"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Bonds
        </button>

        <h1 className="text-3xl font-bold mb-8 h1-color">{bond.bond_denom_name} Details</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Bond ID:</p>
              <p>{bond.bond_id}</p>
            </div>
            <div>
              <p className="text-gray-400">Status:</p>
              <p>{getBondStatus(bond)}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Supply:</p>
              <p>{bond.total_supply / 1000000} {bondSymbol}</p>
            </div>
            <div>
              <p className="text-gray-400">Price:</p>
              <p>{bond.price / 1000000} {purchasingSymbol}</p>
            </div>
            <div>
              <p className="text-gray-400">Maturity Date:</p>
              <p>{formatDate(bond.maturity_date)}</p>
            </div>
          </div>
          
          {getBondStatus(bond) === "Upcoming" && (
            <div className="mt-6 p-2 sm:p-4 bg-gray-700 rounded-lg overflow-hidden">
              <Countdown
                date={bond.start_time * 1000}
                renderer={CountdownRenderer}
              />
            </div>
          )}
        </div>

        {isBondActive && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Purchase Bond</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Amount to Purchase ({purchasingSymbol})</label>
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                className="input-bg w-full px-3 py-2 rounded-md"
                placeholder={`Enter amount in ${purchasingSymbol}`}
              />
              {userBalance !== null && (
                <p className="text-xs text-gray-400 mt-1">
                  Available: {userBalance.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})} {purchasingSymbol}
                </p>
              )}
            </div>
            <div className="flex justify-between items-center">
              <WalletConnect handleConnectedWalletAddress={handleConnectedWalletAddress} />
              <button
                onClick={handlePurchase}
                disabled={!connectedWalletAddress || isLoading}
                className="landing-button px-4 py-2 rounded-md hover:bg-yellow-500 transition duration-300"
              >
                {isLoading ? 'Processing...' : 'Purchase Bond'}
              </button>
            </div>
          </div>
        )}

        <Snackbar
          open={alertInfo.open}
          autoHideDuration={6000}
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        >
          <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity}>
            {alertInfo.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default BuyBonds;