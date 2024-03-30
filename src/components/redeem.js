import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from './walletConnect';
import walletAddresses from '../auth/security.json';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';


const migalooRPC = 'https://migaloo-rpc.polkachu.com/';
const migalooTestnetRPC = 'https://migaloo-testnet-rpc.polkachu.com:443';
const DAO_ADDRESS = "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc";
const OPHIR_DENOM = "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir";
const DAO_ADDRESS_TESTNET = "migaloo1wdpwwzljkmw87323jkha700lypkpd37jgxj25dwlflnnz8w6updsukf85v";
const OPHIR_DENOM_TESNET = "factory/migaloo1tmxrk9cnmqmt7vmwdl2mqgtcp5kezqahvdmw6lr5nya66ckkzhns9qazqg/ophirdao";
const CONTRACT_ADDRESS = 'migaloo1rm07cfruwlysg8pwp00lumeu9u5ygy7wse3ewka3ac0w36xf5erqye26mq';
const CONTRACT_ADDRESS_TESTNET = 'migaloo1l29xslhtdfm6h3lxdluz336hhcj9epp2uxktkjj3d9f5ruukr6esvheps2';

const OPHIR_DECIMAL = 1000000;

const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [redeemContractQueryResponse, setRedeemContractQueryResponse] = useState({});
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
    const [queryType, setQueryType] = useState('');
    const [editableQueryMessage, setEditableQueryMessage] = useState(''); // New state for the editable JSON string
    const [queryMessage, setQueryMessage] = useState('');
    const [jsonQueryValid, setJsonQueryValid] = useState(true); // Add a state to track JSON validity
    const [isUploadingContract, setIsUploadingContract] = useState(false);
    const [chainId, setChainId] = useState('narwhal-2');
    const [isTestnet, setIsTestnet] = useState(true); // Default to Testnet

    const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS_TESTNET);
    const [rpc, setRPC] = useState(migalooTestnetRPC);

    const handleConnectedWalletAddress = (address) => {
        setConnectedWalletAddress(address); // Update the state with data received from WalletConnect
    };
    const handleLedgerConnection = (bool) => {
        setIsLedgerConnected(bool); // Update the state with data received from WalletConnect
    };
    const showAlert = (message, severity = 'info', htmlContent = null) => {
        setAlertInfo({ open: true, message, severity, htmlContent });
    };

    useEffect(() => {
        // Initialize editableQueryMessage with the stringified version of queryMessage when the component mounts or queryMessage changes
        setEditableQueryMessage(JSON.stringify(queryMessage, null, 2));
    }, [queryMessage]);

    useEffect(() => {
        let queryMsg;
        switch (queryType) {
            case 'GetConfig':
                queryMsg = { get_config: {} };
                setJsonQueryValid(true);
                break;
            case 'GetAssetValues':
                queryMsg = { get_asset_values: {} };
                setJsonQueryValid(true);
                break;
            case 'GetRedemptions':
                queryMsg = {
                    get_redemptions: {
                        sender: connectedWalletAddress,
                    }
                };
                setJsonQueryValid(true);
                break;
            case 'Custom':
                queryMsg = queryMessage;
                break;
            default:
                queryMsg = {};
                break;
        }
        setQueryMessage(queryMsg);
        // }
    }, [queryType]);

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
        "migaloo-1": migalooRPC,
        "narwhal-2": migalooTestnetRPC,
    };
    
    // const handleNetworkChange = (e) => {
    //     const selectedChainId = e.target.value;
    //     const selectedRPC = chainIdToRPC[selectedChainId];
    //     setChainId(selectedChainId);
    //     // Assuming you have a state setter for RPC URL
    //     setRPC(selectedRPC);
    //     if (selectedChainId === "narwhal-2") {
    //         setContractAddress(CONTRACT_ADDRESS_TESTNET);
    //     }
    //     else if (selectedChainId === "migaloo-1") {
    //         setContractAddress(CONTRACT_ADDRESS);
    //     }
    // };
    const handleNetworkChange = (event) => {
        const isTestnet = event.target.checked;
        const selectedChainId = isTestnet ? "narwhal-2" : "migaloo-1";
        const selectedRPC = chainIdToRPC[selectedChainId];
        setChainId(selectedChainId);
        setRPC(selectedRPC);
        if (selectedChainId === "narwhal-2") {
            setContractAddress(CONTRACT_ADDRESS_TESTNET);
        } else if (selectedChainId === "migaloo-1") {
            setContractAddress(CONTRACT_ADDRESS);
        }
    };

    const initMsg = {
        dao_address: chainId === 'narwhal-2' ? DAO_ADDRESS_TESTNET : DAO_ADDRESS, // Use DAO_ADDRESS_TESTNET if chainId is 'narwhal-2'
        redeemable_denom: chainId === 'narwhal-2' ? OPHIR_DENOM_TESNET : OPHIR_DENOM, // Replace with your actual redeemable denom
    }; 
    const getSigner = async () => {
        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        return offlineSigner;
    };
    const uploadContract = async (file, signer) => {
        setIsUploadingContract(true)
        try {
            // Fetch the WASM file from the provided URL
            const wasmCode = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(new Uint8Array(reader.result));
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
    
            const signingClient = await SigningCosmWasmClient.connectWithSigner(
                rpc,
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
            showAlert("WASM uploaded successfully! Attempting to instantiate now...", 'success');
            instantiateContract(Number(codeId), signer)
            return codeId;
        } catch (error) {
            console.error("Error in uploadContract:", error);
            throw error;
        }finally{
            setIsUploadingContract(false)
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
    
    const instantiateContract = async (codeId, signer) => {
        try {
            // Ensure the signer is available
            if (!signer) {
                throw new Error("Signer is not available");
            }
    
            // Create a signing client using the signer
            
            const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
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
            setContractAddress(contractAddress);
            showAlert(`WASM instantiated successfully! Contract Address: ${contractAddress}`, 'success');

            return contractAddress;
        } catch (error) {
            console.error("Error in instantiateContract:", error);
            throw error;
        }
    };
    
    const handleQueryContract = async () => {
        try {
            
            const formattedJsonString = JSON.stringify(queryMessage, null, 1); // This adds spaces in the JSON string
            const encodedQuery = Buffer.from(formattedJsonString).toString('base64');
            let baseURL = chainId === 'narwhal-2' ? 'https://migaloo-testnet-api.polkachu.com' : 'https://migaloo-api.polkachu.com';
            const queryUrl = `${baseURL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
            const response = await fetch(queryUrl);
            const queryResponse = await response.json();
            setRedeemContractQueryResponse(queryResponse);
            console.log('Query response:', queryResponse);
        } catch (error) {
            console.error('Error querying contract:', error);
            showAlert(`Error querying contract. ${error.message}`, 'error');
        }
    };

    const executeContractMessage = async () => {
        try {
            if (!window.keplr) {
                showAlert("Keplr wallet is not installed.", 'error');
                return;
            }
            if (!ophirAmount || ophirAmount <= 0) {
                showAlert("Please enter a valid OPHIR amount.", 'error');
                return;
            }

            const message = {
                distribute_assets: {
                    sender: connectedWalletAddress,
                    amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString()
                }
            };
            // const message = {
            //     update_config: {
            //         dao_address: DAO_ADDRESS_TESTNET,
            //         redeemable_denom: OPHIR_DENOM_TESNET
            //     }
            // };
            const signer = await getSigner();
    
            const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
            const funds = [{
                denom: chainId === 'narwhal-2' ? OPHIR_DENOM_TESNET : OPHIR_DENOM, 
                amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString()
            }];
            // const executeMsg = JSON.stringify(message);
            const fee = {
                amount: [{ denom: "uwhale", amount: "5000" }],
                gas: "200000",
            };
    
            const result = await client.execute(connectedWalletAddress, contractAddress, message, fee, "Execute contract message", funds);
    
            console.log("Execute contract message result:", result);
            showAlert("Message executed successfully!", 'success');
        } catch (error) {
            console.error("Error executing contract message:", error);
            showAlert(`Error executing contract message. ${error.message}`, 'error');
        }
    };

    const handleInstantiateContract = async () => {
        try {
            if (!codeId) {
                showAlert("Code ID is not set. Please upload the contract first.", 'error');
                return;
            }
            const signer = await getSigner();
            if (!signer) {
                showAlert("Signer is not available. Please connect your wallet.", 'error');
                return;
            }
            const contractAddress = await instantiateContract(codeId, signer);
            console.log('Instantiate successful, contractAddress:', contractAddress);
            showAlert(`Contract instantiated successfully. Address: ${contractAddress}`, 'success');
        } catch (error) {
            console.error('Error instantiating contract:', error);
            showAlert('Error instantiating contract. Check console for details.', 'error');
        }
    };

    const checkBalance = async (address) => {
        const baseUrl = "https://migaloo-lcd.erisprotocol.com"; 
        const response = await fetch(`${baseUrl}/cosmos/bank/v1beta1/balances/${address}`);
        const data = await response.json();
    
        // Assuming the API returns a list of balance objects, each with denom and amount
        const ophirBalance = data.balances.find(balance => balance.denom === OPHIR_DENOM);
    
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
                denom: OPHIR_DENOM,
                amount: String(parseInt(ophirAmount) * 1000000),
            };

            const msgSend = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: accountAddress,
                    toAddress: DAO_ADDRESS, // Treasury Address
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

            const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);
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
                        {redemptionValues.redemptionPricePerOPHIR && (
                            <div className="text-md sm:text-xl mb-2">
                                Redemption Price: ${redemptionValues.redemptionPricePerOPHIR.toFixed(7)}
                            </div>
                        )}
                        <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, open: false })}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                            {alertInfo.htmlContent ? (
                                <SnackbarContent
                                    style={{color: 'black', backgroundColor: alertInfo.severity === 'error' ? '#ffcccc' : '#ccffcc' }} // Adjusted colors to be less harsh
                                    message={<span dangerouslySetInnerHTML={{ __html: alertInfo.htmlContent }} />}
                                />
                            ) : (
                                <Alert onClose={() => setAlertInfo({ ...alertInfo, open: false })} severity={alertInfo.severity} sx={{ width: '100%' }}>
                                    {alertInfo.message}
                                </Alert>
                            )}
                        </Snackbar>
                        <div className="mb-4 items-center flex flex-col">
                            <input 
                                id="ophirAmount" 
                                type="number" 
                                className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center" 
                                placeholder="Enter OPHIR amount" 
                                value={ophirAmount}
                                onChange={(e) => setOphirAmount(Number(e.target.value))}
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

                                    <div className="flex justify-center w-full">
                                        <button className="mt-5 py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500 transition duration-300 ease-in-out" onClick={executeContractMessage}>Redeem OPHIR</button>
                                    </div>         
                                                           
                                </div>
                                
                            )}
                            {connectedWalletAddress && walletAddresses.includes(connectedWalletAddress) &&
                                <>
                                    <hr className="mt-2 border-white w-full" />

                                    <div className="flex items-center justify-center">
                                        
                                    </div>
                                    <div className="mt-10 w-full flex flex-col items-center"> 
                                        <label htmlFor="networkToggle" className="mr-2 text-white">Select Network:</label>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={chainId === "narwhal-2"}
                                                    onChange={handleNetworkChange}
                                                    name="networkToggle"
                                                    color="primary"
                                                />
                                            }
                                            label={chainId === "narwhal-2" ? "Testnet (narwhal-2)" : "Mainnet (migaloo-1)"}
                                        />

                                        <h3 className="text-lg text-yellow-400 mb-4 pt-4 text-center">WASM Upload</h3>
                                        <div className="flex justify-center w-full">
                                            <input className="text-center" type="file" id="wasmFile" name="wasmFile" accept=".wasm" onChange={handleFileChange} />
                                        </div>
                                        <hr className="my-2 border-white w-full" />
                                        {!isUploadingContract && (
                                            <>
                                                <h3 className="text-lg text-yellow-400 mb-4 pt-4 text-center">WASM Instatiation</h3>

                                                <div className="flex justify-center w-full">
                                                    <input 
                                                        id="codeId" 
                                                        type="number" 
                                                        className="text-xl bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center" 
                                                        placeholder="Enter Code ID" 
                                                        value={codeId}
                                                        onChange={(e) => setCodeId(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="pt-2 flex justify-center w-full">
                                                    <button className="py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500 transition duration-300 ease-in-out" onClick={handleInstantiateContract}>Instantiate Contract</button>
                                                </div>
                                                <hr className="my- border-white w-full" />
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center w-full">
                                        <h3 className="text-lg text-yellow-400 mb-4 pt-4 text-center">Contract Interactions</h3>

                                        <div className="flex justify-center my-4 w-full px-4">
                                            
                                            <input 
                                                id="contractAddress" 
                                                type="text" 
                                                className="w-full bg-slate-800 text-white border border-yellow-400 rounded p-2 text-center" 
                                                placeholder="Enter Contract Address" 
                                                value={contractAddress}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Regex pattern to match the structure starting with "migaloo" followed by 39 alphanumeric characters
                                                    const pattern = /^migaloo[a-z0-9]{39}$/;
                                                    if (pattern.test(value) || value === "") {
                                                        setContractAddress(value);
                                                    } else {
                                                        showAlert("Invalid contract address format.", 'error');
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="w-full mb-4">
                                                <textarea
                                                    id="jsonQuery"
                                                    value={editableQueryMessage}
                                                    className={`w-full h-32 bg-slate-800 text-white rounded p-2 ${jsonQueryValid ? (queryMessage === '' ? 'border border-yellow-400' : 'border border-green-400') : 'border border-red-500'}`} // Dynamically change the border color
                                                    placeholder='Enter JSON Query'
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setEditableQueryMessage(newValue);
                                                        try {
                                                            const jsonQuery = JSON.parse(e.target.value);
                                                            setQueryMessage(jsonQuery);
                                                            setQueryType('Custom');
                                                            setJsonQueryValid(true); // Set valid state
                                                        } catch (error) {
                                                            setJsonQueryValid(false); // Set invalid state
                                                        }
                                                    }}
                                                ></textarea>
                                            </div>
                                        <select
                                            id="querySelect"
                                            value={queryType}
                                            className="bg-slate-800 text-white border border-yellow-400 rounded p-2"
                                            onChange={(e) => setQueryType(e.target.value)}
                                        >
                                            <option value="">Select a Query</option>
                                            <option value="GetConfig">Get Config</option>
                                            <option value="GetAssetValues">Get Asset Values</option>
                                            <option value="GetRedemptions">Get Redemptions</option>
                                            <option value="Custom" disabled>Custom Query</option>

                                        </select>
                                    </div>
                                    <button className="mt-4 py-2 px-4 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-500 transition duration-300 ease-in-out" onClick={handleQueryContract}>Query Contract</button>                                
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