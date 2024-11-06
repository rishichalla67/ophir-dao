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
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const formatAmount = (amount) => {
  if (!amount) return '0';
  if (parseFloat(amount) < 1) {
    return amount;
  }
  return (parseInt(amount) / 1000000).toFixed(6);
};

const isSoldOut = (remainingSupply) => {
  return parseInt(remainingSupply) / 1000000 < 0.00001;
};

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
  const [userBonds, setUserBonds] = useState([]);
  const [walletBalances, setWalletBalances] = useState({});
  const [userBondPurchase, setUserBondPurchase] = useState(null);

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
  
      const queryResponse = await client.queryContractSmart(
        contractAddress,
        message
      );
  
      console.log('Query Response:', queryResponse);
      return queryResponse;
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract: ${error.message}`, "error");
      throw error;
    }
  };

  const fetchBondDetails = async () => {
    try {
      const queryMsg = { get_bond_offer: { bond_id: parseInt(bondId) } };
      const result = await queryContract(queryMsg);
      
      if (!result || !result.bond_offer) {
        throw new Error('Invalid response format from contract');
      }
      
      console.log('Fetched bond details:', result);
      setBond(result.bond_offer);
    } catch (error) {
      console.error("Error fetching bond details:", error);
      showAlert(`Error fetching bond details: ${error.message}`, "error");
    }
  };

  const getTokenSymbol = (denom) => {
    return tokenMappings[denom]?.symbol || denom;
  };

  const getBondStatus = (bond) => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = Math.floor(parseInt(bond.purchase_start_time) / 1_000_000_000);
    const endTime = Math.floor(parseInt(bond.purchase_end_time) / 1_000_000_000);
    const maturityDate = Math.floor(parseInt(bond.claim_end_time) / 1_000_000_000);

    if (now < startTime) return "Upcoming";
    if (now >= startTime && now <= endTime) return "Active";
    if (now > endTime && now < maturityDate) return "Ended";
    return "Matured";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const milliseconds = Number(timestamp) / 1_000_000;
      return new Date(milliseconds).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  const handleConnectedWalletAddress = async (address) => {
    console.log("Received wallet address:", address);

    if (!address) {
      setConnectedWalletAddress('');
      setWalletBalances({});
      setUserBonds([]);
      return;
    }

    setConnectedWalletAddress(address);
    try {
      const queryMsg = { 
        get_bond_purchase: { 
          bond_id: parseInt(bondId),
          buyer: address
        } 
      };
      const result = await queryContract(queryMsg);
      console.log('User bond purchase:', result);
      setUserBonds(result.bond_purchases || []);
    } catch (error) {
      console.error("Error fetching user bond purchase:", error);
      showAlert(`Error fetching user bond purchase: ${error.message}`, "error");
    }
  };

  useEffect(() => {
    if (connectedWalletAddress) {
      checkBalances();
    }
  }, [connectedWalletAddress]);

  const fetchUserBalance = async (address, denom) => {
    if (!address || !denom) {
      console.log('Missing address or denom for balance fetch');
      return;
    }

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

  const fetchUserBonds = async (address) => {
    try {
      const queryMsg = { 
        get_bonds_by_user: { 
          buyer: address 
        } 
      };
      const result = await queryContract(queryMsg);
      console.log('User bonds:', result);
      setUserBonds(result.bond_purchases || []);
    } catch (error) {
      console.error("Error fetching user bonds:", error);
      showAlert(`Error fetching user bonds: ${error.message}`, "error");
    }
  };

  const fetchUserBondPurchase = async (address) => {
    try {
      console.log('Fetching user bond purchase for:', {
        bondId,
        address
      });
      
      const queryMsg = { 
        get_bond_purchase: { 
          bond_id: parseInt(bondId),
          buyer: address
        } 
      };
      console.log('Query message:', queryMsg);
      
      const result = await queryContract(queryMsg);
      console.log('User bond purchase result:', result);
      
      setUserBondPurchase(result.bond_purchases?.[0] || null);
      console.log('Updated userBondPurchase state:', result.bond_purchases?.[0] || null);
    } catch (error) {
      console.error("Error fetching user bond purchase:", error);
    }
  };

  useEffect(() => {
    fetchBondDetails();
  }, [bondId]);

  useEffect(() => {
    if (connectedWalletAddress && bond?.purchasing_denom) {
      console.log("useEffect triggered with:", {
        connectedWalletAddress,
        purchasingDenom: bond.purchasing_denom,
        bondId
      });
      
      const fetchData = async () => {
        await Promise.all([
          fetchUserBalance(connectedWalletAddress, bond.purchasing_denom),
          fetchUserBondPurchase(connectedWalletAddress)
        ]);
      };

      fetchData();
    }
  }, [connectedWalletAddress, bond]);

  const handleLedgerConnectionBool = (bool) => {
    setIsLedgerConnected(bool);
  };

  const calculateMaxPurchaseAmount = (bond) => {
    if (!bond || !bond.remaining_supply || !bond.price) return 0;
    const remainingSupply = parseFloat(formatAmount(bond.remaining_supply));
    const price = parseFloat(formatAmount(bond.price));
    return remainingSupply * price;
  };

  const validatePurchaseAmount = (amount) => {
    if (!amount || !bond) return true;
    const purchaseAmountNum = parseFloat(amount);
    const maxPurchaseAmount = calculateMaxPurchaseAmount(bond);
    return purchaseAmountNum <= maxPurchaseAmount;
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const purchaseAmountNum = parseFloat(purchaseAmount);
      const maxPurchaseAmount = calculateMaxPurchaseAmount(bond);
      
      if (purchaseAmountNum > maxPurchaseAmount) {
        throw new Error(`Purchase amount exceeds maximum allowed: ${maxPurchaseAmount.toFixed(6)} ${purchasingSymbol}`);
      }

      const signer = await getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      
      const tokenDecimals = tokenMappings[bond.purchase_denom]?.decimals || 6;
      const purchaseAmountInMicroUnits = Math.floor(
        purchaseAmountNum * Math.pow(10, tokenDecimals)
      ).toString();
      
      const purchaseMsg = {
        buy_bond: {
          bond_id: parseInt(bondId)
        }
      };

      const funds = [{
        denom: bond.purchase_denom,
        amount: purchaseAmountInMicroUnits
      }];

      const fee = {
        amount: [{ denom: "uwhale", amount: "50000" }],
        gas: "500000",
      };

      console.log('Executing purchase with:', {
        purchaseMsg,
        funds,
        fee
      });

      const result = await client.execute(
        connectedWalletAddress,
        contractAddress,
        purchaseMsg,
        fee,
        `Purchase Bond: ${bondId}`,
        funds
      );

      console.log('Purchase result:', result);
      if (result.transactionHash) {
        const baseTxnUrl = isTestnet
          ? "https://ping.pfc.zone/narwhal-testnet/tx"
          : "https://inbloc.org/migaloo/transactions";
        const txnUrl = `${baseTxnUrl}/${result.transactionHash}`;
        showAlert(
          `Bond purchased successfully! Transaction Hash: ${result.transactionHash}`,
          "success",
          `<a href="${txnUrl}" target="_blank">View Transaction</a>`
        );
      } else {
        showAlert("Bond purchased successfully!", "success");
      }
      setPurchaseAmount('');
      
      if (connectedWalletAddress && bond?.purchasing_denom) {
        await fetchUserBalance(connectedWalletAddress, bond.purchasing_denom);
      }
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
      const formattedDays = Math.floor(days);

      return (
        <div className="text-center">
          <div className="text-xl sm:text-3xl font-bold mb-2">Bond Purchase Opens In...</div>
          <div className="flex justify-center space-x-2 sm:space-x-4">
            {[
              { value: formattedDays, label: "Days" },
              { value: hours, label: "Hours" },
              { value: minutes, label: "Min" },
              { value: seconds, label: "Sec" }
            ].map(({ value, label }) => (
              <div key={label} className="bg-gray-700 rounded-lg p-2 sm:p-3 w-16 sm:w-24">
                <div className="text-lg sm:text-2xl font-bold">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const calculateSoldPercentage = (remainingSupply, totalSupply) => {
    if (!remainingSupply || !totalSupply) return 0;
    const remaining = parseInt(remainingSupply);
    const total = parseInt(totalSupply);
    if (isNaN(remaining) || isNaN(total) || total === 0) return 0;
    const soldSupply = total - remaining;
    return Math.round((soldSupply / total) * 100);
  };

  const formatBondDenom = (denom) => {
    if (!denom) return '';
    return extractLastSection(denom);
  };

  const checkBalances = async () => {
    try {
      console.log("Checking balances for address:", connectedWalletAddress);

      if (!connectedWalletAddress || connectedWalletAddress.trim() === '') {
        console.log('No wallet address available');
        return;
      }

      const signer = await getSigner();
      if (!signer) {
        console.log('No signer available');
        return;
      }

      const client = await SigningStargateClient.connectWithSigner(rpc, signer);
      const balances = await client.getAllBalances(connectedWalletAddress);
      console.log("Retrieved balances:", balances);

      const formattedBalances = balances.reduce((acc, balance) => {
        const tokenInfo = tokenMappings[balance.denom] || {
          symbol: balance.denom,
          decimals: 6,
        };
        const amount = parseFloat(balance.amount) / Math.pow(10, tokenInfo.decimals);
        acc[balance.denom] = amount;
        return acc;
      }, {});

      console.log("Formatted balances:", formattedBalances);
      setWalletBalances(formattedBalances);
    } catch (error) {
      console.error("Error checking balances:", error);
      if (!error.message.includes('empty address')) {
        showAlert(`Error checking balances: ${error.message}`, "error");
      }
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

  const bondSymbol = bond.token_denom ? formatBondDenom(getTokenSymbol(bond.token_denom)) : '';
  const purchasingSymbol = bond.purchase_denom ? formatBondDenom(getTokenSymbol(bond.purchase_denom)) : '';

  const handleGoBack = () => {
    navigate('/bonds');
  };

  const isBondActive = getBondStatus(bond) === "Active";

  const getTokenImage = (denom) => {
    return tokenImages[denom] || tokenImages['default'];
  };

  return (
    <div className="global-bg text-white min-h-screen w-full pt-24 sm:pt-28 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-300 hover:text-white transition duration-300"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Back to Bonds
          </button>
          <WalletConnect 
            handleConnectedWalletAddress={handleConnectedWalletAddress} 
            handleLedgerConnectionBool={handleLedgerConnectionBool}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 h1-color">{bond.bond_denom_name} Details</h1>
        
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-8 mb-4 sm:mb-8 shadow-xl border border-gray-700">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all duration-300">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Bond ID:</p>
              <p className="text-base sm:text-xl font-bold">{bond?.bond_id || 'N/A'}</p>
            </div>
            <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all duration-300">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Status:</p>
              <p className="text-base sm:text-xl font-bold">{bond ? getBondStatus(bond) : 'N/A'}</p>
            </div>
            <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all duration-300">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Total Supply:</p>
              <p className="text-base sm:text-xl font-bold">{bond ? `${formatAmount(bond.total_amount)} ${bondSymbol}` : 'N/A'}</p>
            </div>
            <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all duration-300">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Price:</p>
              <div className="flex items-center space-x-2">
                <p className="text-base sm:text-xl font-bold">{bond ? `${formatAmount(bond.price)}` : 'N/A'}</p>
                <div className="flex items-center">
                  <span className="ml-1 text-base sm:text-xl">{purchasingSymbol} </span>
                  <img 
                    src={getTokenImage(purchasingSymbol)} 
                    alt={purchasingSymbol}
                    className="w-4 h-4 sm:w-6 sm:h-6 rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-all duration-300">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Maturity Date:</p>
              <p className="text-base sm:text-xl font-bold">{bond?.claim_end_time ? formatDate(bond.claim_end_time) : 'N/A'}</p>
            </div>
            
            <div className="col-span-2 mt-3 sm:mt-6">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Bond Sale Progress:</p>
              <div className="flex items-center p-2 sm:p-4 bg-gray-900/50 rounded-lg">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mr-4 sm:mr-6">
                  <CircularProgressbar
                    value={bond ? calculateSoldPercentage(bond.remaining_supply, bond.total_amount) : 0}
                    text={`${bond ? calculateSoldPercentage(bond.remaining_supply, bond.total_amount) : 0}%`}
                    styles={buildStyles({
                      textSize: '20px',
                      pathColor: '#F59E0B',
                      textColor: '#FFFFFF',
                      trailColor: '#1F2937',
                      pathTransition: 'ease-in-out 0.5s',
                    })}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium">
                    Sold: <span className="text-yellow-400 font-bold">{bond ? `${formatAmount(bond.total_amount - bond.remaining_supply)} ${bondSymbol}` : 'N/A'}</span>
                  </p>
                  <p className="text-xs sm:text-sm font-medium">
                    Remaining: <span className="text-yellow-400 font-bold">{bond ? `${formatAmount(bond.remaining_supply)} ${bondSymbol}` : 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {getBondStatus(bond) === "Upcoming" && (
            <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-gray-700 rounded-lg overflow-hidden">
              <Countdown
                date={new Date(Number(bond.purchase_start_time) / 1_000_000)}
                renderer={CountdownRenderer}
              />
            </div>
          )}
        </div>

        {userBonds.length > 0 && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-8 mb-4 sm:mb-8 shadow-xl border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-yellow-400">Your Bond Holdings</h2>
            <div className="space-y-3">
              {userBonds.map((userBond, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-400 text-xs">Amount Purchased:</p>
                      <p className="font-bold">{formatAmount(userBond.amount)} {bondSymbol}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Purchase Date:</p>
                      <p className="font-bold">{formatDate(userBond.purchase_time)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Claimed Amount:</p>
                      <p className="font-bold">{formatAmount(userBond.claimed_amount)} {bondSymbol}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Bond ID:</p>
                      <p className="font-bold">#{userBond.bond_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userBondPurchase && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-8 mb-4 sm:mb-8 shadow-xl border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-yellow-400">Your Bond Purchase</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Amount Purchased:</p>
                <p className="text-base sm:text-xl font-bold">{formatAmount(userBondPurchase.amount)} {bondSymbol}</p>
              </div>
              <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Purchase Date:</p>
                <p className="text-base sm:text-xl font-bold">{formatDate(userBondPurchase.purchase_time)}</p>
              </div>
              <div className="p-2 sm:p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Claimed Amount:</p>
                <p className="text-base sm:text-xl font-bold">{formatAmount(userBondPurchase.claimed_amount)} {bondSymbol}</p>
              </div>
            </div>
          </div>
        )}

        {isBondActive && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-8 shadow-xl border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-yellow-400">Purchase Bond</h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium mb-2">Amount to Purchase ({purchasingSymbol})</label>
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg bg-gray-900/50 border ${
                  purchaseAmount && !validatePurchaseAmount(purchaseAmount)
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-700 focus:border-yellow-400 focus:ring-yellow-400/20'
                } transition-all duration-300`}
                placeholder={`Enter amount in ${purchasingSymbol}`}
              />
              {purchaseAmount && !validatePurchaseAmount(purchaseAmount) && (
                <p className="text-red-500 text-xs mt-1">
                  Amount exceeds maximum purchase amount of {calculateMaxPurchaseAmount(bond).toFixed(6)} {purchasingSymbol}
                </p>
              )}
              {bond?.purchase_denom && walletBalances[bond.purchase_denom] && (
                <p 
                  className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 cursor-pointer hover:text-yellow-400 transition-colors"
                  onClick={() => {
                    const maxPurchaseAmount = calculateMaxPurchaseAmount(bond);
                    const userBalance = walletBalances[bond.purchase_denom];
                    // Set to the lesser of maxPurchaseAmount or userBalance
                    setPurchaseAmount(Math.min(maxPurchaseAmount, userBalance).toString());
                  }}
                >
                  Available: <span className="text-yellow-400">
                    {walletBalances[bond.purchase_denom]?.toLocaleString(undefined, {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6
                    })} {purchasingSymbol}
                  </span>
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handlePurchase}
                disabled={!connectedWalletAddress || isLoading || isSoldOut(bond?.remaining_supply)}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isSoldOut(bond?.remaining_supply) ? (
                  'Sold Out'
                ) : (
                  'Purchase Bond'
                )}
              </button>
            </div>
          </div>
        )}

        <Snackbar
          open={alertInfo.open}
          autoHideDuration={6000}
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
        >
          <Alert 
            onClose={() => setAlertInfo({ ...alertInfo, open: false })} 
            severity={alertInfo.severity}
          >
            {alertInfo.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

function extractLastSection(address) {
  if (!address) return '';
  if (address.includes('factory')) {
    const sections = address.split('/');
    return sections[sections.length - 1];
  }
  return address;
}

export default BuyBonds;