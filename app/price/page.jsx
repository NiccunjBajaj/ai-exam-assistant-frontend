"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  createRazorpayOrder,
  verifyPayment,
  openRazorpayModal,
} from "../../lib/razorpay";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("http://localhost:8000/plan/all");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        toast.error("Failed to load plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const formatFeatures = (plan) => {
    const features = [];
    features.push(
      plan.message_limit === null
        ? "Unlimited messages"
        : `${plan.message_limit} messages/day`
    );
    features.push(
      plan.notes_limit === null
        ? "Unlimited notes"
        : `${plan.notes_limit} notes limit`
    );
    features.push(
      plan.flashcards_limit === null
        ? "Unlimited flashcards"
        : `${plan.flashcards_limit} flashcards limit`
    );
    return features;
  };

  const getSubscriptionType = (plan) =>
    plan.name === "Free" ? "lifetime" : "monthly";

  const upgradePlan = async (planId, subscription_type) => {
    setLoadingPlanId(planId);
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please login to upgrade");
      setLoadingPlanId(null);
      return;
    }

    try {
      const plan = plans.find((p) => p.id === planId);
      if (plan && plan.price === 0) {
        const res = await fetch(
          `http://localhost:8000/plan/upgrade/${planId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ subscription_type }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          fetchPlans();
        } else {
          toast.error(data.detail || "Upgrade failed");
        }
        return;
      }

      const orderData = await createRazorpayOrder(
        planId,
        subscription_type,
        token
      );

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learnee",
        description: `Upgrade to ${plan?.name} plan`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              token
            );
            toast.success("Payment successful! Plan upgraded.");
            fetchPlans();
          } catch (error) {
            toast.error(error.message || "Payment verification failed");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: { color: "#ffe243" },
        method: {
          upi: true, // Enable UPI
          card: true,
          netbanking: true,
          wallet: true,
          paylater: false, // Disable Pay Later
        },
        modal: { ondismiss: () => setLoadingPlanId(null) },
      };

      await openRazorpayModal(options);
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoadingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-black to-violet-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-black to-violet-900 text-white flex flex-col items-center py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl p-8 shadow-lg bg-gray-900 border border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-4xl font-bold mb-4">₹{plan.price}</p>
            <ul className="mb-6 space-y-2">
              {formatFeatures(plan).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => upgradePlan(plan.id, getSubscriptionType(plan))}
              disabled={loadingPlanId === plan.id}
              className={`w-full py-3 rounded-xl font-semibold ${
                loadingPlanId === plan.id
                  ? "bg-gray-600"
                  : "bg-pink-600 hover:bg-pink-700"
              }`}
            >
              {loadingPlanId === plan.id
                ? "Processing..."
                : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
