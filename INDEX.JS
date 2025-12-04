const util = require("util");

// [1] 수정: stellar-sdk에서 Server 클래스를 직접 가져옵니다. (대문자 S 확인)
const StellarSdk = require("stellar-sdk");
const Server = StellarSdk.Server;

// [2] 수정: Server 생성자를 사용하여 Pi Testnet 서버에 연결합니다.
// Pi Testnet의 주소를 정확히 입력해야 합니다.
const server = new Server("https://api.testnet.minepi.com");

// 유통자 비밀키 (S... 로 시작)
const distributorSecret = "SCSW5Z2EBBQNR2RZXAK7NKABKRCISD4FMFEW3WASFW2EXXHFVZ5XZAK4";
const distributorKeypair = StellarSdk.Keypair.fromSecret(distributorSecret);

// 발행자 공개키 (G... 로 시작)
const issuerPublic = "GC4WMFQYM2PKZLU4KYKYVPRFJ2HWLTK3PWW22YKSRVBZAJMSK75TPAIF";

// 토큰 코드 (pi.toml과 동일하게 대문자)
const assetCode = "EUNHASU";

async function changeTrust() {
  try {
    // 유통자 계정 불러오기
    const account = await server.loadAccount(distributorKeypair.publicKey());

    // 자산 정의
    const asset = new StellarSdk.Asset(assetCode, issuerPublic);

    // 트랜잭션 생성
    const transaction = new StellarSdk.TransactionBuilder(account, {
      // NOTE: Pi Network는 독자적인 네트워크이므로 Networks.TESTNET이 아닌 Pi 네트워크의 패스프레이즈를 사용해야 할 수 있습니다.
      // Pi Testnet의 패스프레이즈가 Stellar Testnet과 동일하다고 가정하고 진행합니다.
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET, 
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset }))
      .setTimeout(30)
      .build();

    // 서명
    transaction.sign(distributorKeypair);

    // 제출
    const result = await server.submitTransaction(transaction);
    console.log("? 신뢰선 설정 성공:", result.hash);
  } catch (error) {
    console.error("? 에러 발생:", error.response?.data || error);

    if (error.response?.data?.extras) {
      const extras = error.response.data.extras;

      // extras 전체 출력
      console.log("?? extras 전체:", util.inspect(extras, { depth: null, colors: true }));

      // result_codes만 따로 출력
      if (extras.result_codes) {
        console.log("?? result_codes:", extras.result_codes);
      }

      // result_xdr 디코딩
      if (extras.result_xdr) {
        try {
          const decoded = StellarSdk.xdr.TransactionResult.fromXDR(extras.result_xdr, "base64");
          console.log("?? 디코딩된 result_xdr:", util.inspect(decoded, { depth: null, colors: true }));
        } catch (decodeError) {
          console.error("?? result_xdr 디코딩 실패:", decodeError);
        }
      }
    }
    
    // Stellar Error 코드에 대한 추가 디버깅 팁
    if (error.response?.data?.title === "Transaction Failed") {
        console.log("\n?? 트랜잭션 실패 (Transaction Failed) 팁:");
        console.log("- 계정(distributorKeypair)이 Pi Testnet에 생성되어 있는지 확인하세요.");
        console.log("- 자산(EUNHASU)의 발행자(GB46SU...) 공개키가 맞는지 확인하세요.");
    }
  }
}

// 실행
changeTrust();