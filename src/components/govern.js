import React, { useState, useEffect } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from "./walletConnect";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import { daoConfig } from "../helper/daoConfig";
import { tokenMappings } from "../helper/tokenMappings";

const Govern = () => {
  const migalooRPC = "https://migaloo-rpc.polkachu.com/";

  const [ophirBalance, setOphirBalance] = useState(0);
  const [stakedOphirBalance, setStakedOphirBalance] = useState(0);
  const [ophirAmount, setOphirAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rpc, setRPC] = useState(migalooRPC);
  const [isSending, setIsSending] = useState(false);
  const [chainId, setChainId] = useState("migaloo-1");
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [contractAddress, setContractAddress] = useState(
    daoConfig["DAO_STAKING_CONTRACT_ADDRESS"]
  );
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const OPHIR_DECIMAL = 1000000;

  useEffect(() => {
    if (connectedWalletAddress) {
      checkBalance(connectedWalletAddress).then((balance) => {
        setOphirBalance(balance); // Update the balance state when the promise resolves
      });
      getStakedOphirBalance();
    }
  });
  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
  };
  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
  };
  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

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

  const getStakedOphirBalance = async () => {
    try {
      const message = {
        voting_power_at_height: {
          address: connectedWalletAddress,
        },
      };

      const signer = getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);

      // Query the smart contract directly using SigningCosmWasmClient.queryContractSmart
      const queryResponse = await client.queryContractSmart(
        contractAddress,
        message
      );

      console.log(queryResponse);
      const power = queryResponse.power;
      const dividedPower = Number(power) / OPHIR_DECIMAL;
      console.log(dividedPower);
      setStakedOphirBalance(dividedPower);
      //   setSimulationResponse(queryResponse);
      // Process the query response as needed
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract. ${error.message}`, "error");
    }
  };

  const executeContractMessage = async () => {
    setIsLoading(true);
    try {
      if (!window.keplr) {
        showAlert("Keplr wallet is not installed.", "error");
        return;
      }
      if (!ophirAmount || ophirAmount <= 0) {
        showAlert("Please enter a valid OPHIR amount.", "error");
        return;
      }

      const message = {
        stake: {},
      };
      const signer = await getSigner();

      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      const funds = [
        {
          denom: daoConfig["OPHIR_DENOM"],
          amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
        },
      ];
      const fee = {
        amount: [{ denom: "uwhale", amount: "5000" }],
        gas: "500000",
      };

      const result = await client.execute(
        connectedWalletAddress,
        contractAddress,
        message,
        fee,
        "Stake OPHIR in DAODAO",
        funds
      );

      console.log(result);
      if (result.transactionHash) {
        const baseTxnUrl = "https://inbloc.org/migaloo/transactions";
        const txnUrl = `${baseTxnUrl}/${result.transactionHash}`;
        showAlert(
          `Message executed successfully! Transaction Hash: ${result.transactionHash}`,
          "success",
          `<a href="${txnUrl}" target="_blank">Message executed successfully! Transaction Hash: ${result.transactionHash}</a>`
        );
      } else {
        showAlert("Message executed successfully!", "success");
      }
      checkBalance(connectedWalletAddress).then((balance) => {
        setOphirBalance(balance); // Update the balance state when the promise resolves
      });
      getStakedOphirBalance();
    } catch (error) {
      console.error("Error executing contract message:", error);
      showAlert(`Error executing contract message. ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen global-bg">
      <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4 text-white">
        <WalletConnect
          handleConnectedWalletAddress={handleConnectedWalletAddress}
          handleLedgerConnectionBool={handleLedgerConnection}
        />
      </div>
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
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-gray-900 text-2xl mb-4">Governance</h1>
        <p className="text-gray-900 mb-2">
          Staked OPHIR: {stakedOphirBalance.toLocaleString()}
        </p>
        <p
          className="text-gray-900 mb-4"
          onClick={() => setOphirAmount(ophirBalance)}
        >
          OPHIR Balance: {ophirBalance.toFixed(6).toLocaleString()}
        </p>
        <input
          id="ophirAmount"
          type="text"
          inputMode="decimal" // Allows mobile users to open numeric keyboard
          pattern="[0-9]*" // Ensures only numbers can be input
          className="border border-gray-300 p-2 rounded w-full mb-4"
          placeholder="Enter OPHIR amount"
          value={ophirAmount}
          onChange={(e) => {
            // Allow only numbers to be input
            const value = e.target.value.replace(/[^\d.]/g, "");
            setOphirAmount(value ? Number(value) : "");
          }}
        />
        <div className="flex justify-center">
          <button
            className="bg-yellow-600 text-white p-2 rounded w-full"
            onClick={executeContractMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span>Stake</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Govern;
