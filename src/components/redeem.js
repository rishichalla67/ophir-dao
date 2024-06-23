import React, { useState, useEffect } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from "./walletConnect";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import allowedAddresses from "../auth/security.json"; // Adjust the path as necessary
import { tokenMappings } from "../helper/tokenMappings";
import { daoConfig } from "../helper/daoConfig";
import { tokenImages } from "../helper/tokenImages";
import BigInt from "big-integer";
const migalooRPC = "https://migaloo-rpc.polkachu.com/";
const migalooTestnetRPC = "https://migaloo-testnet-rpc.polkachu.com:443";
const OPHIR_DECIMAL = BigInt(1000000);

const Redeem = () => {
  const [ophirAmount, setOphirAmount] = useState("");
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
  const [redemptionValues, setRedemptionValues] = useState({});
  const [ophirPrices, setOphirPrices] = useState({});
  const [totalValueInfo, setTotalValueInfo] = useState({
    totalValue: 0,
    allDenomsUsed: false,
  });
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [allBalances, setAllBalances] = useState({});
  const [allBalancesTestnet, setAllBalancesTestnet] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [daoBalance, setDaoBalance] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const isAddressAllowed = allowedAddresses.includes(connectedWalletAddress);
  const [chainId, setChainId] = useState("narwhal-2");
  const [isTestnet, setIsTestnet] = useState(true);
  const [contractAddress, setContractAddress] = useState(
    daoConfig["CONTRACT_ADDRESS_TESTNET"]
  );
  const [rpc, setRPC] = useState(migalooTestnetRPC);
  const [isSending, setIsSending] = useState(false); // Add this state at the beginning of your component
  const [sendOphirAmount, setSendOphirAmount] = useState("100000");
  const [simulationResponse, setSimulationResponse] = useState({});
  const [debugValues, setDebugValues] = useState({});
  const [redemptionPrice, setRedemptionPrice] = useState(0);
  const [redemptionStatistics, setRedemptionStatistics] = useState({});

  const handleConnectedWalletAddress = (address) => {
    setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
  };
  const handleLedgerConnection = (bool) => {
    setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
  };
  const showAlert = (message, severity = "info", htmlContent = null) => {
    setAlertInfo({ open: true, message, severity, htmlContent });
  };

  useEffect(() => {
    checkDAOBalance();
  }, [rpc, isLoading]);

  useEffect(() => {
    getDebugValues();
  }, [simulationResponse, isTestnet]);

  useEffect(() => {
    fetch("https://parallax-analytics.onrender.com/ophir/prices")
      .then((response) => response.json())
      .then((data) => {
        setOphirPrices(data);
        getRedemptionPrice();
      })
      .catch((error) => console.error("Error fetching Ophir prices:", error));
  }, []);

  useEffect(() => {
    if (connectedWalletAddress === "") {
      setOphirBalance(0);
    }
  }, [connectedWalletAddress]);

  useEffect(() => {
    if (connectedWalletAddress) {
      checkBalances();
      checkDAOBalance();
      getDebugValues();
      if (ophirAmount) {
        handleQueryContract();
      }
    }
  }, [connectedWalletAddress, isTestnet]); // Re-run this effect when connectedWalletAddress changes

  function checkBalances() {
    if (isTestnet) {
      checkBalanceTestnet(connectedWalletAddress).then((balance) => {
        setOphirBalance(balance); // Update the balance state when the promise resolves
      });
    } else {
      checkBalance(connectedWalletAddress).then((balance) => {
        setOphirBalance(balance); // Update the balance state when the promise resolves
      });
    }
  }

  useEffect(() => {
    if (isTestnet) {
      setChainId("narwhal-2");
      setRPC(migalooTestnetRPC);
      setContractAddress(daoConfig["CONTRACT_ADDRESS_TESTNET"]);
      setOphirAmount("");
      setRedemptionValues({});
      getDebugValues();
      getRedemptionPrice();
    } else {
      setChainId("migaloo-1");
      setRPC(migalooRPC);
      setContractAddress(daoConfig["CONTRACT_ADDRESS"]);
      setOphirAmount("");
      setRedemptionValues({});
      getDebugValues();
      getRedemptionPrice();
    }
  }, [isTestnet]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (ophirAmount) {
        handleQueryContract();
      }
    }, 100); // 100ms debounce time

    return () => clearTimeout(debounceTimer); // Clear the timeout if the component unmounts or the value changes
  }, [ophirAmount, isTestnet]);

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

      const redeemMessage = {
        redeem_assets: {
          sender: connectedWalletAddress,
          amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
        },
      };
      const signer = await getSigner();

      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
      const funds = [
        {
          denom:
            chainId === "narwhal-2"
              ? daoConfig["OPHIR_DENOM_TESNET"]
              : daoConfig["OPHIR_DENOM"],
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
        redeemMessage,
        fee,
        "Execute redeem assets contract message",
        funds
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
          `<a href="${txnUrl}" target="_blank">Message executed successfully! Transaction Hash: ${result.transactionHash}</a>`
        );
      } else {
        showAlert("Message executed successfully!", "success");
      }
      checkBalances();
    } catch (error) {
      console.error("Error executing contract message:", error);
      showAlert(`Error executing contract message. ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
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

  const checkBalanceTestnet = async (address) => {
    const signer = await getSigner(); // Assuming getSigner is defined as shown previously

    // Connect with the signer to get a client capable of signing transactions
    const client = await SigningStargateClient.connectWithSigner(
      migalooTestnetRPC,
      signer
    );

    // Query all balances for the address
    const balances = await client.getAllBalances(address);
    console.log(balances);
    setAllBalancesTestnet(balances);
    // Assuming OPHIR_DENOM is defined elsewhere in your code and represents the denom you're interested in
    const ophirBalance = balances.find(
      (balance) => balance.denom === daoConfig["OPHIR_DENOM_TESNET"]
    );

    if (ophirBalance) {
      console.log(`Ophir Balance: ${ophirBalance.amount}`);
      return parseFloat(ophirBalance.amount) / 1000000; // Adjust the division based on the token's decimals
    } else {
      console.log("Ophir Balance: 0");
      return 0;
    }
  };

  const checkDAOBalance = async () => {
    const signer = await getSigner(); // Assuming getSigner is defined as shown previously

    // Connect with the signer to get a client capable of signing transactions
    const client = await SigningStargateClient.connectWithSigner(rpc, signer);

    // Query all balances for the address
    const balances = await client.getAllBalances(
      isTestnet ? daoConfig["DAO_ADDRESS_TESTNET"] : daoConfig["DAO_ADDRESS"]
    );
    // console.log(balances)
    // setAllBalancesTestnet(balances);
    // Assuming OPHIR_DENOM is defined elsewhere in your code and represents the denom you're interested in
    const ophirBalance = balances.find(
      (balance) =>
        balance.denom ===
        (isTestnet ? daoConfig["OPHIR_DENOM_TESNET"] : daoConfig["OPHIR_DENOM"])
    );
    if (ophirBalance) {
      console.log(`Ophir Balance: ${ophirBalance.amount}`);
      setDaoBalance(parseFloat(ophirBalance.amount) / 1000000);
      return parseFloat(ophirBalance.amount) / 1000000; // Adjust the division based on the token's decimals
    } else {
      console.log("Ophir Balance: 0");
      return 0;
    }
  };

  const calculateTotalAssetValueForRedemptions = (redemptionValues, prices) => {
    let totalValue = 0;
    let allDenomsUsed = true;
    if (Object.keys(prices).length > 0) {
      Object.keys(redemptionValues).forEach((denom) => {
        const priceInfo = prices[denom] || 0; // Default to a price of 0 if not found
        if (priceInfo !== 0) {
          const value = redemptionValues[denom] * priceInfo;
          totalValue += value;
        } else {
          allDenomsUsed = false;
        }
      });
    }
    console.log(totalValue);
    return { totalValue, allDenomsUsed };
  };

  async function getRedemptionPrice() {
    try {
      setRedemptionPrice(0);
      const message = {
        get_redemption_calculation: {
          amount: "10000000000",
        },
      };

      const client = await CosmWasmClient.connect(rpc);

      // Query the smart contract directly using CosmWasmClient.queryContractSmart
      const queryResponse = await client.queryContractSmart(
        contractAddress,
        message
      );
      let updatedRedemptionValues;
      // Process the query response as needed
      if (queryResponse && queryResponse.redemptions) {
        updatedRedemptionValues = queryResponse.redemptions.reduce(
          (acc, redemption) => {
            // Retrieve token information from the mappings or use default values
            const tokenInfo = tokenMappings[redemption.denom] || {
              symbol: redemption.denom,
              decimals: 6,
            };
            // Adjust the amount by the token's decimals
            const adjustedAmount =
              Number(redemption.amount) / Math.pow(10, tokenInfo.decimals);
            // Accumulate the adjusted amounts by token symbol
            acc[tokenInfo.symbol] = adjustedAmount;

            return acc;
          },
          {}
        );
      }
      const { totalValue, allDenomsUsed } =
        calculateTotalAssetValueForRedemptions(
          updatedRedemptionValues,
          ophirPrices
        );
      setRedemptionPrice(totalValue / 10000);
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract. ${error.message}`, "error");
    }
  }

  const sendOphir = async (recipientAddress) => {
    try {
      const signer = await getSigner();

      const amountToSend = {
        denom: daoConfig["OPHIR_DENOM_TESNET"],
        amount: (Number(sendOphirAmount) * OPHIR_DECIMAL).toString(), // 100000 units of OPHIR
      };

      const msgSend = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
          fromAddress: connectedWalletAddress,
          toAddress: recipientAddress,
          amount: [amountToSend],
        },
      };

      const fee = {
        amount: [{ denom: "uwhale", amount: "5000" }], // Example fee, adjust as necessary
        gas: "200000", // Example gas limit, adjust as necessary
      };

      // const rpcEndpoint = isTestnet ? migalooTestnetRPC : migalooRPC;
      const client = await SigningStargateClient.connectWithSigner(
        migalooTestnetRPC,
        signer
      );
      const txHash = await client.signAndBroadcast(
        connectedWalletAddress,
        [msgSend],
        fee,
        "Send OPHIR"
      );
      console.log("Transaction Hash:", txHash);
      showAlert("OPHIR sent successfully!", "success");
      checkBalances();
    } catch (error) {
      console.error("Error sending OPHIR:", error);
      showAlert(`Error sending OPHIR. ${error.message}`, "error");
    }
  };

  const getDebugValues = async () => {
    try {
      const message = {
        get_debug_values: {},
      };

      const signer = await getSigner();
      const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);

      const queryResponse = await client.queryContractSmart(
        contractAddress,
        message
      );

      setDebugValues(queryResponse);

      const tokenSupplyMessage = {
        get_token_supply: {},
      };

      const tokenSupplyResponse = await client.queryContractSmart(
        contractAddress,
        tokenSupplyMessage
      );

      const supplyData = {
        true_circulating_supply: (
          tokenSupplyResponse.true_circulating_supply / OPHIR_DECIMAL
        ).toFixed(2),
        percentage_staked: (
          (tokenSupplyResponse.staking_contract_balance /
            tokenSupplyResponse.total_supply) *
          100
        ).toFixed(2),
        daily_ratio: queryResponse.daily_ratio,
        average_daily_ratio: queryResponse.aggregate_daily_volume,
        average_circulating_supply: queryResponse.circulating_supply_14d,
        average_redemption_volume: (
          simulationResponse?.redemption_volume_14d / OPHIR_DECIMAL
        ).toFixed(2),
        agg_daily_volume: queryResponse.aggregate_daily_volume,
        fee_rate: queryResponse.fee_rate,
      };
      setRedemptionStatistics(supplyData);
      console.log("Token Supply Response:", tokenSupplyResponse);
    } catch (error) {
      console.error("Error performing WASM query:", error);
      showAlert(`Error performing WASM query. ${error.message}`, "error");
    }
  };

  const handleQueryContract = async () => {
    try {
      const message = {
        get_redemption_calculation: {
          amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
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
      setSimulationResponse(queryResponse);
      // Process the query response as needed
      if (queryResponse && queryResponse.redemptions) {
        const updatedRedemptionValues = queryResponse.redemptions.reduce(
          (acc, redemption) => {
            // Retrieve token information from the mappings or use default values
            const tokenInfo = tokenMappings[redemption.denom] || {
              symbol: redemption.denom,
              decimals: 6,
            };
            // Adjust the amount by the token's decimals
            const adjustedAmount =
              Number(redemption.amount) / Math.pow(10, tokenInfo.decimals);
            // Accumulate the adjusted amounts by token symbol
            acc[tokenInfo.symbol] = adjustedAmount;

            return acc;
          },
          {}
        );
        // Update the state with the accumulated values
        setRedemptionValues(updatedRedemptionValues);
      }

      // Assuming calculateTotalValue uses the latest state directly or you pass the latest state as arguments
      const totalAmount = calculateTotalValue();
      setTotalValueInfo(totalAmount);
      if (ophirPrices) {
        getRedemptionPrice();
      }
    } catch (error) {
      console.error("Error querying contract:", error);
      showAlert(`Error querying contract. ${error.message}`, "error");
    }
  };

  useEffect(() => {
    // Assuming calculateTotalValue is modified to directly use state variables
    // or you pass the latest state as arguments here.
    const totalValueInfo = calculateTotalValue();
    setTotalValueInfo(totalValueInfo);
  }, [ophirAmount, redemptionValues]);

  const calculateTotalValue = () => {
    let totalValue = 0;
    let allDenomsUsed = true;
    // console.log(ophirPrices);
    Object.keys(redemptionValues).forEach((denom) => {
      const priceInfo = ophirPrices[denom] || 0; // Default to a price of 0 if not found
      // console.log('Token Denom:', denom);
      // console.log('Price Info:', priceInfo);
      if (priceInfo !== 0) {
        // console.log(redemptionValues);
        const value = redemptionValues[denom] * priceInfo;
        // console.log('Token Value:', value);
        totalValue += value;
      } else {
        allDenomsUsed = false;
      }
    });
    return { totalValue, allDenomsUsed };
  };

  function BalanceTable({ balances }) {
    // Ensure balances is an array before proceeding
    if (!Array.isArray(balances)) {
      console.error(
        "BalanceTable expects balances to be an array, received:",
        balances
      );
      return null; // Return null or some fallback UI
    }

    return (
      <table className="table-auto w-full mt-2">
        <thead>
          <tr>
            <th className="px-4 py-2">Asset</th>
            <th className="px-4 py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                {tokenMappings[balance.denom]?.symbol ||
                  balance.denom.split("/").pop()}
              </td>
              <td className="border px-4 py-2">
                {parseFloat(
                  (
                    balance.amount /
                    Math.pow(10, tokenMappings[balance.denom]?.decimals || 6)
                  ).toFixed(4)
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div
      className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full"
      style={{ paddingTop: "10dvh" }}
    >
      <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
        <WalletConnect
          handleConnectedWalletAddress={handleConnectedWalletAddress}
          handleLedgerConnectionBool={handleLedgerConnection}
        />
      </div>
      <h1
        className={`text-lg sm:text-3xl font-bold h1-color pt-14 sm:pt-0 cursor-pointer text-center`}
        onClick={() => setIsTestnet(!isTestnet)}
      >
        {isTestnet ? "Redeem OPHIR (Testnet)" : "Redeem OPHIR"}
      </h1>
      <div className="redeemable-box max-w-4xl flex flex-col items-center">
        <div
          className="text-lg sm:text-3xl font-bold mb-2 text-center cursor-pointer"
          onClick={() => setOphirAmount(ophirBalance)}
        >
          Ophir Balance: {ophirBalance.toLocaleString()}
        </div>
        {simulationResponse && Object.keys(simulationResponse).length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="font-semibold">Circulating Supply:&nbsp;</span>
            <span>
              {simulationResponse.true_circulating_supply
                ? (
                    simulationResponse.true_circulating_supply / 1000000
                  ).toLocaleString()
                : "N/A"}
            </span>
          </div>
        )}
        {redemptionValues.redemptionPricePerOPHIR && (
          <div className="text-md sm:text-xl mb-2">
            Redemption Price: $
            {redemptionValues.redemptionPricePerOPHIR.toFixed(7)}
          </div>
        )}
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
        <div className="mb-4 w-full items-center flex flex-col">
          <input
            id="ophirAmount"
            type="text"
            inputMode="decimal" // Allows mobile users to open numeric keyboard
            pattern="[0-9]*" // Ensures only numbers can be input
            className="input-bg mt-2 text-xl text-white p-2 text-center"
            placeholder="Enter OPHIR amount"
            value={ophirAmount}
            onChange={(e) => {
              // Allow only numbers to be input
              const value = e.target.value.replace(/[^\d.]/g, "");
              setOphirAmount(value ? Number(value) : "");
            }}
          />
          {ophirAmount > 0 && Object.keys(redemptionValues).length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xl mb-2 items-center flex flex-col">
                Assets to be redeemed:
              </p>
              <table className="table-auto w-full">
                <thead>
                  <tr className="text-left table-header">
                    <th className="radius-left px-4 py-2">Assets</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="radius-right px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {isTestnet && ophirPrices
                    ? Object.entries(redemptionValues)
                        .filter(
                          ([key]) =>
                            ![
                              "redemptionPricePerOPHIR",
                              "totalRedemptionValue",
                              "calculatedAt",
                            ].includes(key)
                        )
                        .map(([asset, amount]) => {
                          const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                          const value = amount * price; // Calculate the value by multiplying the amount by the price
                          return { asset, amount, value }; // Return an object with asset, amount, and value
                        })
                        .map(({ asset, amount, value }) => (
                          <tr key={asset}>
                            <td className="px-4 py-2 text-sm sm:text-base">
                              {asset.split("/").pop()}
                            </td>
                            <td className="px-4 py-2 text-sm sm:text-base">
                              {amount.toFixed(5)}
                            </td>
                            <td className="px-4 py-2 text-sm sm:text-base text-center">
                              ${value.toFixed(2)}
                            </td>
                          </tr>
                        ))
                    : Object.entries(redemptionValues)
                        .filter(
                          ([key]) =>
                            ![
                              "redemptionPricePerOPHIR",
                              "totalRedemptionValue",
                              "calculatedAt",
                            ].includes(key)
                        )
                        .map(([asset, amount]) => {
                          const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                          const value = amount * price; // Calculate the value by multiplying the amount by the price
                          return { asset, amount, value }; // Return an object with asset, amount, and value
                        })
                        .filter(({ value }) => value > 0.01) // Filter out any values that are 0.01
                        .sort((a, b) => b.value - a.value) // Sort by value in descending order
                        .map(({ asset, amount, value }) => (
                          <tr key={asset}>
                            {Array.isArray(tokenImages[asset]) ? (
                              <div className="flex items-center">
                                {tokenImages[asset].map((imgUrl, index) => {
                                  // Calculate size based on the number of images
                                  const sizeClass = `h-5 w-5 md:h-8 md:w-8`;
                                  return (
                                    <img
                                      key={index}
                                      src={imgUrl}
                                      alt={`${asset}-${index}`}
                                      className={`mr-1 ${sizeClass} sm:${sizeClass} md:${sizeClass} lg:${sizeClass}`}
                                    />
                                  );
                                })}
                                <span className="text-sm sm:text-base">
                                  {asset}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center py-1">
                                <img
                                  src={tokenImages[asset]}
                                  alt={asset}
                                  className="h-5 w-5 sm:h-7 sm:w-7 md:h-9 md:w-9 mr-2"
                                />
                                <span className="text-sm sm:text-base">
                                  {asset}
                                </span>
                              </div>
                            )}
                            <td className="px-4 py-2 text-sm sm:text-base">
                              {amount.toFixed(asset === "wBTC" ? 8 : 6)}
                            </td>
                            <td className="px-4 py-2 text-sm sm:text-base">
                              ${value.toFixed(2)}
                            </td>{" "}
                            {/* Display the value with 2 or 10 decimal places based on asset type */}
                          </tr>
                        ))}
                </tbody>
              </table>
              <div className="redeem-assets text-center mt-2 text-sm sm:text-base">
                <span className="value-redeem px-2 text-xs sm:text-sm">
                  Total Value of Redeemed Assets:
                </span>
                <span className="px-2 text-xs sm:text-sm">
                  {totalValueInfo.allDenomsUsed
                    ? `$${totalValueInfo.totalValue.toFixed(2)}`
                    : `~$${totalValueInfo.totalValue.toFixed(2)}`}
                </span>
                <div className="value-redeemsm mt-1">
                  <span className="text-xxs sm:text-xs">
                    Relative Return vs. Current Market Sell (
                    {ophirPrices["ophir"]?.toFixed(4)}):{" "}
                  </span>
                  {ophirPrices["ophir"] && ophirAmount ? (
                    <span
                      className={`px-2 text-xxs sm:text-xs ${
                        ((totalValueInfo.totalValue -
                          ophirPrices["ophir"] * ophirAmount) /
                          (ophirPrices["ophir"] * ophirAmount)) *
                          100 >=
                        0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {`${(
                        ((totalValueInfo.totalValue -
                          ophirPrices["ophir"] * ophirAmount) /
                          (ophirPrices["ophir"] * ophirAmount)) *
                        100
                      ).toFixed(2)}%`}
                    </span>
                  ) : (
                    <span className="px-2">N/A</span>
                  )}
                </div>
              </div>
              {Object.keys(simulationResponse).length !== 0 && (
                <div className="text-xs sm:text-sm mt-4">
                  {redemptionPrice > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold">
                        Redemption Price of OPHIR:
                      </span>
                      <span>${redemptionPrice.toFixed(6)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">Redemption Fee (%):</span>
                    <span>
                      {simulationResponse?.fee_amount
                        ? `${(
                            (Number(simulationResponse.fee_amount) /
                              (Number(simulationResponse.balance_after_fee) +
                                Number(simulationResponse.fee_amount))) *
                            100
                          ).toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">
                      Redemption Fee (OPHIR):
                    </span>
                    <span>
                      {simulationResponse?.fee_amount
                        ? (
                            Number(simulationResponse.fee_amount) / 1000000
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">Redeemed OPHIR:</span>
                    <span>
                      {simulationResponse?.balance_after_fee
                        ? (
                            Number(simulationResponse.balance_after_fee) /
                            1000000
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-semibold">
                      Percent of Circ. Supply:
                    </span>
                    <span>
                      {simulationResponse?.balance_after_fee &&
                      simulationResponse?.true_circulating_supply
                        ? `${(
                            (simulationResponse.balance_after_fee /
                              simulationResponse.true_circulating_supply) *
                            100
                          ).toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              )}
              {isTestnet && simulationResponse?.dao_has_enough_balance && (
                <div className="flex justify-center w-full">
                  <button
                    className="redeem-button py-2 px-4 font-medium rounded hover:bg-yellow-500 transition duration-300 ease-in-out flex items-center justify-center"
                    onClick={executeContractMessage}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-center">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <span>Redeem OPHIR</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
          {ophirAmount > 0 && Object.keys(redemptionValues).length <= 0 && (
            <div className="text-center mt-5 text-red-500">
              Not enough OPHIR to redeem anything of value from our treasury...
            </div>
          )}
          {connectedWalletAddress && ophirBalance <= 0 && (
            <>
              <div className="text-center mt-5 my-4">
                <a
                  href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-button font-medium py-2 px-4 hover:bg-yellow-500"
                >
                  Buy $OPHIR
                </a>
              </div>
              <div className="text-center my-4">
                <a
                  href="/seekers"
                  rel="noopener noreferrer"
                  className="landing-button mt-3 font-medium py-2 px-4 hover:bg-yellow-500"
                >
                  $OPHIR Seeker's Round
                </a>
              </div>
            </>
          )}
          {ophirAmount <= 0 && ophirAmount !== "" && (
            <div className="text-center mt-5 text-red-500">
              Please enter a valid OPHIR amount
            </div>
          )}
        </div>
        {((Array.isArray(allBalancesTestnet) &&
          allBalancesTestnet.length > 0) ||
          (Array.isArray(allBalances) && allBalances.length > 0)) && (
          <div className="testnet-balance mt-5">
            <div className="dao-balance text-center mt-4 text-sm sm:text-base bg-yellow-500 text-black py-2 px-4 rounded-lg shadow-lg font-bold">
              <span>DAO $OPHIR Balance: {daoBalance.toLocaleString()}</span>
            </div>
            <div className="text-center mt-4 text-sm sm:text-base">
              {isTestnet ? (
                <>
                  <span className="font-medium">Your Testnet Balances:</span>
                  <BalanceTable balances={allBalancesTestnet} />
                </>
              ) : (
                <>
                  <span className="font-medium">Your Balances:</span>
                  <BalanceTable balances={allBalances} />
                </>
              )}
            </div>
          </div>
        )}
        {redemptionStatistics && (
          <div className="debug-info bg-gray-800 p-4 rounded-lg shadow-lg mt-4">
            <h2 className="text-lg font-bold text-white mb-2">
              Redemption Statistics
            </h2>
            <div className="text-white text-sm relative group">
              <strong title="Average redemption volume (14d) / true circulating supply">
                True Circulating Supply:
              </strong>{" "}
              {redemptionStatistics?.true_circulating_supply?.length > 4
                ? Number(
                    redemptionStatistics?.true_circulating_supply
                  ).toLocaleString()
                : redemptionStatistics?.true_circulating_supply}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Average redemption volume (14d) / true circulating supply">
                Average Daily Ratio:
              </strong>{" "}
              {redemptionStatistics?.average_daily_ratio?.length > 4
                ? Number(
                    redemptionStatistics?.average_daily_ratio
                  ).toLocaleString()
                : redemptionStatistics?.average_daily_ratio}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="User requested redemption amount / true circulating supply">
                Daily Ratio:
              </strong>{" "}
              {redemptionStatistics?.daily_ratio?.length > 4
                ? Number(redemptionStatistics?.daily_ratio).toLocaleString()
                : redemptionStatistics?.daily_ratio}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Average Circulating Supply over the last 14 days">
                Average Circulating Supply:
              </strong>{" "}
              {redemptionStatistics?.average_circulating_supply?.length > 4
                ? Number(
                    redemptionStatistics?.average_circulating_supply
                  ).toLocaleString()
                : redemptionStatistics?.average_circulating_supply}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Average Redemption Volume over the past 14 days">
                Average Redemption Volume:
              </strong>{" "}
              {redemptionStatistics?.average_redemption_volume?.length > 4
                ? Number(
                    redemptionStatistics?.average_redemption_volume
                  ).toLocaleString()
                : redemptionStatistics?.average_redemption_volume}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Total daily redemption volume">
                Aggregate Daily Volume:
              </strong>{" "}
              {redemptionStatistics?.agg_daily_volume?.length > 4
                ? Number(
                    redemptionStatistics?.agg_daily_volume
                  ).toLocaleString()
                : redemptionStatistics?.agg_daily_volume}
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Amount of $OPHIR staked via DAODAO">
                Percentage Staked:
              </strong>{" "}
              {redemptionStatistics?.percentage_staked?.length > 4
                ? Number(
                    redemptionStatistics?.percentage_staked
                  ).toLocaleString()
                : redemptionStatistics?.percentage_staked}
              %
            </div>
            <div className="text-white text-sm relative group">
              <strong title="Current redemption fee rate based on all metrics">
                Fee Rate:
              </strong>{" "}
              {redemptionStatistics?.fee_rate?.length > 4
                ? Number(redemptionStatistics?.fee_rate).toLocaleString()
                : redemptionStatistics?.fee_rate}
              %
            </div>
          </div>
        )}
        {isAddressAllowed && (
          <div className="mt-4">
            <div className="flex flex-col items-center">
              <input
                id="recipientAddress"
                type="text"
                className="input-bg text-xl text-white p-2 text-center mb-4"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
              <input
                id="amount"
                type="text"
                className="input-bg text-xl text-white p-2 text-center"
                placeholder="100,000"
                // Format the display value with commas
                value={new Intl.NumberFormat("en-US").format(sendOphirAmount)}
                onChange={(e) => {
                  // Remove commas from the input value before setting the state
                  const value = e.target.value.replace(/,/g, "");
                  // Update the state only with numbers
                  if (!isNaN(value) && !value.includes(" ")) {
                    setSendOphirAmount(value);
                  }
                }}
              />
            </div>
            <div className="mt-2">
              <button
                className="py-2 px-4 font-medium rounded hover:bg-blue-500 transition duration-300 ease-in-out block mx-auto"
                onClick={() => {
                  setIsSending(true); // Set isSending to true when the button is clicked
                  sendOphir(recipientAddress).finally(() =>
                    setIsSending(false)
                  ); // Reset isSending to false when the operation is complete
                }}
                disabled={!recipientAddress || isSending} // Disable the button when recipientAddress is empty or isSending is true
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div> // Spinner
                ) : (
                  "Send OPHIR"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redeem;
