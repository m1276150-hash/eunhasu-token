const StellarSDK = require("@stellar/stellar-sdk");

// Pi Testnet Horizon Server
const server = new StellarSDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet";

// -----------------------------------------------------------
// 🔑 1. 키 정보 삽입 (새로 생성한 A''와 B'' 지갑의 Secret Key)
// -----------------------------------------------------------
const issuerKeypair = StellarSDK.Keypair.fromSecret("SACY7F7K3IA6SLWDK4UUVIEE4RIK6F6RHJZRNQSFPM24VUP2YXTSEQ5D"); // A'' 지갑 (발행자)
const distributorKeypair = StellarSDK.Keypair.fromSecret("SBKCWNZP4INHSCPSNEZ6TVT3Z2K4GBO33SV2RNDCLF3LNV65UZH5B3T2"); // B'' 지갑 (수신자)

// -----------------------------------------------------------
// 📝 2. 토큰 및 도메인 정보 설정
// -----------------------------------------------------------
const CUSTOM_TOKEN_CODE = "EUNHASU"; // 토큰 코드 설정
const MINT_AMOUNT = "50000000"; // 5천만 개
const HOME_DOMAIN_NAME = "EUNHASU.com"; // Home Domain 설정 (실제 도메인으로 변경 가능)
const customToken = new StellarSDK.Asset(CUSTOM_TOKEN_CODE, issuerKeypair.publicKey());

async function runFullIssuanceProcess() {
    try {
        console.log(`\n======================================================`);
        console.log(`[🚀 프로세스 시작] 토큰: ${CUSTOM_TOKEN_CODE}, 발행자: ${issuerKeypair.publicKey()}`);
        console.log(`======================================================`);

        // 기본 정보 로드 및 수수료 설정
        const response = await server.ledgers().order("desc").limit(1).call();
        const latestBlock = response.records[0];
        const baseFee = latestBlock.base_fee_in_stroops;
        
        const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        
        // ====================================================================================
        // 1단계: B'' 지갑 Trustline 설정
        // ====================================================================================
        console.log("[1/3] B'' 지갑 Trustline 설정 중...");
        
        const trustlineTransaction = new StellarSDK.TransactionBuilder(distributorAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
            .addOperation(StellarSDK.Operation.changeTrust({ asset: customToken, limit: undefined }))
            .build();

        trustlineTransaction.sign(distributorKeypair);

        await server.submitTransaction(trustlineTransaction);
        console.log("✅ Trustline created successfully");

        // ====================================================================================
        // 2단계: 토큰 발행 (A''에서 B''로 5천만 EUNHASU 전송)
        // ====================================================================================
        console.log(`[2/3] 토큰 발행 (${MINT_AMOUNT} 개) 및 전송 중...`);
        
        const paymentTransaction = new StellarSDK.TransactionBuilder(issuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
            .addOperation(
                StellarSDK.Operation.payment({
                    destination: distributorKeypair.publicKey(),
                    asset: customToken,
                    amount: MINT_AMOUNT,
                })
            )
            .build(); 

        paymentTransaction.sign(issuerKeypair);

        await server.submitTransaction(paymentTransaction);
        console.log("✅ Token issued successfully");

        // ====================================================================================
        // 3단계: Home Domain 설정 (발행자의 메타데이터 설정)
        // ====================================================================================
        // 토큰 발행 후 시퀀스 번호가 증가했으므로, 계정을 다시 로드해야 합니다.
        const updatedIssuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        
        console.log(`[3/3] Home Domain (${HOME_DOMAIN_NAME}) 설정 중...`);

        const setOptionsTransaction = new StellarSDK.TransactionBuilder(updatedIssuerAccount, {
            fee: baseFee,
            networkPassphrase: NETWORK_PASSPHRASE,
            timebounds: await server.fetchTimebounds(90),
        })
            .addOperation(StellarSDK.Operation.setOptions({ homeDomain: HOME_DOMAIN_NAME })) 
            .build();

        setOptionsTransaction.sign(issuerKeypair);

        await server.submitTransaction(setOptionsTransaction);
        console.log(`✅ Home Domain ${HOME_DOMAIN_NAME} 설정 성공!`);


        // ====================================================================================
        // 최종 확인: B'' 지갑의 잔고 확인
        // ====================================================================================
        console.log("\n[✨ 최종 결과] B'' 지갑의 잔고 확인 중...");
        const finalDistributorAccount = await server.loadAccount(distributorKeypair.publicKey());
        finalDistributorAccount.balances.forEach((balance) => {
            if (balance.asset_code === CUSTOM_TOKEN_CODE && balance.asset_issuer === issuerKeypair.publicKey()) {
                console.log(`\n======================================`);
                console.log(`⭐ ${balance.asset_code} 최종 잔고: ${balance.balance} (5천만 개 확인!)`);
                console.log(`======================================\n`);
            } else if (balance.asset_type === "native") {
                console.log(`Test-Pi (XLM) 잔고: ${balance.balance}`);
            }
        });

    } catch (error) {
        console.error("❌ 프로세스 처리 중 오류가 발생했습니다.");
        if (error.response && error.response.data && error.response.data.extras && error.response.data.extras.result_codes) {
             console.error("Result Codes:", error.response.data.extras.result_codes);
        } else {
             console.error(error.message);
        }
    }
}

runFullIssuanceProcess();