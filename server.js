/*
* =========================================================================
* 📢 중요: 이 파일은 브라우저에서 실행되는 것이 아닙니다!
* 실제 Mainnet 앱에서는 Node.js, Python 등의 백엔드 서버에서 실행되어야 합니다.
* 이 코드는 서버 결제 검증 로직의 개념을 보여주기 위해 작성되었습니다.
* =========================================================================
*/

// Pi Network Payments API와 통신하여 결제 상태를 확인하는 함수 (서버 측 로직)
async function checkPaymentStatus(paymentId) {
    // 📢 실제 서버에서는 Pi Payments API 호출 및 Private Key 서명 로직이 여기에 들어갑니다.
    
    console.log(`[Server Log] Pi Payments API에 ${paymentId}에 대한 결제 상태 요청...`);

    // ----------------------------------------------------------------------
    // ⚠️ 서버 측 검증 시나리오 (예시)
    // 1. Pi API 호출하여 결제가 완료되었는지 (Complete) 확인
    // 2. Pi API 응답을 통해 금액(1 Pi), 메타데이터가 일치하는지 확인
    // 3. 모든 검증 성공 시, Pi API를 호출하여 결제 상태를 'complete'로 최종 마킹합니다.
    // ----------------------------------------------------------------------

    const isVerified = Math.random() > 0.1; // 90% 확률로 성공을 가정 (테스트용)
    
    if (isVerified) {
        return {
            verified: true,
            message: "Pi Payments API 검증 완료 및 토큰 지급 성공."
        };
    } else {
        return {
            verified: false,
            message: "결제 ID가 유효하지 않거나, 금액이 일치하지 않습니다. (가상 오류)"
        };
    }
}

// 이 함수는 프론트엔드에서 /server-api-endpoint로 POST 요청이 왔을 때의 응답을 시뮬레이션합니다.
async function handlePaymentVerificationRequest(requestBody) {
    const { paymentId, userId, tokenAmount } = requestBody;

    console.log(`[Server] 결제 검증 요청 수신: ID ${paymentId}, 사용자 ${userId}`);

    const verificationResult = await checkPaymentStatus(paymentId);

    if (verificationResult.verified) {
        console.log(`[Server] 사용자 ${userId}에게 ${tokenAmount} Eunhasu Token 지급 완료.`);
    }

    return {
        verified: verificationResult.verified,
        message: verificationResult.message,
    };
}