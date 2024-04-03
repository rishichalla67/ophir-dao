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
const CONTRACT_ADDRESS = "migaloo1rm07cfruwlysg8pwp00lumeu9u5ygy7wse3ewka3ac0w36xf5erqye26mq";
const CONTRACT_ADDRESS_TESTNET = "migaloo1sejw0v7gmw3fv56wqr2gy00v3t23l0hwa4p084ft66e8leap9cqqjpczn8";

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
                gas: "500000",
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
        <div className="bg-black mt-4 text-white min-h-screen flex flex-col items-center w-full" style={{ paddingTop: '10dvh' }}>
            <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
                <WalletConnect 
                    handleConnectedWalletAddress={handleConnectedWalletAddress} 
                    handleLedgerConnectionBool={handleLedgerConnection}
                />
            </div>
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
                <div className="mb-4 w-full items-center flex flex-col">
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
                </div>
            </div>
        </div>
    );
};

export default Redeem;