// Pi SDK is already loaded and initialized in index.html.

// 1. Pi Authentication Request
function authenticatePiUser() {
    // Attempt authentication when the app is loaded in the Pi Browser.
    Pi.authenticate((user) => {
        // Authentication success: user data is received.
        console.log("? Pi Auth Success. User ID:", user.uid);
        
        // Create and append a welcome message to the body.
        const welcomeMessage = document.createElement('p');
        welcomeMessage.textContent = `Welcome, ${user.username}! You can now purchase tokens.`; // Text changed to English/non-broken Korean
        document.body.appendChild(welcomeMessage);

        // Create and append the token purchase button.
        createPurchaseButton(user);

    }, (error) => {
        // Authentication failure or error handling.
        console.error("? Pi Auth Failed:", error);
        alert("Failed to connect to Pi Network. Please ensure you are running this in the Pi Browser.");
    });
}

// 2. Create Token Purchase Button
function createPurchaseButton(piUser) {
    const button = document.createElement('button');
    button.textContent = 'Purchase 100 Eunhasu Token with 1 Pi Test-Coin';
    button.onclick = () => requestEunhasuPayment(piUser);
    
    // Simple styling for the button
    button.style.cssText = 'padding: 10px 20px; font-size: 16px; margin-top: 20px; cursor: pointer; background-color: #f7a500; color: white; border: none; border-radius: 8px;';

    document.body.appendChild(button);
}

// 3. Pi Transaction Request Function (Core Logic)
function requestEunhasuPayment(piUser) {
    const piPrice = 1;       // Amount to pay in Pi Test-Coin
    const tokenAmount = 100; // Amount of Eunhasu Token to grant the user
    
    Pi.requestPayment({
        amount: piPrice,
        memo: "Eunhasu Token purchase request",
        metadata: { 
            action: "buy_eunhasu_token",
            token_code: "EUNHASU",
            token_amount: tokenAmount,
            pi_uid: piUser.uid     // Identifier for the server to grant tokens to the correct user
        },
        
        onIncomplete: (payment) => { console.log("Transaction pending:", payment); },
        
        onSuccess: (payment) => {
            // ? Payment successful!
            console.log("? Pi Test-Coin Payment Success:", payment);
            alert(`Payment Success! Requesting server to grant ${tokenAmount} Eunhasu Tokens.`);
            
            // ?? Server-side payment verification and token granting logic (MOST IMPORTANT)
            // In a real app, this step requires sending payment.identifier to the server
            // to verify payment legitimacy via the Pi Payments API and grant tokens.
            
            // For testing, we only show a success message here.
        },
        
        onFailure: (error) => {
            console.error("? Transaction Failed:", error);
            alert("Transaction was cancelled or failed.");
        }
    });
}

// Start the authentication process when the app is loaded.
authenticatePiUser();