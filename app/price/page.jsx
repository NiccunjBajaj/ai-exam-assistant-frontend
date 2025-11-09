"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  createRazorpayOrder,
  verifyPayment,
  openRazorpayModal,
  createRazorpaySubscription,
  createCreditOrder,
  verifyCreditPayment,
} from "../../lib/razorpay";
import { useAuth } from "../components/AuthContext";

export default function PricingPage() {
  const { fetchWithAuth, setCredits } = useAuth();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [plans, setPlans] = useState([]);
  const [planID, setPlanID] = useState({});
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingType, setBillingType] = useState("monthly");
  const [creditsToBuy, setCreditsToBuy] = useState(10);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch plans and current user plan
  useEffect(() => {
    fetchPlans();
    fetchPlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/plan/all`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else toast.error("Failed to load plans");
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/plan/me`);
      if (res.ok) {
        const data = await res.json();
        setPlanID(data);
      }
    } catch (error) {
      console.error("Error fetching current plan:", error);
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

  const getSubscriptionType = (plan) => {
    if (plan.billing_cycle === "lifetime") return "lifetime";
    return plan.billing_cycle; // monthly or yearly
  };

  const upgradePlan = async (planId, subscription_type) => {
    setLoadingPlanId(planId);

    try {
      const plan = plans.find((p) => p.id === planId);

      // Free plan
      if (plan && plan.price === 0) {
        const res = await fetchWithAuth(
          `${BACKEND_URL}/plan/upgrade/${planId}`,
          {
            method: "POST",
            body: JSON.stringify({ subscription_type }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          toast.success("Successfully upgraded to free plan!");
          fetchPlan();
        } else toast.error(data.detail || "Upgrade failed");
        return;
      }

      // One-time payment (lifetime)
      if (subscription_type === "lifetime" && plan.name !== "free") {
        await handleOneTimePayment(planId, subscription_type);
        return;
      }

      // Recurring subscription (monthly/yearly)
      if (["monthly", "yearly"].includes(subscription_type)) {
        await handleRecurringSubscription(planId, subscription_type);
        return;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleOneTimePayment = async (planId, subscription_type) => {
    try {
      const userEmail =
        localStorage.getItem("user_email") || "user@example.com";
      const userName = localStorage.getItem("user_name") || "User";

      const orderData = await createRazorpayOrder(
        planId,
        subscription_type,
        fetchWithAuth
      );

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learnee",
        description: `${subscription_type} plan purchase`,
        order_id: orderData.order_id,
        prefill: { name: userName, email: userEmail },
        notes: { plan_id: planId, subscription_type },
        handler: async (response) => {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              fetchWithAuth
            );
            toast.success("Payment successful! Your plan has been upgraded.");
            fetchPlan();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
      };

      await openRazorpayModal(options);
    } catch (error) {
      console.error("One-time payment error:", error);
      toast.error(error.message || "Payment failed");
    }
  };

  const handleRecurringSubscription = async (planId, subscription_type) => {
    try {
      const userEmail =
        localStorage.getItem("user_email") || "user@example.com";
      const userName = localStorage.getItem("user_name") || "User";

      const subscriptionData = await createRazorpaySubscription(
        planId,
        subscription_type,
        fetchWithAuth
      );

      const options = {
        key: subscriptionData.key_id,
        subscription_id: subscriptionData.subscription_id,
        name: "Learnee",
        description: `${subscription_type} plan subscription`,
        prefill: { name: userName, email: userEmail },
        notes: { plan_id: planId, subscription_type },
        handler: () => {
          toast.success("Subscription activated successfully!");
          fetchPlan();
        },
      };

      await openRazorpayModal(options);
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Subscription failed");
    }
  };

  const handleBuyCredits = async () => {
    const qty = Number(creditsToBuy);
    if (Number.isNaN(qty) || qty < 10 || qty > 50) {
      return toast.error("Enter credits between 10 and 50");
    }

    setIsBuyingCredits(true);
    try {
      const orderData = await createCreditOrder(qty, fetchWithAuth);

      const userEmail =
        localStorage.getItem("user_email") || "user@example.com";
      const userName = localStorage.getItem("user_name") || "User";

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learnee",
        description: `${qty} credits purchase`,
        order_id: orderData.order_id,
        prefill: { name: userName, email: userEmail },
        notes: { credits: qty },
        handler: async (response) => {
          try {
            const result = await verifyCreditPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              fetchWithAuth
            );
            toast.success("Credits added successfully");
            if (result?.total_credits !== undefined)
              setCredits(result.total_credits);
          } catch {
            toast.error("Verification failed. Contact support.");
          }
        },
      };

      await openRazorpayModal(options);
    } catch (err) {
      console.error("Buy credits error:", err);
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setIsBuyingCredits(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#00141b] text-[#e2e8f0] flex items-center justify-center">
        <div className="text-xl">Loading plans...</div>
      </div>
    );

  // ✅ Filter plans by billing cycle
  const filteredPlans = plans.filter(
    (plan) => plan.billing_cycle === billingType
  );

  const orderedPlans = [...filteredPlans].sort((a, b) => {
    const order = ["free", "pro", "premium"];
    return (
      order.indexOf(a.name.toLowerCase().split(" ")[0]) -
      order.indexOf(b.name.toLowerCase().split(" ")[0])
    );
  });

  return (
    <div
      className={`bg-[#00141b] flex flex-col items-center ${
        isMobile ? "px-2 pt-4" : "px-[5vw] pt-[0.5vw]"
      } min-h-screen text-[#e2e8f0]`}
    >
      <h1
        className={`${isMobile ? "text-4xl" : "text-[3.35vw]"} font-bold my-4`}
      >
        Choose Your Plan
      </h1>

      {/* Billing toggle */}
      <div
        className={`flex items-center justify-center mb-8 bg-[#0b1e26] ${
          isMobile ? "p-1 rounded-full text-sm" : "p-2 rounded-full"
        }`}
      >
        <button
          onClick={() => setBillingType("monthly")}
          className={`px-4 py-2 rounded-full transition-all ${
            billingType === "monthly"
              ? "bg-[#ffe655] text-[#00141b] font-semibold"
              : "text-[#e2e8f0]"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingType("yearly")}
          className={`px-4 py-2 rounded-full transition-all ${
            billingType === "yearly"
              ? "bg-[#ffe655] text-[#00141b] font-semibold"
              : "text-[#e2e8f0]"
          }`}
        >
          Yearly <span className="text-xs opacity-80">(Save 20%)</span>
        </button>
      </div>

      {/* Plan cards */}
      <div
        className={`grid ${
          isMobile ? "grid-cols-1" : "grid-cols-3"
        } gap-8 max-w-5xl w-full`}
      >
        {/* Lifetime Plans */}
        {plans
          .filter((p) => p.billing_cycle === "lifetime")
          .map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl ${
                isMobile ? "p-4" : "p-[1.5vw]"
              } shadow-lg transition-transform duration-300 hover:scale-105 ${
                plan.id == planID.planId
                  ? "bg-[#ffe655] text-[#00141b] border-4 border-[#e2e8f0]"
                  : "bg-[#e2e8f0] text-[#00141b]"
              }`}
            >
              <h2
                className={`${
                  isMobile ? "text-xl" : "text-2xl"
                } font-semibold mb-2 flex items-center justify-between`}
              >
                {plan.name}
                {plan.id == planID.planId && (
                  <span
                    className={`${
                      isMobile
                        ? "text-xs px-2 py-1"
                        : "text-[1.1vw] px-[0.8vw] py-[0.2vw]"
                    } bg-[#00141b] text-[#e2e8f0] rounded-full`}
                  >
                    Active
                  </span>
                )}
              </h2>
              <p
                className={`${
                  isMobile ? "text-3xl" : "text-4xl"
                } font-bold mb-4`}
              >
                ₹{plan.price}
                {plan.price > 0 && (
                  <span className="text-sm font-normal ml-1">/lifetime</span>
                )}
              </p>
              <ul className="mb-6 space-y-3">
                {formatFeatures(plan).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className={`${isMobile ? "text-sm" : ""}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => upgradePlan(plan.id, getSubscriptionType(plan))}
                disabled={plan.id === planID?.planId}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.id === planID?.planId
                    ? "bg-[#00141b] text-[#e2e8f0] pointer-events-none opacity-[0.4]"
                    : "bg-[#00141b] hover:bg-[#ffe655] text-[#e2e8f0] hover:text-[#00141b] cursor-pointer"
                }`}
              >
                {loadingPlanId === plan.id
                  ? "Processing..."
                  : plan.id === planID?.planId
                  ? "Current Plan"
                  : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}

        {/* Monthly or Yearly Plans */}
        {orderedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl ${
              isMobile ? "p-4" : "p-[1.5vw]"
            } shadow-lg transition-transform duration-300 hover:scale-105 ${
              plan.id == planID.planId
                ? "bg-[#ffe655] text-[#00141b] border-4 border-[#e2e8f0]"
                : "bg-[#e2e8f0] text-[#00141b]"
            }`}
          >
            <h2
              className={`${
                isMobile ? "text-xl" : "text-2xl"
              } font-semibold mb-2 flex items-center justify-between`}
            >
              {plan.name}
              {plan.id == planID.planId && (
                <span
                  className={`${
                    isMobile
                      ? "text-xs px-2 py-1"
                      : "text-[1.1vw] px-[0.8vw] py-[0.2vw]"
                  } bg-[#00141b] text-[#e2e8f0] rounded-full`}
                >
                  Active
                </span>
              )}
            </h2>
            <p
              className={`${isMobile ? "text-3xl" : "text-4xl"} font-bold mb-4`}
            >
              ₹{plan.price}
              {plan.price > 0 && (
                <span className="text-sm font-normal ml-1">
                  /{plan.billing_cycle === "yearly" ? "yr" : "mo"}
                </span>
              )}
            </p>
            <ul className="mb-6 space-y-3">
              {formatFeatures(plan).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className={`${isMobile ? "text-sm" : ""}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => upgradePlan(plan.id, getSubscriptionType(plan))}
              disabled={plan.id === planID?.planId}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                plan.id === planID?.planId
                  ? "bg-[#00141b] text-[#e2e8f0] pointer-events-none opacity-[0.4]"
                  : "bg-[#00141b] hover:bg-[#ffe655] text-[#e2e8f0] hover:text-[#00141b] cursor-pointer"
              }`}
            >
              {loadingPlanId === plan.id
                ? "Processing..."
                : plan.id === planID?.planId
                ? "Current Plan"
                : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
      {/* Credits Section */}
      <div
        className={`mt-12 w-full ${isMobile ? "max-w-full px-4" : "max-w-3xl"}`}
      >
        <div className="bg-[#e2e8f0] text-[#00141b] rounded-2xl p-6 shadow-lg">
          <h3
            className={`${
              isMobile ? "text-xl" : "text-2xl"
            } font-semibold mb-2`}
          >
            Need more credits?
          </h3>
          <p className={`${isMobile ? "text-sm" : ""} opacity-80 mb-4`}>
            Buy between 10 and 50 credits. ₹2 per credit.
          </p>
          <div
            className={`flex ${
              isMobile ? "flex-col" : "sm:flex-row"
            } gap-4 items-center`}
          >
            <div className="flex items-center gap-3">
              <label htmlFor="credits" className="font-medium">
                Credits
              </label>
              <input
                id="credits"
                type="number"
                min={10}
                max={50}
                value={creditsToBuy}
                onChange={(e) => setCreditsToBuy(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-[#00141b] bg-[#e2e8f0] text-[#00141b]"
              />
            </div>
            <div
              className={`ml-auto flex ${
                isMobile ? "flex-col w-full" : "items-center"
              } gap-4`}
            >
              <span className={`${isMobile ? "text-base" : "text-lg"}`}>
                Total: ₹
                {Math.max(10, Math.min(50, Number(creditsToBuy) || 0)) * 2}
              </span>
              <button
                onClick={handleBuyCredits}
                disabled={isBuyingCredits}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  isBuyingCredits
                    ? "bg-[#00141b] text-[#e2e8f0] opacity-60 cursor-not-allowed"
                    : "bg-[#00141b] text-[#e2e8f0] hover:bg-[#ffe655] hover:text-[#00141b]"
                }`}
              >
                {isBuyingCredits ? "Processing..." : "Buy Credits"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${
          isMobile ? "mt-4 text-xs" : "mt-8 text-sm"
        } text-center opacity-70 max-w-md`}
      >
        <p>
          All plans include access to our core features. Upgrade anytime to
          unlock higher limits and premium features.
        </p>
      </div>
    </div>
  );
}
