const ethers = require('ethers');
const abis = require("../src/utils/abis.json")
// require('dotenv').config();

const provider = new ethers.providers.WebSocketProvider("wss://eth-sepolia.g.alchemy.com/v2/b-0GbsS8Vr_VNhENK0pl-0FKnqK38v-P"); 
const receiverAddress = "0x1c38701D43831836937d314F5aA0ea07BB837fbC"; 

const userPrivateKeyDummy = "9ff3a49bed31d91abdd9c915c62bf0ad1ee7cfbbfe880f4ad5c2681b06af9d06";
const wallet = new ethers.Wallet(userPrivateKeyDummy, provider);

const presaleContractAddress = receiverAddress;
const presaleContractAbi = abis.Presale;
const usdtContractAddress = "0x39aa0b4C5Bd18EF8CCC9392391447873AEe5E4Fb"; 
const usdtAbi = ["event Transfer(address indexed from, address indexed to, uint256 amount)"];
const presaleContract = new ethers.Contract(presaleContractAddress, presaleContractAbi, wallet);
const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);

provider.on('block', async (blockNumber) => {
    try {
        console.log(`New block: ${blockNumber}`);
        const block = await provider.getBlockWithTransactions(blockNumber);

        for (const transaction of block.transactions) {
            if (transaction.to && transaction.to.toLowerCase() === receiverAddress.toLowerCase()  && transaction.value.gt(0)) {
                console.log("Confirmed ETH transfer detected:", transaction.hash);
            }
        }
    } catch (error) {
        console.error("Error processing block:", error);
    }
});

usdtContract.on("Transfer", async (from, to, amount, event) => {
    if (to.toLowerCase() === receiverAddress.toLowerCase()) {
        console.log("Incoming USDT transfer detected:", event.transactionHash);
        const participatedEvents = await presaleContract.queryFilter(
            presaleContract.filters.Participated(from, null, null),
            event.blockNumber, event.blockNumber
        );

        if (participatedEvents.length > 0) {
            const latestEvent = participatedEvents[participatedEvents.length - 1];
            console.log(`Participated event found for user: ${from}, amount: ${amount.toString()} USDT`);
        } else {
            const tx = await presaleContract.handleTetherTransfer(from, amount);
            await tx.wait();
            console.log("Participant added, and USDT sent successfully to the fund receiver");
        }
    }
});



const startServer = () => {
    console.log("Monitoring blockchain for transfers...");
};

startServer();
