// Razorpay integration utilities

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

// Create a one-time payment order
export const createRazorpayOrder = async (
  planId,
  subscriptionType,
  fetchWithAuth
) => {
  const response = await fetchWithAuth(`${BACKEND_URL}/payment/create-order`, {
    method: "POST",
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

// Create a recurring subscription
export const createRazorpaySubscription = async (
  planId,
  subscriptionType,
  fetchWithAuth
) => {
  const response = await fetchWithAuth(
    `${BACKEND_URL}/payment/create-subscription`,
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        subscription_type: subscriptionType,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create subscription");
  }

  return response.json();
};

// Verify a one-time payment
export const verifyPayment = async (
  orderId,
  paymentId,
  signature,
  fetchWithAuth
) => {
  const response = await fetchWithAuth(
    `${BACKEND_URL}/payment/verify-payment`,
    {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Payment verification failed");
  }

  return response.json();
};

// Open the Razorpay payment modal with custom styling
export const openRazorpayModal = async (options) => {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay script failed to load");
  }

  // Default theme colors that match your SaaS palette
  const defaultOptions = {
    theme: {
      color: "#f1e596", // Primary dark color
      backdrop_color: "#00141b", // Yellow accent color (for background)
      hide_topbar: false,
    },
    modal: {
      backdropclose: false,
      escape: true,
      animation: true,
    },
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...options,
    theme: {
      ...defaultOptions.theme,
      ...(options.theme || {}),
    },
    modal: {
      ...defaultOptions.modal,
      ...(options.modal || {}),
    },
  };

  const razorpay = new window.Razorpay(mergedOptions);
  razorpay.open();
};

// Create a credit top-up order
export const createCreditOrder = async (credits, fetchWithAuth) => {
  const response = await fetchWithAuth(
    `${BACKEND_URL}/payment/create-credit-order`,
    {
      method: "POST",
      body: JSON.stringify({
        credits: credits,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create credit order");
  }

  return response.json();
};

// Verify a credit payment
export const verifyCreditPayment = async (
  orderId,
  paymentId,
  signature,
  fetchWithAuth
) => {
  const response = await fetchWithAuth(
    `${BACKEND_URL}/payment/verify-credit-payment`,
    {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Credit payment verification failed");
  }

  return response.json();
};
