// Razorpay integration utilities

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      resolve(); // Still resolve to prevent hanging
    };
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (planId, subscriptionType, token) => {
  const response = await fetch("http://localhost:8000/payment/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      subscription_type: subscriptionType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create order");
  }

  return response.json();
};

export const verifyPayment = async (orderId, paymentId, signature, token) => {
  const response = await fetch("http://localhost:8000/payment/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Payment verification failed");
  }

  return response.json();
};

export const openRazorpayModal = async (options) => {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay script failed to load");
  }

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
