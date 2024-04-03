import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from './walletConnect';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';

const migalooRPC = 'https://migaloo-rpc.polkachu.com/';
const migalooTestnetRPC = 'https://migaloo-testnet-rpc.polkachu.com:443';
const DAO_ADDRESS = "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc";
const OPHIR_DENOM = "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir";
const DAO_ADDRESS_TESTNET = "migaloo1wdpwwzljkmw87323jkha700lypkpd37jgxj25dwlflnnz8w6updsukf85v";
const OPHIR_DENOM_TESNET = "factory/migaloo1tmxrk9cnmqmt7vmwdl2mqgtcp5kezqahvdmw6lr5nya66ckkzhns9qazqg/ophirdao";
const CONTRACT_ADDRESS = "migaloo1rm07cfruwlysg8pwp00lumeu9u5ygy7wse3ewka3ac0w36xf5erqye26mq";
const CONTRACT_ADDRESS_TESTNET = "migaloo1l9va09vupshkhsf8esw98ujphvun7k5h6q2n3ancv5atn5c72njsu57guf";
const OPHIR_DECIMAL = 1000000;

const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });

    const [chainId, setChainId] = useState('narwhal-2');

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


    const getSigner = async () => {
        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        return offlineSigner;
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
        <div className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full" style={{ paddingTop: '10dvh' }}>
            <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
                <WalletConnect 
                    handleConnectedWalletAddress={handleConnectedWalletAddress} 
                    handleLedgerConnectionBool={handleLedgerConnection}
                />
            </div>
            <h1 className={`text-3xl font-bold h1-color pt-14 sm:pt-0`}>Redeem OPHIR</h1>
            <div className="redeemable-box max-w-4xl flex flex-col items-center">
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
                        className="input-bg text-xl text-white p-2 text-center" 
                        placeholder="Enter OPHIR amount" 
                        value={ophirAmount}
                        onChange={(e) => setOphirAmount(Number(e.target.value))}
                    />
                    {ophirAmount && (
                        <div className="mt-4 overflow-x-auto">
                            <p className="text-xl mb-2 items-center flex flex-col">Assets to be redeemed:</p>
                            <table className="table-auto w-full">
                                <thead>
                                    <tr className="text-left table-header">
                                        <th className="radius-left px-4 py-2">Assets</th>
                                        <th className="px-4 py-2">Amount</th>
                                        <th className="radius-right px-4 py-2">Value</th>
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
                                        <tr key={asset} className="">
                                            <td className="px-4 py-2 text-sm sm:text-base">{asset}</td>
                                            <td className="px-4 py-2 text-sm sm:text-base">{amount.toFixed(6)}</td>
                                            <td className="px-4 py-2 text-sm sm:text-base">${value.toFixed(2)}</td> {/* Display the value with 2 decimal places */}
                                        </tr>
                                    ))
                                }
                                </tbody>
                            </table>
                            <div className="redeem-assets text-center mt-4 text-sm sm:text-base">
                                <span className='value-redeem'>Total Value of Redeemed Assets:</span> ${redemptionValues.totalRedemptionValue ? redemptionValues.totalRedemptionValue.toFixed(2) : '0.00'}
                            </div>

                            <div className="flex justify-center w-full">
                                <button className="redeem-button py-2 px-4 font-medium rounded hover:bg-yellow-500 transition duration-300 ease-in-out" onClick={executeContractMessage}>Redeem OPHIR</button>
                            </div>         
                                                    
                        </div>
                        
                    )}
                </div>
            </div>
        </div>
    );
};

export default Redeem;