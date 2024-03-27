import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import WalletConnect from './walletConnect';

const migalooRPC = 'https://migaloo-rpc.polkachu.com/';


const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
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
    const getSigner = async () => {
        const chainId = "narwhal-2"; // Replace with your actual chain ID
        await window.leap.enable(chainId);
        const offlineSigner = window.leap.getOfflineSigner(chainId);
        return offlineSigner;
    };

    // const handleUploadContract = async () => {
    //     try {
    //         const signer = await getSigner(); // Implement this function based on your wallet setup
    //         const codeId = await uploadContract('../wasm/ophirtreasure.wasm', signer);
    //         console.log('Upload successful, codeId:', codeId);
    //         alert(`Contract uploaded successfully. Code ID: ${codeId}`);
    //     } catch (error) {
    //         console.error('Error uploading contract:', error);
    //         alert('Error uploading contract. Check console for details.');
    //     }
    // };
    
    // const handleInstantiateContract = async () => {
    //     try {
    //         const signer = await getSigner();
    //         const initMsg = {/* Your init message */};
    //         const codeId = codeId; /* Retrieve your codeId from state or previous operation */
    //         const contractAddress = await instantiateContract(codeId, initMsg, signer);
    //         console.log('Instantiate successful, contractAddress:', contractAddress);
    //         alert(`Contract instantiated successfully. Address: ${contractAddress}`);
    //     } catch (error) {
    //         console.error('Error instantiating contract:', error);
    //         alert('Error instantiating contract. Check console for details.');
    //     }
    // };
    
    // const handleExecuteContract = async () => {
    //     try {
    //         const signer = await getSigner();
    //         const contractAddress = /* Your contract address */;
    //         const executeMsg = {/* Your execute message */};
    //         const executeResult = await executeContract(contractAddress, executeMsg, signer);
    //         console.log('Execute successful:', executeResult);
    //         alert('Contract executed successfully. Check console for details.');
    //     } catch (error) {
    //         console.error('Error executing contract:', error);
    //         alert('Error executing contract. Check console for details.');
    //     }
    // };
    
    // const handleQueryContract = async () => {
    //     try {
    //         const contractAddress = /* Your contract address */;
    //         const queryMsg = {/* Your query message */};
    //         const queryResult = await queryContract(contractAddress, queryMsg);
    //         console.log('Query successful:', queryResult);
    //         alert('Contract queried successfully. Check console for details.');
    //     } catch (error) {
    //         console.error('Error querying contract:', error);
    //         alert('Error querying contract. Check console for details.');
    //     }
    // };

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
    
    const disconnectWallet = () => {
        setConnectedWalletAddress(''); // Reset the connected wallet address
        // Additionally, you might want to reset other relevant states
        setOphirBalance(0); // Resetting the balance to 0 or initial state
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

                            {/* <button onClick={handleUploadContract}>Upload Contract</button>
                            <button onClick={handleInstantiateContract}>Instantiate Contract</button>
                            <button onClick={handleExecuteContract}>Execute Contract</button>
                            <button onClick={handleQueryContract}>Query Contract</button> */}
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