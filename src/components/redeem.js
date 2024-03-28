import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from './walletConnect';
import walletAddresses from '../auth/security.json';

const migalooRPC = 'https://migaloo-rpc.polkachu.com/';
const migalooTestnetRPC = 'https://migaloo-testnet-rpc.polkachu.com/';
const DAO_ADDRESS = "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc";
const OPHIR_DENOM = "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir";
const CONTRACT_ADDRESS = 'migaloo1hsrped09ncz3kyh3hcmws9cnhdexm3cdcmh4pm5fdkn8dc9fwc9s73f3f0';


const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [redeemContractQueryResponse, setRedeemContractQueryResponse] = useState({});
    const [chainId, setChainId] = useState('migaloo-1');
    const [rpc, setRPC] = useState('https://migaloo-rpc.polkachu.com/');
    const handleConnectedWalletAddress = (address) => {
        setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
    };
    const handleLedgerConnection = (bool) => {
        setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
    };
    useEffect(() => {
        fetch('https://parallax-analytics.onrender.com/ophir/prices')
            .then(response => response.json())
            .then(data => setOphirPrices(data))
            .catch(error => console.error('Error fetching Ophir prices:', error));
    }, []);

    useEffect(() => {
        if (connectedWalletAddress === "") {
            setOphirBalance(0)
        }
    }, [connectedWalletAddress]);


    useEffect(() => {
        if (connectedWalletAddress) {
            checkBalance(connectedWalletAddress).then(balance => {
                setOphirBalance(balance); // Update the balance state when the promise resolves
            });
        }
    }, [connectedWalletAddress]); // Re-run this effect when connectedWalletAddress changes

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (ophirAmount) {
                fetch(`https://parallax-analytics.onrender.com/ophir/calculateRedemptionValue?amount=${ophirAmount}`)
                    .then(response => response.json())
                    .then(data => setRedemptionValues(data))
                    .catch(error => console.error('Error fetching redemption values:', error));
            }
        }, 500); // 500ms debounce time
    
        return () => clearTimeout(debounceTimer); // Clear the timeout if the component unmounts or the value changes
    }, [ophirAmount]);

    const [codeId, setCodeId] = useState(null); // State variable to store the codeId
    const [signer, setSigner] = useState(null); // State variable to store the signer
    // const chainId = "migaloo-1"; // Replace with your actual chain ID

    const chainIdToRPC = {
        "migaloo-1": "https://migaloo-rpc.polkachu.com/",
        "narwhal-2": "https://migaloo-testnet-rpc.polkachu.com/",
    };
    
    const handleNetworkChange = (e) => {
        const selectedChainId = e.target.value;
        const selectedRPC = chainIdToRPC[selectedChainId];
        setChainId(selectedChainId);
        // Assuming you have a state setter for RPC URL
        setRPC(selectedRPC);
    };

    const getSigner = async () => {
        await window.leap.enable(chainId);
        const offlineSigner = window.leap.getOfflineSigner(chainId);
        return offlineSigner;
    };
    const uploadContract = async (file, signer) => {
        try {
            // Fetch the WASM file from the provided URL
            const wasmCode = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(new Uint8Array(reader.result));
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
    
            // Enable the Keplr extension for the desired chain
            // await window.keplr.enable(chainId);
    
            // Get the offline signer from Keplr
    
            // Create a signing client using the offline signer
            const signingClient = await SigningCosmWasmClient.connectWithSigner(
                migalooRPC,
                signer
            );
    
            const fee = {
                amount: [{
                    denom: "uwhale",
                    amount: "5000",
                }],
                gas: "1500000",
            };
            // Upload the contract code
            const result = await signingClient.upload(
                connectedWalletAddress,
                wasmCode,
                fee,
                "Test WASM upload"
            );
    
            console.log(result);
    
            if (result.code !== undefined && result.code !== 0) {
                throw new Error(`Failed to upload contract: ${result.rawLog}`);
            }
    
            // Extract the code ID from the result
            const codeId = result.logs[0].events.find((event) => event.type === "store_code").attributes.find((attr) => attr.key === "code_id").value;
            setCodeId(codeId);
            const initMsg = {
                dao_address: DAO_ADDRESS, // Replace with your actual DAO address
                redeemable_denom: OPHIR_DENOM, // Replace with your actual redeemable denom
            };  
            instantiateContract(Number(codeId), initMsg, signer)
            return codeId;
        } catch (error) {
            console.error("Error in uploadContract:", error);
            throw error;
        }
    };
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return;
        }
        try {
            const signer = await getSigner(); // Assuming getSigner is a function that retrieves the signer
            const codeId = await uploadContract(file, signer);
            console.log('Upload successful, codeId:', codeId);
        } catch (error) {
            console.error('Error uploading contract:', error);
        }
    };
    
    const instantiateContract = async (codeId, initMsg, signer) => {
        try {
            // Ensure the signer is available
            if (!signer) {
                throw new Error("Signer is not available");
            }
    
            // Create a signing client using the signer
            const client = await SigningCosmWasmClient.connectWithSigner(migalooRPC, signer);
    
            const admin = undefined; // Set admin address if needed, else undefined
            const label = `MyContract-${Math.random()}`; // Unique label for the contract instance
            const initFunds = []; // Initial funds to be sent to the contract, if any
    
            // Define the fee for the instantiate transaction
            const fee = {
                amount: [{
                    denom: "uwhale",
                    amount: "5000",
                }],
                gas: "1500000", // Adjust gas value as needed
            };
    
            // Instantiate the contract
            const instantiateResponse = await client.instantiate(
                connectedWalletAddress, // Ensure to get the address from the signer
                codeId,
                initMsg,
                label,
                fee,
                { admin, amount: initFunds }
            );
    
            console.log(instantiateResponse);
    
            if (instantiateResponse.code !== undefined && instantiateResponse.code !== 0) {
                throw new Error(`Failed to instantiate contract: ${instantiateResponse.rawLog}`);
            }
    
            // Extract the contract address from the instantiate response
            const contractAddress = instantiateResponse.contractAddress;
    
            return contractAddress;
        } catch (error) {
            console.error("Error in instantiateContract:", error);
            throw error;
        }
    };
    
    const handleQueryContract = async () => {
        try {
            const queryMsg = {
                get_asset_values: {}
            };
            const formattedJsonString = JSON.stringify(queryMsg, null, 1); // This adds spaces in the JSON string
            const encodedQuery = Buffer.from(formattedJsonString).toString('base64');
            const queryUrl = `https://ww-migaloo-rest.polkachu.com/cosmwasm/wasm/v1/contract/${CONTRACT_ADDRESS}/smart/${encodedQuery}`;
            
            const response = await fetch(queryUrl);
            const queryResponse = await response.json();
            setRedeemContractQueryResponse(queryResponse);
            console.log('Query response:', queryResponse);
        } catch (error) {
            console.error('Error querying contract:', error);
            alert(`Error querying contract. ${error.message}`);
        }
    };

    const checkBalance = async (address) => {
        const baseUrl = "https://migaloo-lcd.erisprotocol.com"; // Replace with the actual REST API base URL for Migaloo
        const response = await fetch(`${baseUrl}/cosmos/bank/v1beta1/balances/${address}`);
        const data = await response.json();
    
        // Assuming the API returns a list of balance objects, each with denom and amount
        const ophirBalance = data.balances.find(balance => balance.denom === "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir");
    
        if (ophirBalance) {
            console.log(`Ophir Balance: ${ophirBalance.amount}`);
            return ophirBalance.amount/1000000;
        } else {
            console.log("Ophir Balance: 0");
            return 0;
        }
    };

    const withdrawCoins = async () => {
        if (!ophirAmount) {
            alert("Please enter an amount to withdraw.");
            return;
        }

        try {
            const chainId = "migaloo-1"; // Make sure this matches the chain you're interacting with
            await window.keplr.enable(chainId);
            const offlineSigner = window.keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            const accountAddress = accounts[0].address;

            const amount = {
                denom: "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir",
                amount: String(parseInt(ophirAmount) * 1000000),
            };

            const msgSend = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: accountAddress,
                    toAddress: "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc", // Treasury Address
                    amount: [amount],
                },
            };

            const fee = {
                amount: [{
                    denom: "uwhale",
                    amount: "5000",
                }],
                gas: "200000",
            };

            const client = await SigningStargateClient.connectWithSigner("https://rpc.cosmos.directory/migaloo", offlineSigner);
            const txHash = await client.signAndBroadcast(accountAddress, [msgSend], fee, "Withdraw OPHIR");
            console.log("Transaction Hash:", txHash);
            alert("Withdrawal successful!");
        } catch (error) {
            console.error("Withdrawal error:", error);
            alert("Withdrawal failed. See console for details.");
        }
    };
    
    return (
        <div className="bg-black mt-4 text-white min-h-screen flex flex-col items-center" style={{ paddingTop: '10dvh' }}>
            <WalletConnect 
                handleConnectedWalletAddress={handleConnectedWalletAddress} 
                handleLedgerConnectionBool={handleLedgerConnection}
            />
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <div className="text-xl sm:text-3xl font-bold mb-2">Ophir Balance: {ophirBalance}</div>
                    <div className="text-md sm:text-xl mb-2">
                                        Redemption Price: ${redemptionValues.redemptionPricePerOPHIR ? redemptionValues.redemptionPricePerOPHIR.toFixed(7) : '0.00'}
                                    </div>
                        <div className="mb-4 items-center flex flex-col">
                            <input 
                                id="ophirAmount" 
                                type="number" 
                                className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center" 
                                placeholder="Enter OPHIR amount" 
                                value={ophirAmount}
                                onChange={(e) => setOphirAmount(e.target.value)}
                            />
                            {ophirAmount && (
                                <div className="mt-4 overflow-x-auto">
                                    <p className="text-xl mb-2 items-center flex flex-col">Assets to be redeemed:</p>
                                    <table className="table-auto w-full">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="px-4 py-2">Asset</th>
                                                <th className="px-4 py-2">Amount</th>
                                                <th className="px-4 py-2">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {Object.entries(redemptionValues)
                                            .filter(([key]) => !["redemptionPricePerOPHIR", "totalRedemptionValue", "calculatedAt"].includes(key))
                                            .map(([asset, amount]) => {
                                                const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                                                const value = amount * price; // Calculate the value by multiplying the amount by the price
                                                return { asset, amount, value }; // Return an object with asset, amount, and value
                                            })
                                            .filter(({ value }) => value > 0.01) // Filter out any values that are 0.01
                                            .sort((a, b) => b.value - a.value) // Sort by value in descending order
                                            .map(({ asset, amount, value }) => (
                                                <tr key={asset} className="bg-black">
                                                    <td className="border px-4 py-2 text-sm sm:text-base">{asset}</td>
                                                    <td className="border px-4 py-2 text-sm sm:text-base">{amount.toFixed(6)}</td>
                                                    <td className="border px-4 py-2 text-sm sm:text-base">${value.toFixed(2)}</td> {/* Display the value with 2 decimal places */}
                                                </tr>
                                            ))
                                        }
                                        </tbody>
                                    </table>
                                    <div className="text-center mt-4 text-sm sm:text-base">
                                        Total Value of Redeemed Assets: ${redemptionValues.totalRedemptionValue ? redemptionValues.totalRedemptionValue.toFixed(2) : '0.00'}
                                    </div>
                                </div>
                            )}
                            {connectedWalletAddress && walletAddresses.includes(connectedWalletAddress) &&
                                <>
                                    <div className="flex items-center justify-center mt-4">
                                        
                                    </div>
                                    <div className="mt-10"> 
                                    <label htmlFor="networkToggle" className="mr-2 text-white">Select Network:</label>
                                        <select
                                            id="networkToggle"
                                            className="bg-slate-800 text-white border border-yellow-400 rounded p-2"
                                            onChange={handleNetworkChange}
                                        >
                                            <option value="migaloo-1">Mainnet (migaloo-1)</option>
                                            <option value="narwhal-2">Testnet (narwhal-2)</option>
                                        </select>
                                        <h3 className="text-lg text-yellow-400 mb-4 pt-4 text-center">WASM Upload</h3>
                                        <div className="flex justify-center w-full">
                                            <input className="text-center" type="file" id="wasmFile" name="wasmFile" accept=".wasm" onChange={handleFileChange} />
                                        </div>
                                        {/* <button onClick={handleInstantiateContract}>Instantiate Contract</button> */}
                                        
                                    </div>
                                    <hr className="my-8 border-white w-1/2" />
                                    <button onClick={handleQueryContract}>Query Contract</button>
                                </>
                            }
                            {Object.keys(redeemContractQueryResponse).length !== 0 && (
                                <div className="w-1/2 mt-4 p-4 bg-slate-700 rounded">
                                    <h3 className="text-lg text-yellow-400 mb-2">Redeem Contract Query Response:</h3>
                                    <pre className="text-white text-sm overflow-auto whitespace-pre-wrap">
                                        {JSON.stringify(redeemContractQueryResponse, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                {/* <div className="flex flex-col items-center justify-center">
                    <button 
                        className="py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500"
                        onClick={withdrawCoins} // Use the withdrawCoins function when this button is clicked
                    >
                        Withdraw
                    </button>
                    <p className="text-xs mt-2 text-center pb-4">Please be cautious as this is a live contract.</p>
                </div> */}
            
        </div>
    );
};

export default Redeem;