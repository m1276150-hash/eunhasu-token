<script src="./app.js"></script>
// Pi SDK는 index.html에서 이미 로드되었으므로 여기서 다시 import 할 필요는 없습니다.

// 1. Pi 인증 요청
// 앱이 Pi Browser에서 로드될 때, 사용자 인증을 시도합니다.
function authenticatePiUser() {
    Pi.authenticate((user) => {
        // 인증 성공 시 사용자 정보를 받습니다.
        console.log("✅ Pi 인증 성공. 사용자 ID:", user.uid);
        
        // 여기에 환영 메시지 업데이트 등의 DOM 조작 코드를 추가할 수 있습니다.
        const welcomeMessage = document.createElement('p');
        welcomeMessage.textContent = `환영합니다, ${user.username}님! 이제 토큰을 구매할 수 있습니다.`;
        document.body.appendChild(welcomeMessage);

        // 토큰 구매 버튼을 생성하고 추가합니다.
        createPurchaseButton(user);

    }, (error) => {
        // 인증 실패 또는 오류 처리
        console.error("❌ Pi 인증 실패:", error);
        alert("Pi Network 연결에 실패했습니다. Pi Browser에서 실행 중인지 확인하세요.");
    });
}

// 2. 토큰 구매 버튼 생성
function createPurchaseButton(piUser) {
    const button = document.createElement('button');
    button.textContent = '1 Pi Test-Coin으로 100 Eunhasu Token 구매';
    button.onclick = () => requestEunhasuPayment(piUser);
    
    document.body.appendChild(button);
}

// 3. Pi 거래 요청 함수 (핵심)
function requestEunhasuPayment(piUser) {
    const piPrice = 1;       // Pi Test-Coin으로 지불할 금액
    const tokenAmount = 100; // 사용자에게 지급할 Eunhasu Token 수량
    
    Pi.requestPayment({
        amount: piPrice,
        memo: "Eunhasu Token 구매 요청",
        metadata: { 
            action: "buy_eunhasu_token",
            token_code: "EUNHASU", // 이전에 설정한 토큰 코드
            token_amount: tokenAmount,
            pi_uid: piUser.uid     // 서버가 누구에게 토큰을 지급할지 식별
        },
        
        onIncomplete: (payment) => { console.log("거래 대기 중:", payment); },
        
        onSuccess: (payment) => {
            // ✅ 결제 성공!
            console.log("✅ Pi Test-Coin 결제 성공:", payment);
            alert(`결제 성공! ${tokenAmount} Eunhasu Token 지급을 서버에 요청합니다.`);
            
            // 🚨 서버 측 결제 확인 및 토큰 지급 로직 실행 (가장 중요)
            // 실제 앱에서는 이 단계에서 서버로 payment.identifier를 전송하여
            // Pi Payments API를 통해 결제 위조 여부를 최종 확인하고 토큰을 지급해야 합니다.
            
            // 여기서는 테스트를 위해 성공 메시지만 표시합니다.
        },
        
        onFailure: (error) => {
            console.error("❌ 거래 실패:", error);
            alert("거래가 취소되었거나 실패했습니다.");
        }
    });
}

// 앱이 로드되면 인증 과정을 시작합니다.
authenticatePiUser();