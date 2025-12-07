/ send_rewards.js

// â­ï¸ 1. Node.js ?´ì¥ ëª¨ë“ˆ import (ê²½ë¡œ ì²˜ë¦¬)
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs'; 

// 2. ?¸ë? ?¼ì´ë¸ŒëŸ¬ë¦?import
import { config } from 'dotenv'; 

// â­ï¸â­ï¸â­ï¸ Stellar SDK import ë°?ë¹„êµ¬ì¡°í™” ?˜ì • â­ï¸â­ï¸â­ï¸
import * as StellarSdk from 'stellar-sdk'; // ?‘ˆ * (ëª¨ë“  ?ì„±)?¼ë¡œ ê°€?¸ì˜µ?ˆë‹¤.

// â­ï¸ Server??ë¹„êµ¬ì¡°í™”?ì„œ ?œì™¸?˜ê³ , ?˜ë¨¸ì§€ ?´ë˜?¤ë§Œ ê°€?¸ì˜µ?ˆë‹¤.
const { Network, Keypair, TransactionBuilder, Operation, Asset } = StellarSdk.default || StellarSdk; 
// ?‘† ??ì½”ë“œë¥??¬ìš©?˜ì—¬ Network ???˜ë¨¸ì§€ ?´ë˜?¤ëŠ” ê°€?¸ì˜µ?ˆë‹¤.

// ?„ì¬ ?Œì¼???”ë ‰? ë¦¬ë¥??»ëŠ” ES Module ?œì? ë°©ì‹
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// secrets.env ?Œì¼ ë¡œë“œë¥??ˆë? ê²½ë¡œë¡?ê°•ì œ ?¤í–‰
config({ path: path.resolve(__dirname, 'secrets.env') }); 

// Testnet ?¤íŠ¸?Œí¬ ?¤ì •
const server = new Server('https://horizon-testnet.stellar.org');
Network.use(Network.TESTNET);

// --------------------------------------------------------------------------------
// [?„ìˆ˜ ?…ë ¥ ?¬í•­]
// --------------------------------------------------------------------------------
// WARNING: ???¤ëŠ” secrets.env ?Œì¼?ì„œ ë¡œë“œ?©ë‹ˆ??
const SENDER_KEY = process.env.SENDER_SECRET_KEY; 

// â­ï¸ ?¬ê¸°???€?˜ìˆ˜ ? í°??ë°œí–‰??ì§€ê°?ì£¼ì†Œ(Gë¡??œì‘)ë¥??¤ì‹œ ?…ë ¥?´ì•¼ ?©ë‹ˆ??
const EUNHASU_ISSUER = "GB46SU26GB46SU26UEL7F4EOWANFSG2PI56BWRO2C2FZPFHJYYJBO3YYBMPQHVDV"; 
// ?€?˜ìˆ˜ ? í° ì½”ë“œ
const ASSET_CODE = "EHS"; 
// --------------------------------------------------------------------------------

// ë°œì†¡??Keypair ?ì„±
try {
    var SENDER_PAIR = Keypair.fromSecret(SENDER_SCSW5Z2EBBQNR2RZXAK7NKABKRCISD4FMFEW3WASFW2EXXHFVZ5XZAK4);
} catch (error) {
    console.error("???¤ë¥˜: secrets.env ?Œì¼??SENDER_SECRET_KEYê°€ ?¬ë°”ë¥´ê²Œ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
    process.exit(1);
}


// 1. ë³´ìƒ ì§€ê¸?ëª©ë¡???½ê³  ?Œì‹±
const rewardsListPath = path.resolve(__dirname, 'rewards_list.txt'); // ?ˆë? ê²½ë¡œ ?¬ìš©
const rewards = fs.readFileSync(rewardsListPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
        const [destination, amount] = line.split(',');
        return { destination: destination.trim(), amount: parseFloat(amount) };
    });

async function sendRewards() {
    if (rewards.length === 0) {
        console.log("ì§€ê¸‰í•  ë³´ìƒ ëª©ë¡??ë¹„ì–´ ?ˆìŠµ?ˆë‹¤.");
        return;
    }

    console.log(`ì§€ê¸?ëª©ë¡ ë¡œë“œ ?„ë£Œ: ì´?${rewards.length}ê±?`);
    console.log(`ë°œì†¡??ì£¼ì†Œ: ${SENDER_PAIR.publicKey()}`);

    try {
        // 2. ë°œì†¡??ê³„ì • ë¡œë“œ
        const account = await server.loadAccount(SENDER_PAIR.publicKey());

        // 3. ?¸ëœ??…˜ ë¹Œë” ?œì‘ 
        const transaction = new TransactionBuilder(account, {
            fee: Network.BASE_FEE, 
            timebounds: {
                minTime: 0,
                maxTime: Math.floor(Date.now() / 1000) + 60, 
            },
        });

        const asset = new Asset(ASSET_CODE, EUNHASU_ISSUER);
        let successCount = 0;

        // 4. ëª¨ë“  ì§€ê¸???ª©??Operation?¼ë¡œ ì¶”ê?
        for (const reward of rewards) {
            try {
                transaction.addOperation(Operation.payment({
                    destination: reward.destination,
                    asset: asset,
                    amount: reward.amount.toFixed(4), 
                }));
                successCount++;
            } catch (e) {
                console.error(`ERROR: ${reward.destination} ì§€ê¸??‘ì—… ì¶”ê? ?¤íŒ¨:`, e.message);
            }
        }

        console.log(`ì´?${rewards.length}ê±?ì¤?${successCount}ê±´ì˜ ì§€ê¸??‘ì—…???¸ëœ??…˜??ì¶”ê??ˆìŠµ?ˆë‹¤.`);

        // 5. ?¸ëœ??…˜ ?œëª… ë°??œì¶œ
        const finalTransaction = transaction.setTimeout(30).build();
        finalTransaction.sign(SENDER_PAIR);

        console.log("?¸ëœ??…˜ ?œì¶œ ì¤?..");
        const result = await server.submitTransaction(finalTransaction);
        console.log("???¸ëœ??…˜ ?±ê³µ! Hash:", result.hash);
        console.log("Stellar Horizon ë§í¬:", `https://testnet.stellar.org/tx/${result.hash}`);
    } catch (e) {
        console.error("???¸ëœ??…˜ ?œì¶œ ?¤íŒ¨:");
        if (e.response && e.response.data && e.response.data.extras) {
            console.error("?¬ìœ :", e.response.data.extras.result_codes);
        } else {
            console.error("?¬ìœ :", e.message);
        }
    }
}

sendRewards();