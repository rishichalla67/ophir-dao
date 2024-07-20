import React, { useState, useEffect } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
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
  const [ophirStakers, setOphirStakers] = useState({});
  const [copied, setCopied] = useState(false);
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
  const [activeTab, setActiveTab] = useState("stake"); // State for active tab

  const OPHIR_DECIMAL = 1000000;

  useEffect(() => {
    getStakers();
  }, []);

  useEffect(() => {
    if (connectedWalletAddress) {
      checkBalance(connectedWalletAddress).then((balance) => {
        setOphirBalance(balance); // Update the balance state when the promise resolves
      });
      getStakedOphirBalance();
    }
  }, [connectedWalletAddress]);

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
  };

  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
  };

  const truncateAddress = (address) =>
    `${address.slice(0, 6)}...${address.slice(-6)}`;

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    });
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

  const getStakers = async () => {
    try {
      let stakers = [];
      let limit = 100;
      let startAfter = null;

      const signer = getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);

      while (true) {
        const message = {
          list_stakers: {
            limit,
            start_after: startAfter,
          },
        };

        // Query the smart contract directly using SigningCosmWasmClient.queryContractSmart
        const queryResponse = await client.queryContractSmart(
          contractAddress,
          message
        );

        stakers = stakers.concat(queryResponse.stakers);

        // If the response contains less than the limit, we have retrieved all stakers
        if (queryResponse.stakers.length < limit) {
          break;
        }

        // Update startAfter with the last staker in the current response
        startAfter =
          queryResponse.stakers[queryResponse.stakers.length - 1].address;
      }

      stakers.sort((a, b) => Number(b.balance) - Number(a.balance));

      console.log(stakers);

      setOphirStakers({ stakers });
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract. ${error.message}`, "error");
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

  const executeStakeContractMessage = async () => {
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

  const executeUnstakeContractMessage = async () => {
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
        unstake: {
          amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
        },
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
        "Unstake OPHIR in DAODAO",
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
      <div className="govern-container bg-white p-6 rounded-lg shadow-lg min-w-lg max-w-md mt-10">
        <h1 className="h1-govern text-white text-2xl mb-7 ">
          OPHIR Governance
        </h1>
        <div className="flex justify-around mb-5">
          {["stake", "unstake", "rewards", "info"].map((tab) => (
            <button
              key={tab}
              className={`text-sm md:text-base lg:text-lg font-bold mb-1 hover:cursor-pointer px-2 md:px-3 lg:px-4 py-1 md:py-2 lg:py-3 rounded-full border-2 border-gold shadow-lg transform transition duration-300 ease-in-out hover:scale-105 ${
                activeTab === tab
                  ? "bg-yellow-400 text-black"
                  : "bg-transparent text-white"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {activeTab === "stake" && (
          <div>
            <p className="text-govern mb-2">
              Staked OPHIR: {stakedOphirBalance.toLocaleString()}
            </p>
            <p className="text-govern">
              OPHIR Balance:{" "}
              <a
                className="hover:cursor-pointer"
                onClick={() => setOphirAmount(ophirBalance)}
              >
                {ophirBalance.toFixed(6).toLocaleString()}
              </a>
            </p>
            <div className="ophiramount-container">
              <input
                id="ophirAmount"
                type="text"
                inputMode="decimal" // Allows mobile users to open numeric keyboard
                pattern="[0-9]*" // Ensures only numbers can be input
                className="border border-gray-300 p-2 rounded w-full mb-5"
                placeholder="Enter OPHIR amount"
                value={ophirAmount}
                onChange={(e) => {
                  // Allow only numbers to be input
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  setOphirAmount(value ? Number(value) : "");
                }}
              />
            </div>
            <div className="flex justify-center">
              <button
                className="stake-button text-white p-2 rounded w-full"
                onClick={executeStakeContractMessage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <span>Stake OPHIR</span>
                )}
              </button>
            </div>
          </div>
        )}
        {activeTab === "unstake" && (
          <div>
            <p className="text-govern mb-2">
              Staked OPHIR:{" "}
              <a
                className="hover:cursor-pointer"
                onClick={() => setOphirAmount(stakedOphirBalance)}
              >
                {stakedOphirBalance.toLocaleString()}
              </a>
            </p>
            <p className="text-govern">
              OPHIR Balance: {ophirBalance.toFixed(6).toLocaleString()}
            </p>
            <div className="ophiramount-container">
              <input
                id="ophirAmount"
                type="text"
                inputMode="decimal" // Allows mobile users to open numeric keyboard
                pattern="[0-9]*" // Ensures only numbers can be input
                className="border border-gray-300 p-2 rounded w-full mb-5"
                placeholder="Enter OPHIR amount"
                value={ophirAmount}
                onChange={(e) => {
                  // Allow only numbers to be input
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  setOphirAmount(value ? Number(value) : "");
                }}
              />
            </div>
            <div className="flex justify-center">
              <button
                className="stake-button text-white text-sm p-2 rounded w-full"
                onClick={executeUnstakeContractMessage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <span>Unstake OPHIR</span>
                )}
              </button>
            </div>
          </div>
        )}
        {activeTab === "rewards" && (
          <div>
            <h2 className="h2-govern text-white text-xl mb-7">Rewards</h2>
            {/* Rewards content goes here */}
          </div>
        )}
        {activeTab === "info" && (
          <div>
            <h2 className="h2-govern text-white text-xl md:text-2xl lg:text-3xl mb-7">
              Stakers
            </h2>
            {Object.keys(ophirStakers).length > 0 && (
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto no-scrollbar">
                  <table className="min-w-full text-white border border-gray-300 text-sm md:text-base">
                    <thead>
                      <tr className="w-full bg-yellow-400 text-black">
                        <th className="px-2 md:px-4 py-2 border">Address</th>
                        <th className="px-2 md:px-4 py-2 border">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ophirStakers.stakers.map((staker, index) => (
                        <tr key={index} className="text-center">
                          <td
                            className="px-2 md:px-4 py-2 border cursor-pointer"
                            onClick={() =>
                              navigator.clipboard.writeText(staker.address)
                            }
                            title="Click to copy address"
                          >
                            {truncateAddress(staker.address)}
                          </td>
                          <td className="px-2 md:px-4 py-2 border">
                            {(
                              Number(staker.balance) / OPHIR_DECIMAL
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Govern;
