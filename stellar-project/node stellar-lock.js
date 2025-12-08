const StellarSdk = require('stellar-sdk');

// Testnet 환경 설정
const SERVER = new StellarSdk.Server('https://horizon-testnet.stellar.org');
StellarSdk.Network.useTestNetwork(); 

// ----------------------------------------------------
// ✨ 발행 계정 정보 (Issuer Account)
// ----------------------------------------------------
// [Note] Issuer Public Key: GC4WMFQYM2PKZLU4KYKYVPRFJ2HWLTK3PWW22YKSRVBZAJMSK75TPAIF
const ISSUER_SECRET_KEY = 'SBEJLWJOEPEYD4CJKA6VXE4WAQ3E4MEINFVMURT7NYYCZI7NSOP6B5PJ'; 

/**
 * 토큰 발행 계정의 권한을 설정하여 발행을 잠그고 유통을 통제합니다.
 */
async function lockAndControlToken() {
    try {
        const issuerKeypair = StellarSdk.Keypair.fromSecret(ISSUER_SECRET_KEY);
        const issuerPublicKey = issuerKeypair.publicKey();
        
        // 1. 계정 정보 로드 (현재 시퀀스 번호를 가져옴)
        const account = await SERVER.loadAccount(issuerPublicKey);

        // 2. SetOptions 오퍼레이션 생성
        const setOptionsOp = StellarSdk.Operation.setOptions({
            // 🔴 [발행 잠금] 마스터 키 가중치를 0으로 설정 (토큰 발행 권한 영구 제거)
            masterWeight: 0, 

            // 🔵 [유통 통제] AUTH_REQUIRED 플래그를 설정 (토큰 전송 시 발행자 승인 필요)
            setFlags: StellarSdk.Auth.REQUIRED, 
            
            // Note: ClearFlags는 필요 없음.
            source: issuerPublicKey
        });

        // 3. 트랜잭션 빌드, 서명, 제출
        const transaction = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE })
            .addOperation(setOptionsOp)
            .setTimeout(30)
            .build();

        // 4. 발행 계정의 비밀 키로 서명
        transaction.sign(issuerKeypair);
        
        // 5. 서버에 제출
        const result = await SERVER.submitTransaction(transaction);

        console.log(`✅ [SetOptions] 발행/유통 통제 트랜잭션 직접 실행 성공!`);
        console.log(`트랜잭션 해시: ${result.hash}`);
        console.log(`\n🎉 이제 토큰 발행은 영구적으로 잠겼고, 모든 토큰 전송은 발행자의 승인(승인 오퍼레이션)이 필요합니다.`);
        return result;

    } catch (error) {
        console.error('❌ SetOptions 트랜잭션 실행 실패:', error.message);
        if (error.response && error.response.data && error.response.data.extras) {
            console.error('에러 코드:', error.response.data.extras.result_codes);
        }
        throw new Error('권한 설정 중 오류가 발생했습니다.');
    }
}

// 이 함수를 실행 환경(Node.js 등)에서 호출하여 직접 테스트해 볼 수 있습니다.
// console.log("lockAndControlToken();");
console.log(`\n--- [SetOptions 코드 준비 완료] ---`);
console.log(`위 코드를 실행하시면 토큰의 발행 능력은 영구적으로 제거되고 유통이 통제됩니다.`);
console.log(`----------------------------------------`);