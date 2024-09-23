import React, { useState, useEffect } from 'react';
import WalletConnect from "./walletConnect";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { tokenMappings } from "../helper/tokenMappings";
import { daoConfig } from "../helper/daoConfig";
import BigInt from "big-integer";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";

// const contractAddress = "migaloo1wu03gflr9358qmhn8jzct4caduexjcfy84yrugt3zpdcryq8lu3q5caeuf";
const migalooRPC = "https://migaloo-rpc.polkachu.com/";
const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";
const OPHIR_DECIMAL = BigInt(1000000);

const bondData = [
  { name: 'OPHIR', status: 'COMPLETED', totalBonded: '50,000,000', purchasingDenom: 'USDC', price: '0.0025', ratio: '8%' },
  { name: 'qcFUZN', status: 'MATURE', totalBonded: '125,000', purchasingDenom: 'USK', price: '0.0575', ratio: '100%' },
  // Add more mock data here...
];

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
  const contractAddress = isTestnet ? daoConfig.BONDS_CONTRACT_ADDRESS_TESTNET : daoConfig.BONDS_CONTRACT_ADDRESS;

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

  const executeContractMessage = async () => {
    setIsLoading(true);
    try {
      const { bond_id, total_supply, interest_rate, maturity_period, reward_token } = formData;
      const contractAddress = daoConfig.BONDS_CONTRACT_ADDRESS_TESTNET;

      const message = { 
        issue_bond: {
          bond_id,
          total_supply,
          interest_rate,
          maturity_period,
          reward_token
        } 
      };

      const signer = await getSigner();

      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      const fee = {
        amount: [{ denom: "uwhale", amount: "5000" }],
        gas: "500000",
      };

      const result = await client.execute(
        connectedWalletAddress,
        contractAddress,
        message,
        fee,
        `Bond Creation: ${bond_id}`
        // funds
      );

      console.log(result);
      if (result.transactionHash) {
        const baseTxnUrl = isTestnet
          ? "https://ping.pfc.zone/narwhal-testnet/tx"
          : "https://inbloc.org/migaloo/transactions";
        const txnUrl = `${baseTxnUrl}/${result.transactionHash}`;
        showAlert(
          `Message executed successfully! Transaction Hash: ${result.transactionHash}`,
          "success",
          `<a href="${txnUrl}" target="_blank">View Transaction</a>`
        );
      } else {
        showAlert("Message executed successfully!", "success");
      }
      // checkBalances();
      closeModal();
    } catch (error) {
      console.error("Error executing contract message:", error);
      showAlert(`Error executing contract message. ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    const fetchData = async () => {
      const message = { get_bond_data: {} }; // Replace with the actual query message
      const data = await queryContract(message);
      console.log(data);
    };

    fetchData();
  }, []);

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
          <h1 className="text-3xl font-bold h1-color">Bond Listing</h1>
          <div className="flex space-x-4 items-center">
            <button
              onClick={openModal}
              className="landing-button px-4 py-1.5 rounded-md hover:bg-yellow-500 transition duration-300 text-sm"
            >
              Create Bond
            </button>
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

        {/* Modal for Creating Bond */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl mb-4">Create New Bond</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bond ID</label>
                  <input
                    type="text"
                    name="bond_id"
                    value={formData.bond_id}
                    onChange={handleInputChange}
                    className="input-bg w-full px-3 py-2 rounded-md"
                    placeholder="Enter Bond ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Supply</label>
                  <input
                    type="number"
                    name="total_supply"
                    value={formData.total_supply}
                    onChange={handleInputChange}
                    className="input-bg w-full px-3 py-2 rounded-md"
                    placeholder="Enter Total Supply"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interest Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleInputChange}
                    className="input-bg w-full px-3 py-2 rounded-md"
                    placeholder="Enter Interest Rate (e.g., 0.05)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maturity Period (days)</label>
                  <input
                    type="number"
                    name="maturity_period"
                    value={formData.maturity_period}
                    onChange={handleInputChange}
                    className="input-bg w-full px-3 py-2 rounded-md"
                    placeholder="Enter Maturity Period"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Token</label>
                  <input
                    type="text"
                    name="reward_token"
                    value={formData.reward_token}
                    onChange={handleInputChange}
                    className="input-bg w-full px-3 py-2 rounded-md"
                    placeholder="Enter Reward Token Denom"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={executeContractMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bonds;
