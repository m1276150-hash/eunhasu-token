// Pi SDK is loaded and initialized in index.html.

// 1. Pi Authentication Request
function authenticatePiUser() {
    Pi.authenticate((user) => {
        // Authentication success
        console.log("✅ Pi Auth Success. User ID:", user.uid);
        
        // Add welcome message
        const welcomeMessage = document.createElement('p');
        welcomeMessage.textContent = `Welcome, ${user.username}! You can now purchase tokens.`;
        document.body.appendChild(welcomeMessage);

        // Create purchase button
        createPurchaseButton(user);

    }, (error) => {
        // Authentication failure
        console.error("❌ Pi Auth Failed:", error);
        console.error("Pi Network connection failed. Please ensure you are running this in the Pi Browser.");
    });
}

// 2. Create Token Purchase Button
function createPurchaseButton(piUser) {
    const button = document.createElement('button');
    button.textContent = 'Purchase 100 Eunhasu Token with 1 Pi Test-Coin';
    button.onclick = () => requestEunhasuPayment(piUser);
    
    // Simple styling for visibility
    button.style.cssText = 'padding: 10px 20px; font-size: 16px; margin-top: 20px; cursor: pointer; background-color: #f7a500; color: white; border: none; border-radius: 8px;';

    document.body.appendChild(button);
}

// 3. Pi Transaction Request Function
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
            // ✅ 핵심: 결제 성공 시, 결제 ID를 백엔드 검증 서버로 전송합니다.
            console.log("✅ Pi Payment Success (Frontend Confirmed):", payment);
            verifyPaymentOnServer(payment.identifier, piUser.uid, tokenAmount);

        },
        
        onFailure: (error) => {
            console.error("❌ Transaction Failed:", error);
        }
    });
}

// 4. 백엔드 검증 함수 (서버 API 호출을 시도합니다.)
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

        if (response.ok && result.verified) {
            console.log("✅ Server Verification Success. Tokens granted.");
            alert(`[최종 성공] 서버 검증 완료! ${tokenAmount} Eunhasu Token이 지급되었습니다.`);
        } else {
            console.error("❌ Server Verification Failed:", result.message);
            alert(`[검증 실패] 서버와의 통신에는 성공했지만, 결제 검증에 실패했습니다: ${result.message}`);
        }

    } catch (error) {
        console.error("❌ Network or Server Error during verification:", error);
        alert("[오류] 서버와의 통신에 실패했습니다. (경로 확인 필요)");
    }
}


// Start the authentication process only after the entire HTML is loaded.
document.addEventListener('DOMContentLoaded', authenticatePiUser);