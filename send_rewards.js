// send_rewards.js - Stellar 은하수 토큰 보상 지급 스크립트 (최종 완성 버전)

// 기본 모듈
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs'; 
import { config } from 'dotenv'; 

// ⭐️ Stellar SDK 관련 변수는 초기화만 해둡니다. (비동기 로드를 위해)
let StellarSdk, Server, Networks, Keypair, TransactionBuilder, Operation, Asset;

// 현재 파일 경로 및 secrets.env 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, 'secrets.env') }); 

// --------------------------------------------------------------------------------
// [필수 입력 사항] 
// --------------------------------------------------------------------------------
// ⭐️ 이 부분이 올바른 환경 변수 읽기 구문입니다. (키 값 직접 노출 금지!)
const SENDER_KEY =SD53L5CQEGLQHMFZ6ROLDXXMREEUC2VQAWMDMXEYZ2EQEOKCWULVR3CE;

// ⭐️ 발행자 지갑 주소 (저장된 정보 반영)
const EUNHASU_ISSUER = "GGCAKQO4EQZYLN5WIO5GL6ISEJUNTE7LLIAQYAYEAGOG3OXJAO4HNMI3L"; 
const ASSET_CODE = "EHS"; 

// --------------------------------------------------------------------------------
// Stellar SDK 모듈을 비동기적으로 로드하여 변수에 할당하는 함수
// --------------------------------------------------------------------------------
async function initializeStellarSdk() {
    const StellarSdkModule = await import('@stellar/stellar-sdk');
    
    // Default Export를 강제 사용
    StellarSdk = StellarSdkModule.default || StellarSdkModule;
    
    // 클래스 추출 (외부 변수에 할당)
    Server = StellarSdk.Horizon; // ⭐️ Server 대신 Horizon 클래스를 사용 (최신 SDK 호환)
    Networks = StellarSdk.Networks;
    Keypair = StellarSdk.Keypair;
    TransactionBuilder = StellarSdk.TransactionBuilder;
    Operation = StellarSdk.Operation;
    Asset = StellarSdk.Asset;
    
    if (!Server) {
        throw new Error("Stellar SDK 클래스 로드 실패. 환경 설정을 점검하십시오.");
    }
}
// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
// 보상 지급 목록 로드
// --------------------------------------------------------------------------------
const rewardsListPath = path.resolve(__dirname, 'rewards_list.txt');
let rewards = [];

try {
    const fileContent = fs.readFileSync(rewardsListPath, 'utf8');
    rewards = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const [destination, amount] = line.split(',');
            if (!destination || !amount || isNaN(parseFloat(amount))) {
                console.warn(`⚠️ 잘못된 항목 건너뜀: ${line}`);
                return null;
            }
            return { destination: destination.trim(), amount: parseFloat(amount) };
        })
        .filter(item => item !== null);
} catch (e) {
    console.error(`❌ 오류: 'rewards_list.txt' 파일을 읽을 수 없습니다. (${rewardsListPath})`);
    process.exit(1);
}

// --------------------------------------------------------------------------------
// 보상 지급 함수
// --------------------------------------------------------------------------------
async function sendRewards() {
    // ⭐️ 1. SDK를 먼저 초기화합니다. (Keypair 사용 전 필수)
    try {
        await initializeStellarSdk();
    } catch (e) {
        console.error(`❌ 치명적인 환경 오류: ${e.message}`);
        return;
    }
    
    // ⭐️ 2. Keypair를 생성합니다. (SDK 초기화 후)
    let SENDER_PAIR;
    try {
        SENDER_PAIR = Keypair.fromSecret(SENDER_KEY);
    } catch (error) {
        // Secret Key 값이 유효하지 않은 경우 이 오류를 출력합니다.
        console.error("❌ 오류: secrets.env 파일에 SENDER_SECRET_KEY가 올바르게 설정되지 않았습니다.");
        return;
    }

    // 네트워크 설정
    const server = new Server('https://horizon-testnet.stellar.org');
    const networkPassphrase = Networks.TESTNET;

    if (rewards.length === 0) {
        console.log("⚠️ 지급할 보상 목록이 없습니다.");
        return;
    }

    console.log(`총 ${rewards.length}건 지급 준비 완료`);
    console.log(`발송자 주소: ${SENDER_PAIR.publicKey()}`);

    try {
        const account = await server.loadAccount(SENDER_PAIR.publicKey());
        const transactionBuilder = new TransactionBuilder(account, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: Networks.TESTNET,
        });

        const asset = new Asset(ASSET_CODE, EUNHASU_ISSUER);
        let successCount = 0;

        for (const reward of rewards) {
            try {
                transactionBuilder.addOperation(Operation.payment({
                    destination: reward.destination,
                    asset,
                    amount: reward.amount.toFixed(4),
                }));
                successCount++;
            } catch (e) {
                console.error(`❌ 지급 작업 추가 실패 (${reward.destination}):`, e.message);
            }
        }

        if (successCount === 0) {
            console.log("⚠️ 유효한 지급 작업이 없습니다.");
            return;
        }

        const transaction = transactionBuilder.setTimeout(30).build();
        transaction.sign(SENDER_PAIR);

        console.log("트랜잭션 제출 중...");
        const result = await server.submitTransaction(transaction);
        console.log("✅ 성공! Hash:", result.hash);
        console.log("🔗 링크:", `https://testnet.stellar.org/tx/${result.hash}`);
    } catch (e) {
        console.error("❌ 트랜잭션 제출 실패:", e.response?.data || e.message);
        console.log("💡 팁: 'tx_bad_auth' 또는 'op_bad_auth'는 키가 틀렸거나, 'op_no_trust'는 받는 사람이 Trustline을 설정해야 함을 의미합니다.");
    }
}

// 실행
sendRewards();