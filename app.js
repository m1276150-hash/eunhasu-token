// 1. Pi SDK Initialization (Pi 객체 존재 여부 확인)
try {
    // Pi 객체가 전역에 존재하는지 확인하여 초기화 오류를 방지합니다.
    if (typeof Pi !== 'undefined') {
        Pi.init({ version: "2.0", mode: "sandbox" });
        console.log("✅ Pi SDK initialized successfully.");
    } else {
        // Pi 객체가 없으면 명확한 오류를 발생시킵니다.
        throw new Error("Pi SDK object (window.Pi) is undefined.");
    }
} catch (error) {
    console.error("❌ Pi SDK Initialization Failed:", error);
    // 화면에 치명적인 오류 메시지를 표시하여 사용자가 확인할 수 있게 합니다.
    const container = document.querySelector('.container');
    if (container) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "FATAL ERROR: Pi SDK 로드에 실패했습니다. Pi Browser에서 실행 중인지 확인해 주십시오.";
        errorMsg.style.cssText = 'color: red; font-weight: bold; margin-top: 20px;';
        container.appendChild(errorMsg);
    }
}


// 2. Pi Authentication Request
function authenticatePiUser() {
    // Pi 객체가 없으면 인증 시도를 하지 않습니다.
    if (typeof Pi === 'undefined') return;

    Pi.authenticate((user) => {
        // Authentication success
        console.log("✅ Pi Auth Success. User ID:", user.uid);
        
        // Add welcome message
        const welcomeMessage = document.createElement('p');
        welcomeMessage.textContent = `Welcome, ${user.username}! You can now purchase tokens.`;
        document.querySelector('.container').appendChild(welcomeMessage);

        // Create purchase button
        createPurchaseButton(user);

    }, (error) => {
        // Authentication failure
        console.error("❌ Pi Auth Failed:", error);
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "Pi Network connection failed. Please ensure you are running this in the Pi Browser. (Error Code: AUTH)";
        errorMsg.style.color = 'red';
        document.querySelector('.container').appendChild(errorMsg);
    });
}

// 3. Create Token Purchase Button
function createPurchaseButton(piUser) {
    const button = document.createElement('button');
    button.textContent = 'Purchase 100 Eunhasu Token with 1 Pi Test-Coin';
    button.onclick = () => requestEunhasuPayment(piUser);
    
    // Simple styling for visibility
    button.style.cssText = 'padding: 10px 20px; font-size: 16px; margin-top: 20px; cursor: pointer; background-color: #f7a500; color: white; border: none; border-radius: 8px; transition: background-color 0.3s;';
    button.onmouseover = () => button.style.backgroundColor = '#d38b00';
    button.onmouseout = () => button.style.backgroundColor = '#f7a500';

    document.querySelector('.container').appendChild(button);
}

// 4. Pi Transaction Request Function
function requestEunhasuPayment(piUser) {
    const piPrice = 1;      
    const tokenAmount = 100;
    
    Pi.requestPayment({
        amount: piPrice,
        memo: "Eunhasu Token purchase request",
        metadata: { 
            action: "buy_eunhasu_token",
            token_code: "EUNHASU",
            token_amount: tokenAmount,
            pi_uid: piUser.uid
        },
        
        onIncomplete: (payment) => { console.log("Transaction pending:", payment); },
        
        onSuccess: (payment) => {
            console.log("✅ Pi Payment Success (Frontend Confirmed):", payment);
            verifyPaymentOnServer(payment.identifier, piUser.uid, tokenAmount);

        },
        
        onFailure: (error) => {
            console.error("❌ Transaction Failed:", error);
            // 사용자에게 보이지 않는 alert 대신, 간단한 메시지를 사용합니다.
            const messageElement = document.createElement('p');
            messageElement.textContent = `[결제 실패] Pi Transaction Failed: ${error.message || JSON.stringify(error)}`;
            messageElement.style.color = 'orange';
            document.querySelector('.container').appendChild(messageElement);
        }
    });
}

// 5. 백엔드 검증 함수
async function verifyPaymentOnServer(paymentId, piUid, tokenAmount) {
    const verificationUrl = '/server-api-endpoint'; 

    try {
        const response = await fetch(verificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentId: paymentId,
                userId: piUid,
                tokenAmount: tokenAmount
            })
        });

        const result = await response.json();
        const message = result.message || "서버 검증 응답 확인 완료.";

        if (response.ok && result.verified) {
            console.log("✅ Server Verification Success. Tokens granted.");
            alert(`[최종 성공] 서버 검증 완료! ${tokenAmount} Eunhasu Token이 지급되었습니다.`);
        } else {
            console.error("❌ Server Verification Failed:", message);
            alert(`[검증 실패] 서버와의 통신에는 성공했지만, 결제 검증에 실패했습니다: ${message}`);
        }

    } catch (error) {
        console.error("❌ Network or Server Error during verification:", error);
        alert("[오류] 서버와의 통신에 실패했습니다. (경로 확인 필요)");
    }
}


// Start the authentication process only after the entire HTML is loaded, with a small delay.
document.addEventListener('DOMContentLoaded', () => {
    // 100ms 지연을 주어 Pi SDK가 완전히 로드될 시간을 확보합니다.
    setTimeout(authenticatePiUser, 100); 
});