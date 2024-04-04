import React, { useState, useEffect } from 'react';
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import WalletConnect from './walletConnect';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';

const tokenMappings = {
    'ibc/517E13F14A1245D4DE8CF467ADD4DA0058974CDCC880FA6AE536DBCA1D16D84E': { symbol: 'bWhale', decimals: 6 },
    'ibc/917C4B1E92EE2F959FC11ECFC435C4048F97E8B00F9444592706F4604F24BF25': {symbol: 'bWhale', decimals: 6},
    'ibc/B3F639855EE7478750CC8F82072307ED6E131A8EFF20345E1D136B50C4E5EC36': { symbol: 'ampWhale', decimals: 6 },
    'ibc/834D0AEF380E2A490E4209DFF2785B8DBB7703118C144AC373699525C65B4223': {symbol: 'ampWhale', decimals: 6},
    'factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir': {symbol: 'ophir', decimals: 6},
    'uwhale': {symbol: "whale", decimals: 6},
    'uluna': {symbol: 'luna', decimals: 6},
    'ibc/EDD6F0D66BCD49C1084FB2C35353B4ACD7B9191117CE63671B61320548F7C89D': {symbol: "whale", decimals: 6},
    'ibc/EA459CE57199098BA5FFDBD3194F498AA78439328A92C7D136F06A5220903DA6': { symbol: 'ampWHALEt', decimals: 6},
    'ibc/6E5BF71FE1BEBBD648C8A7CB7A790AEF0081120B2E5746E6563FC95764716D61': { symbol: 'wBTC', decimals: 8},
    'ibc/EF4222BF77971A75F4E655E2AD2AFDDC520CE428EF938A1C91157E9DFBFF32A3': { symbol: 'kuji', decimals: 6},
    'ibc/50D7251763B4D5E9DD7A8A6C6B012353E998CDE95C546C1F96D68F7CCB060918': { symbol: 'ampKuji', decimals: 6},
    'ibc/B65E189D3168DB40C88C6A6C92CA3D3BB0A8B6310325D4C43AB5702F06ECD60B': {symbol: 'wBTCaxl', decimals: 8},
    'ibc/4627AD2524E3E0523047E35BB76CC90E37D9D57ACF14F0FCBCEB2480705F3CB8': {symbol: 'luna', decimals: 6},
    'factory/migaloo1erul6xyq0gk6ws98ncj7lnq9l4jn4gnnu9we73gdz78yyl2lr7qqrvcgup/ash': {symbol: 'ash', decimals: 6},
    'factory/migaloo1p5adwk3nl9pfmjjx6fu9mzn4xfjry4l2x086yq8u8sahfv6cmuyspryvyu/uLP': {symbol: 'ophirWhaleLp', decimals: 6},
    'factory/migaloo1axtz4y7jyvdkkrflknv9dcut94xr5k8m6wete4rdrw4fuptk896su44x2z/uLP': {symbol: 'whalewBtcLp', decimals: 6},
    'factory/migaloo1xv4ql6t6r8zawlqn2tyxqsrvjpmjfm6kvdfvytaueqe3qvcwyr7shtx0hj/uLP': {symbol: 'usdcWhaleLp', decimals: 6},
    'factory/osmo1rckme96ptawr4zwexxj5g5gej9s2dmud8r2t9j0k0prn5mch5g4snzzwjv/sail': {symbol: 'sail', decimals: 6},
    'factory/terra1vklefn7n6cchn0u962w3gaszr4vf52wjvd4y95t2sydwpmpdtszsqvk9wy/ampROAR': {symbol: 'ampRoar', decimals: 6},
    'factory/migaloo1cwk3hg5g0rz32u6us8my045ge7es0jnmtfpwt50rv6nagk5aalasa733pt/ampUSDC': {symbol: 'ampUSDC', decimals: 6},
    'ibc/BC5C0BAFD19A5E4133FDA0F3E04AE1FBEE75A4A226554B2CBB021089FF2E1F8A': {symbol: 'usdc', decimals: 6},
    'ibc/40C29143BF4153B365089E40E437B7AA819672646C45BB0A5F1E10915A0B6708': {symbol: 'bLuna', decimals: 6},
    'ibc/05238E98A143496C8AF2B6067BABC84503909ECE9E45FBCBAC2CBA5C889FD82A': {symbol: 'ampLuna', decimals: 6},
    'factory/kujira16rujrka8vk3c7l7raa37km8eqcxv9z583p3c6e288q879rwp23ksy6efce/bOPHIR01': {symbol: "bOPHIR01", decimals: 6},
    'ibc/2C962DAB9F57FE0921435426AE75196009FAA1981BF86991203C8411F8980FDB': {symbol: "usdc", decimals: 6}, //axlusdc transfer/channel-253
    'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4': {symbol: 'usdc', decimals: 6}, //axlUsdc transfer/channel-6 crypto-org-chain-mainnet-1 channel-56
    'ibc/36A02FFC4E74DF4F64305130C3DFA1B06BEAC775648927AA44467C76A77AB8DB': {symbol: "whale", decimals: 6}
  };

const migalooRPC = 'https://migaloo-rpc.polkachu.com/';
const migalooTestnetRPC = 'https://migaloo-testnet-rpc.polkachu.com:443';
const DAO_ADDRESS = "migaloo10gj7p9tz9ncjk7fm7tmlax7q6pyljfrawjxjfs09a7e7g933sj0q7yeadc";
const OPHIR_DENOM = "factory/migaloo1t862qdu9mj5hr3j727247acypym3ej47axu22rrapm4tqlcpuseqltxwq5/ophir";
const OPHIR_DENOM_TESNET = "factory/migaloo17c5ped2d24ewx9964ul6z2jlhzqtz5gvvg80z6x9dpe086v9026qfznq2e/daoophir";
const CONTRACT_ADDRESS = "migaloo1seez8q2j8t2206w2vxprs9m9sy0nluscnyyngfnvk4sjvlq2ak5q5zsxdk";
const CONTRACT_ADDRESS_TESTNET = "migaloo1f6aqnzx08w7kyljaqeux97qus4djvez9s7nxupam9n6kn0s7d2cqtrz6az";
const OPHIR_DECIMAL = 1000000;

const Redeem = () => {
    const [ophirAmount, setOphirAmount] = useState('');
    const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
    const [ophirBalance, setOphirBalance] = useState(0); // Add a state for the balance
    const [redemptionValues, setRedemptionValues] = useState({});
    const [ophirPrices, setOphirPrices] = useState({});
    const [totalValueInfo, setTotalValueInfo] = useState({ totalValue: 0, allDenomsUsed: false });
    const [isLedgerConnected, setIsLedgerConnected] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
    const [allBalances, setAllBalances] = useState({});
    const [allBalancesTestnet, setAllBalancesTestnet] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [chainId, setChainId] = useState('narwhal-2');
    const [isTestnet, setIsTestnet] = useState(true);
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
            checkBalances();
        }
    }, [connectedWalletAddress, isTestnet]); // Re-run this effect when connectedWalletAddress changes

    function checkBalances() {
        if(isTestnet){
            checkBalanceTestnet(connectedWalletAddress).then(balance => {
                setOphirBalance(balance); // Update the balance state when the promise resolves
            });
        }else{
            checkBalance(connectedWalletAddress).then(balance => {
                setOphirBalance(balance); // Update the balance state when the promise resolves
            });
        }
    }

    useEffect(() => {
        if(isTestnet){
            setRPC(migalooTestnetRPC);
            setContractAddress(CONTRACT_ADDRESS_TESTNET);
        }else{
            setRPC(migalooRPC);
            setContractAddress(CONTRACT_ADDRESS);
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
        if (window.keplr.experimentalSuggestChain) {
            await window.keplr.experimentalSuggestChain({
                // Chain details
                chainId: 'narwhal-2',
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
                currencies: [{
                    // Example currency, replace with actual
                    coinDenom: "whale",
                    coinMinimalDenom: "uwhale",
                    coinDecimals: 6,
                }],
                feeCurrencies: [{
                    // Example fee currency, replace with actual
                    coinDenom: "whale",
                    coinMinimalDenom: "uwhale",
                    coinDecimals: 6,
                }],
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
        }
        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        return offlineSigner;
    };

    const executeContractMessage = async () => {
        setIsLoading(true);
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
            checkBalances();
        } catch (error) {
            console.error("Error executing contract message:", error);
            showAlert(`Error executing contract message. ${error.message}`, 'error');
        }finally{
            setIsLoading(false);
        }
    };

    const checkBalance = async (address) => {
        const signer = await getSigner(); // Assuming getSigner is defined as shown previously
    
        // Connect with the signer to get a client capable of signing transactions
        const client = await SigningStargateClient.connectWithSigner(migalooRPC, signer); // Use the mainnet RPC endpoint
    
        // Query all balances for the address
        const balances = await client.getAllBalances(address);
        console.log(balances);
        setAllBalances(balances);
        // Assuming OPHIR_DENOM is defined elsewhere in your code and represents the denom you're interested in
        const ophirBalance = balances.find(balance => balance.denom === OPHIR_DENOM);
    
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
        const client = await SigningStargateClient.connectWithSigner(migalooTestnetRPC, signer);
    
        // Query all balances for the address
        const balances = await client.getAllBalances(address);
        console.log(balances)
        setAllBalancesTestnet(balances);
        // Assuming OPHIR_DENOM is defined elsewhere in your code and represents the denom you're interested in
        const ophirBalance = balances.find(balance => balance.denom === OPHIR_DENOM_TESNET);
    
        if (ophirBalance) {
            console.log(`Ophir Balance: ${ophirBalance.amount}`);
            return parseFloat(ophirBalance.amount) / 1000000; // Adjust the division based on the token's decimals
        } else {
            console.log("Ophir Balance: 0");
            return 0;
        }
    };

    // const handleQueryContract = async () => {
    //     try {
    //         const message = {
    //             get_redemption_calculation: {
    //                 amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
    //             }
    //         };
    //         const formattedJsonString = JSON.stringify(message, null, 1); // This adds spaces in the JSON string
    //         const encodedQuery = Buffer.from(formattedJsonString).toString('base64');
    //         let baseURL = chainId === 'narwhal-2' ? 'https://migaloo-testnet-api.polkachu.com' : 'https://migaloo-api.polkachu.com';
    //         if(isTestnet){
    //             baseURL = 'https://migaloo-testnet-api.polkachu.com';
    //         }
    //         else{
    //             baseURL = 'https://migaloo-api.polkachu.com';
    //         }
    //         // TODO: Remove before pushing
    //         // let baseURL = 'https://migaloo-api.polkachu.com'
    //         // let contractAddress = CONTRACT_ADDRESS;
            
    //         const queryUrl = `${baseURL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
    //         const response = await fetch(queryUrl);
    //         const queryResponse = await response.json();
    //         console.log('Query response:', queryResponse.data?.redemptions);
    
    //         // Set the redemption values as the response.data.redemptions
    //         if (queryResponse && queryResponse.data && queryResponse.data?.redemptions) {
    //             setRedemptionValues(queryResponse.data.redemptions.reduce((acc, redemption) => {
    //                 const tokenInfo = tokenMappings[redemption.denom] || { symbol: redemption.denom, decimals: 6 }; // Default to denom and 6 decimals if not found
    //                 const adjustedAmount = Number(redemption.amount) / Math.pow(10, tokenInfo.decimals); // Adjust the amount by the token's decimals
    //                 acc[tokenInfo.symbol] = adjustedAmount;
    //                 return acc;
    //             }, {}));
    //         }
    //         console.log('Redemption Values:', redemptionValues);
    //         const totalAmount = calculateTotalValue();
    //         setTotalValueInfo(totalAmount); 
    //         console.log('Total Value Info:', totalValueInfo);
    //     } catch (error) {
    //         console.error('Error querying contract:', error);
    //         showAlert(`Error querying contract. ${error.message}`, 'error');
    //     }
    // };

    const handleQueryContract = async () => {
        try {
            const message = {
                get_redemption_calculation: {
                    amount: (Number(ophirAmount) * OPHIR_DECIMAL).toString(),
                }
            };
    
            const signer = getSigner();
            const client = await SigningCosmWasmClient.connectWithSigner(rpc, signer);
    
            // Query the smart contract directly using SigningCosmWasmClient.queryContractSmart
            const queryResponse = await client.queryContractSmart(contractAddress, message);
        
            // Process the query response as needed
            if (queryResponse && queryResponse.redemptions) {
                setRedemptionValues(queryResponse.redemptions.reduce((acc, redemption) => {
                    const tokenInfo = tokenMappings[redemption.denom] || { symbol: redemption.denom, decimals: 6 }; // Default to denom and 6 decimals if not found
                    const adjustedAmount = Number(redemption.amount) / Math.pow(10, tokenInfo.decimals); // Adjust the amount by the token's decimals
                    acc[tokenInfo.symbol] = adjustedAmount;
                    return acc;
                }, {}));
            }
    
            // Assuming calculateTotalValue uses the latest state directly or you pass the latest state as arguments
            const totalAmount = calculateTotalValue();
            setTotalValueInfo(totalAmount);
        } catch (error) {
            console.error('Error querying contract:', error);
            showAlert(`Error querying contract. ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        // Assuming calculateTotalValue is modified to directly use state variables
        // or you pass the latest state as arguments here.
        const totalValueInfo = calculateTotalValue(redemptionValues, ophirPrices);
        setTotalValueInfo(totalValueInfo);
      }, [ophirAmount, redemptionValues, ophirPrices]);

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

    const calculateTotalValue = () => {
        let totalValue = 0;
        let allDenomsUsed = true;
        console.log(ophirPrices);
        Object.keys(redemptionValues).forEach(denom => {
            const priceInfo = ophirPrices[denom] || 0; // Default to a price of 0 if not found
            console.log('Token Denom:', denom);
            console.log('Price Info:', priceInfo);
            if (priceInfo !== 0) {
                console.log(redemptionValues);
                const value = redemptionValues[denom] * priceInfo;
                console.log('Token Value:', value);
                totalValue += value;
            } else {
                allDenomsUsed = false;
            }
        });
        return { totalValue, allDenomsUsed };
    };
    
    function BalanceTable({ balances }) {
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
                            <td className="border px-4 py-2">{tokenMappings[balance.denom]?.symbol || balance.denom}</td>
                            <td className="border px-4 py-2">{(balance.amount / Math.pow(10, tokenMappings[balance.denom]?.decimals || 6)).toFixed(tokenMappings[balance.denom]?.decimals || 6)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="global-bg mt-4 text-white min-h-screen flex flex-col items-center w-full" style={{ paddingTop: '10dvh' }}>
            <div className="absolute top-14 right-0 m-4 mr-2 sm:mr-4">
                <WalletConnect 
                    handleConnectedWalletAddress={handleConnectedWalletAddress} 
                    handleLedgerConnectionBool={handleLedgerConnection}
                />
            </div>
            <h1 className={`text-lg sm:text-3xl font-bold h1-color pt-14 sm:pt-0 cursor-pointer text-center`} onClick={() => setIsTestnet(!isTestnet)}>{isTestnet ? "Redeem OPHIR (Testnet)" : "Redeem OPHIR"}</h1>
            <div className="redeemable-box max-w-4xl flex flex-col items-center">
                <div className="text-lg sm:text-3xl font-bold mb-2 text-center">Ophir Balance: {ophirBalance}</div>
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
                    type="text" 
                    inputMode="decimal" // Allows mobile users to open numeric keyboard
                    pattern="[0-9]*" // Ensures only numbers can be input
                    className="input-bg mt-2 text-xl text-white p-2 text-center" 
                    placeholder="Enter OPHIR amount" 
                    value={ophirAmount}
                    onChange={(e) => {
                        // Allow only numbers to be input
                        const value = e.target.value.replace(/[^\d.]/g, '');
                        setOphirAmount(value ? Number(value) : '');
                    }}
                />
                    {ophirAmount > 0 && Object.keys(redemptionValues).length > 0 && (
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
                                {isTestnet && ophirPrices ? (
                                    Object.entries(redemptionValues)
                                        .filter(([key]) => !["redemptionPricePerOPHIR", "totalRedemptionValue", "calculatedAt"].includes(key))
                                        .map(([asset, amount]) => {
                                            const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                                            const value = amount * price; // Calculate the value by multiplying the amount by the price
                                            return { asset, amount, value }; // Return an object with asset, amount, and value
                                        })
                                        .map(({ asset, amount, value }) => (
                                            <tr key={asset}>
                                                <td className="px-4 py-2 text-sm sm:text-base">{asset.split('/').pop()}</td>
                                                <td className="px-4 py-2 text-sm sm:text-base">{(amount).toFixed(10)}</td>
                                                <td className="px-4 py-2 text-sm sm:text-base text-center">${value.toFixed(2)}</td>
                                            </tr>
                                        ))
                                ) : (
                                    Object.entries(redemptionValues)
                                        .filter(([key]) => !["redemptionPricePerOPHIR", "totalRedemptionValue", "calculatedAt"].includes(key))
                                        .map(([asset, amount]) => {
                                            const price = ophirPrices[asset] || 0; // Get the price of the asset, default to 0 if not found
                                            const value = amount * price; // Calculate the value by multiplying the amount by the price
                                            return { asset, amount, value }; // Return an object with asset, amount, and value
                                        })
                                        .filter(({ value }) => value > 0.01) // Filter out any values that are 0.01
                                        .sort((a, b) => b.value - a.value) // Sort by value in descending order
                                        .map(({ asset, amount, value }) => (
                                            <tr key={asset}>
                                                <td className="px-4 py-2 text-sm sm:text-base">{asset}</td>
                                                <td className="px-4 py-2 text-sm sm:text-base">{amount.toFixed(asset === 'wBTC' ? 8 : 6)}</td>
                                                <td className="px-4 py-2 text-sm sm:text-base">${value.toFixed(2)}</td> {/* Display the value with 2 or 10 decimal places based on asset type */}
                                            </tr>
                                        ))
                                )}
                                </tbody>
                            </table>
                            <div className="redeem-assets text-center mt-4 text-sm sm:text-base">
                                <span className='value-redeem px-2'>Total Value of Redeemed Assets:</span> 
                                <span className='px-2'>{totalValueInfo.allDenomsUsed ? 
                                    `$${totalValueInfo.totalValue.toFixed(2)}` : 
                                    `~$${totalValueInfo.totalValue.toFixed(2)}`}
                                </span>
                            </div>

                            {isTestnet && (
                                <div className="flex justify-center w-full">
                                    <button className="redeem-button py-2 px-4 font-medium rounded hover:bg-yellow-500 transition duration-300 ease-in-out flex items-center justify-center" onClick={executeContractMessage} disabled={isLoading}>
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
                        <div className="text-center mt-5 text-red-500">Not enough OPHIR to redeem</div>
                    )}
                    {connectedWalletAddress && ophirBalance <= 0 && (
                        <>
                            <div className="text-center mt-5 my-4">
                                <a href="https://app.whitewhale.money/migaloo/swap?from=WHALE&to=OPHIR" target="_blank" rel="noopener noreferrer" className="landing-button font-medium py-2 px-4 hover:bg-yellow-500">
                                    Buy $OPHIR
                                </a>
                            </div>
                            <div className="text-center my-4">
                                <a href="/seekers" rel="noopener noreferrer" className="landing-button mt-3 font-medium py-2 px-4 hover:bg-yellow-500">
                                    $OPHIR Seeker's Round
                                </a>
                            </div>
                            
                        </>
                    )}
                    {(ophirAmount <= 0 && ophirAmount !== '') && (
                        <div className="text-center mt-5 text-red-500">Please enter a valid OPHIR amount</div>
                    )}
                </div>
                {((Array.isArray(allBalancesTestnet) && allBalancesTestnet.length > 0) || (Array.isArray(allBalances) && allBalances.length > 0)) && (
                    <div className="testnet-balance mt-5">
                        <div className="text-center text-sm sm:text-base">
                            {isTestnet ? (
                                <>
                                    <span className="font-medium">Testnet Balances:</span>
                                    <BalanceTable balances={allBalancesTestnet} />
                                </>
                            ) : (
                                <>
                                    <span className="font-medium">Balances:</span>
                                    <BalanceTable balances={allBalances} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Redeem;