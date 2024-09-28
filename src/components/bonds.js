import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import WalletConnect from "./walletConnect";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { tokenMappings } from "../helper/tokenMappings";
import { daoConfig } from "../helper/daoConfig";
import { tokenImages } from "../helper/tokenImages";
import BigInt from "big-integer";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import { Link, useNavigate } from "react-router-dom";
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// const contractAddress = "migaloo1wu03gflr9358qmhn8jzct4caduexjcfy84yrugt3zpdcryq8lu3q5caeuf";
const migalooRPC = "https://migaloo-rpc.polkachu.com/";
const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";
const OPHIR_DECIMAL = BigInt(1000000);

const Bonds = () => {
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [isTestnet, setIsTestnet] = useState(true);
  const [rpc, setRPC] = useState(migalooTestnetRPC);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state
  const [isModalOpen, setIsModalOpen] = useState(false); // Added isModalOpen state
  const [formData, setFormData] = useState({
    bond_id: "",
    total_supply: "",
    interest_rate: "",
    maturity_period: "",
    reward_token: ""
  });
  const [bonds, setBonds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const contractAddress = isTestnet ? daoConfig.BONDS_CONTRACT_ADDRESS_TESTNET : daoConfig.BONDS_CONTRACT_ADDRESS;
  const navigate = useNavigate();

  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      bond_id: "",
      total_supply: "",
      interest_rate: "",
      maturity_period: "",
      reward_token: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

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
      const signer = getSigner();
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

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address);
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool);
  };

  const fetchData = async () => {
    const message = { get_all_bond_offers: {} }; 
    const data = await queryContract(message);
    if (data && Array.isArray(data)) {
      setBonds(data);
    }
    console.log(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTokenSymbol = (denom) => {
    return tokenMappings[denom]?.symbol || denom;
  };

  const getTokenImage = (symbol) => {
    return tokenImages[symbol.toLowerCase()] || '';
  };

  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000); // Convert seconds to milliseconds
    return date.toLocaleDateString();
  };

  const getBondStatus = (bond) => {
    const now = Date.now();
    const startTime = parseInt(bond.start_time) * 1000;
    const endTime = parseInt(bond.end_time) * 1000;

    if (now < startTime) return 'UPCOMING';
    if (now > endTime) return 'COMPLETED';
    return 'ACTIVE';
  };

  const handleBondClick = (bondId) => {
    navigate(`/bonds/buy/${bondId}`);
  };

  const sortedBonds = useMemo(() => {
    let sortableBonds = [...bonds];
    
    // Custom sorting function
    sortableBonds.sort((a, b) => {
      const statusOrder = { 'UPCOMING': 0, 'ACTIVE': 1, 'COMPLETED': 2 };
      const statusA = getBondStatus(a);
      const statusB = getBondStatus(b);
      
      // First, sort by status
      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }
      
      // If status is the same, use the existing sorting logic
      if (sortConfig.key !== null) {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
      }
      return 0;
    });

    return sortableBonds;
  }, [bonds, sortConfig, getBondStatus]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'ascending' 
        ? <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
        : <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />;
    }
    return null;
  };

  // Debounce search term updates
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setDebouncedSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSetSearchTerm(e.target.value);
  };

  const filteredBonds = useMemo(() => {
    return sortedBonds.filter((bond) =>
      bond.bond_denom_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      bond.bond_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [sortedBonds, debouncedSearchTerm]);

  const BondCard = ({ bond }) => {
    const bondSymbol = getTokenSymbol(bond.token_denom);
    const purchasingSymbol = getTokenSymbol(bond.purchasing_denom);
    
    return (
      <div 
        className="bg-gray-800 rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-700 transition duration-300"
        onClick={() => handleBondClick(bond.bond_id)}
      >
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full mr-2 overflow-hidden">
            <img src={getTokenImage(bondSymbol)} alt={bondSymbol} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg font-semibold">{bond.bond_denom_name}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-2">Status: {getBondStatus(bond)}</p>
        <p className="text-sm mb-1">Total Supply: {bond.total_supply/1000000}</p>
        <div className="flex items-center mb-1">
          <p className="text-sm mr-2">Price: {bond.price/1000000} {purchasingSymbol}</p>
          <div className="w-5 h-5 rounded-full overflow-hidden">
            <img src={getTokenImage(purchasingSymbol)} alt={purchasingSymbol} className="w-full h-full object-cover" />
          </div>
        </div>
        <p className="text-sm">Maturity Date: {formatDate(bond.maturity_date)}</p>
      </div>
    );
  };

  return (
    <div className="global-bg text-white min-h-screen w-full pt-20 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Snackbar for alerts */}
        <Snackbar
          open={alertInfo.open}
          autoHideDuration={6000}
          onClose={() => setAlertInfo({ ...alertInfo, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          {alertInfo.htmlContent ? (
            <SnackbarContent
              style={{
                color: "black",
                backgroundColor:
                  alertInfo.severity === "error" ? "#ffcccc" : "#ccffcc",
              }} // Adjusted colors to be less harsh
              message={
                <span
                  dangerouslySetInnerHTML={{ __html: alertInfo.htmlContent }}
                />
              }
            />
          ) : (
            <Alert
              onClose={() => setAlertInfo({ ...alertInfo, open: false })}
              severity={alertInfo.severity}
              sx={{ width: "100%" }}
            >
              {alertInfo.message}
            </Alert>
          )}
        </Snackbar>
        <div className="flex justify-between items-center mb-8">
          { isTestnet ? <h1 className="text-3xl font-bold h1-color">Bonds (Testnet)</h1> : <h1 className="text-3xl font-bold h1-color">Bonds</h1>}
          <div className="flex space-x-4 items-center">
                <Link
                  to="/bonds/create"
                  className="landing-button px-4 py-1.5 rounded-md hover:bg-yellow-500 transition duration-300 text-sm"
                >
                  Create Bond
                </Link>
            {/* <WalletConnect
              handleConnectedWalletAddress={handleConnectedWalletAddress}
              handleLedgerConnectionBool={handleLedgerConnection}
            /> */}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search bonds..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

        {/* Desktop view */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 cursor-pointer" onClick={() => requestSort('bond_denom_name')}>
                  <span className="flex items-center">
                    Bond Name {renderSortIcon('bond_denom_name')}
                  </span>
                </th>
                <th className="text-left py-2 cursor-pointer" onClick={() => requestSort('status')}>
                  <span className="flex items-center">
                    Status {renderSortIcon('status')}
                  </span>
                </th>
                <th className="text-left py-2 cursor-pointer" onClick={() => requestSort('total_supply')}>
                  <span className="flex items-center">
                    Total Supply {renderSortIcon('total_supply')}
                  </span>
                </th>
                <th className="text-left py-2 cursor-pointer" onClick={() => requestSort('price')}>
                  <span className="flex items-center">
                    Price {renderSortIcon('price')}
                  </span>
                </th>
                <th className="text-left py-2 cursor-pointer" onClick={() => requestSort('maturity_date')}>
                  <span className="flex items-center">
                    Maturity Date {renderSortIcon('maturity_date')}
                  </span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredBonds.map((bond, index) => {
                const bondSymbol = getTokenSymbol(bond.token_denom);
                const purchasingSymbol = getTokenSymbol(bond.purchasing_denom);
                return (
                  <tr 
                    key={index} 
                    className="border-b border-gray-800 cursor-pointer hover:bg-gray-700 transition duration-300"
                    onClick={() => handleBondClick(bond.bond_id)}
                  >
                    <td className="py-4 flex items-center">
                      <div className="w-8 h-8 rounded-full mr-2 overflow-hidden">
                        <img src={getTokenImage(bondSymbol)} alt={bondSymbol} className="w-full h-full object-cover" />
                      </div>
                      {bond.bond_denom_name}
                    </td>
                    <td className="py-4">
                      {getBondStatus(bond)}
                    </td>
                    <td className="py-4">{bond.total_supply/1000000}</td>
                    <td className="py-4 flex items-center">
                      <span className="mr-2">{bond.price/1000000} {purchasingSymbol}</span>
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img src={getTokenImage(purchasingSymbol)} alt={purchasingSymbol} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-4">{formatDate(bond.maturity_date)}</td>
                    <td className="py-4">
                      <button className="text-gray-400 hover:text-white transition duration-300">→</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          {filteredBonds.map((bond, index) => (
            <BondCard key={index} bond={bond} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bonds;