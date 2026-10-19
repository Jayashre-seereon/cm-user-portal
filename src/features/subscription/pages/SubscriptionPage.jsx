import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, List, Row, Tag, Spin, message } from "antd";
import { CheckOutlined, CloseOutlined, RedoOutlined, RocketOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { getPlans, createOrder, verifyPayment } from "../../../api/subscriptionApi";
import { getAssessmentAccessStatus } from "../../../api/psychometricAssessmentApi";
import { getSubscriptions } from "../../../api/profile";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { usePortalNavigation } from "../../portal/components/portalPageShared";
import { loadRazorpayScript } from "../../../utils/razorpay.js";

export default function SubscriptionPage() {
  const { activePlanIds, activatePlan, refreshUserData } = useAppState();
  const { navigate } = usePortalNavigation();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo");

  const [plans, setPlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [assessmentAccess, setAssessmentAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    async function fetchPageData() {
      try {
        setLoading(true);
        const [plansRes, assessRes, subsRes] = await Promise.allSettled([
          getPlans(),
          getAssessmentAccessStatus(),
          getSubscriptions(),
        ]);

        if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value)) {
          setPlans(plansRes.value);
        }

        if (assessRes.status === "fulfilled" && assessRes.value) {
          setAssessmentAccess(assessRes.value);
        }

        if (subsRes.status === "fulfilled" && subsRes.value) {
          const raw = subsRes.value;
          const subItems = Array.isArray(raw?.data?.data)
            ? raw.data.data
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw)
                ? raw
                : [];
          setUserSubscriptions(subItems);
        }
      } catch (err) {
        console.error("Failed to load plans and subscriptions", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPageData();
  }, []);

  // Compute active plan IDs strictly for current session
  const activePlanIdSet = useMemo(() => {
    const ids = new Set((activePlanIds || []).map(String));
    (userSubscriptions || []).forEach((s) => {
      if (String(s?.status || "").toLowerCase() === "active") {
        const pId = s?.planId ?? s?.plan_id ?? s?.plan?.id;
        if (pId != null) ids.add(String(pId));
        const pName = s?.planName ?? s?.plan_name ?? s?.plan?.name;
        if (pName) ids.add(String(pName).toLowerCase());
      }
    });
    return ids;
  }, [activePlanIds, userSubscriptions]);

  // Handle payment button click
  const handleSelectPlan = async (planId, planObj) => {
    try {
      setProcessingPlanId(planId);

      // 1. Try loading Razorpay SDK script
      const script = await loadRazorpayScript();
      if (!script) {
        message.error("Failed to load payment gateway. Please check your internet connection.");
        setProcessingPlanId(null);
        return;
      }

      // 2. Create order on backend
      const orderResponse = await createOrder(planId);
      const { order, key } = orderResponse || {};

      if (!order?.id || !key) {
        message.error(orderResponse?.message || "Failed to initiate payment. Please try again.");
        setProcessingPlanId(null);
        return;
      }

      const hasAssessmentModule =
        (planObj?.modules || []).some((m) => /psychometric|assessment|test/i.test(String(m))) ||
        /psychometric|standard|popular|premium/i.test(String(planObj?.name || ""));

      // 3. Open Razorpay SDK modal
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,
        name: "CareerMap Portal",
        description: `${planObj?.name || "Plan"} Subscription`,
        handler: async function (response) {
          try {
            message.loading({ content: "Verifying payment...", key: "payment-verify" });
            await verifyPayment({ planId, ...response });
            message.success({ content: "Payment successful! Your subscription & assessment attempt are unlocked.", key: "payment-verify" });

            if (typeof refreshUserData === "function") {
              await refreshUserData();
            }
            if (typeof activatePlan === "function") {
              activatePlan(planId);
            }

            const targetReturn = returnTo || (hasAssessmentModule ? "/app/assessment" : "/app/dashboard");
            navigate(
              `/payment-success?planId=${planId}&transactionId=${response.razorpay_payment_id}&returnTo=${encodeURIComponent(targetReturn)}`
            );
          } catch (vErr) {
            console.error("Payment verification error:", vErr);
            message.error({ content: "Payment received. Please refresh or contact support if plan is not active.", key: "payment-verify" });
          } finally {
            setProcessingPlanId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      message.error(err?.response?.data?.message || err?.message || "Payment initiation failed.");
      setProcessingPlanId(null);
    }
  };

  // Static comparison data — edit this directly to change what shows in the table below.
  // Each row's `values` array must line up 1:1 with `comparisonPlans` order.
  const comparisonPlans = [
    { name: "Basic", price: "₹1,500" },
    { name: "Standard", price: "₹3,000" },
    { name: "Most Popular", price: "₹5,000" },
    { name: "Premium", price: "₹7,500", priceNote: "(₹5,000 + ₹2,500)" },
  ];

  const comparisonRows = [
    { feature: "Initial Career Guidance", values: [true, true, true, true] },
    { feature: "Detailed Psychometric Assessment", values: [false, true, true, true] },
    { feature: "Personalized Career Recommendations", values: [false, true, true, true] },
    {
      feature: "Comprehensive Career Counselling",
      values: [false, true, true, true],
      notes: [null, null, "(Unlimited for 1 Year)", "(Unlimited for 1 Year)"],
    },
    { feature: "Personalized Career Roadmap", values: [false, false, true, true] },
    { feature: "End-to-End Career Planning", values: [false, false, true, true] },
    { feature: "Annual Career Mentorship & Follow-up Support", values: [false, false, true, true] },
    { feature: "Study Abroad Guidance & Counselling", values: [false, false, false, true] },
    { feature: "Abroad Consultancy Support", values: [false, false, false, true] },
  ];

  const comparisonBestFor = [
    "Students looking for initial career guidance",
    "Students seeking a detailed assessment and personalized counselling",
    "Students requiring complete career planning with year-long mentorship",
    "Students planning both their career and higher education abroad",
  ];

  const isAssessmentLockedOrCompleted =
    assessmentAccess?.allowed === false &&
    (assessmentAccess?.reason === "ALREADY_COMPLETED" ||
      assessmentAccess?.requiresNewPlan ||
      Boolean(assessmentAccess?.completedAttemptId));

  return (
    <ModuleScreen className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-black text-ink">Choose Your Plan</h2>
          <p className="text-muted text-sm mt-1">
            Choose a plan tailored to your growth. Subscribing unlocks comprehensive career modules and assessment attempts.
          </p>
        </div>
        <PageHero backOnly onBack={() => navigate(-1)} className="shrink-0" />
      </div>

      <div className="rounded-[22px] border border-[#eedad4] bg-[#fff8f3] p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[15px] font-black text-ink">Unsure About Your Next Step?</div>
            <div className="text-[12px] font-medium text-muted">Speak to our Counsellor for guidance.</div>
          </div>
          <button
            type="button"
            className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
            onClick={() =>
              navigate("/app/settings", {
                state: {
                  openHelpCenter: true,
                },
              })
            }
          >
            Speak to our Counsellor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        /* Row setup for 4 cards: xs (1 card), sm (2 cards), lg (4 cards) */
        <Row gutter={[16, 16]} justify="center">
          {plans.map((plan) => {
            const isSelected =
              activePlanIdSet.has(String(plan.id)) ||
              activePlanIdSet.has(String(plan.name || "").toLowerCase());

            const hasAssessmentModule =
              (plan.modules || []).some((m) => /psychometric|assessment|test/i.test(String(m))) ||
              /psychometric|standard|popular|premium/i.test(String(plan.name || ""));

            const ribbonLabel = plan.highestseller ? "Best Seller" : plan.recommended ? "Recommended" : null;
            const ribbonClass = plan.highestseller
              ? "bg-[#d4a63a] text-[#fffaf0]"
              : "bg-[#9a2119] text-white";

            // Determine button state and label
            let buttonLabel = "Choose Plan";
            let buttonIcon = null;
            let planStatusTag = null;

            if (isSelected) {
              if (hasAssessmentModule) {
                if (isAssessmentLockedOrCompleted) {
                  buttonLabel = "Buy Retake / Subscribe Again";
                  buttonIcon = <RedoOutlined />;
                  planStatusTag = (
                    <Tag color="orange" className="!rounded-full font-bold !m-0 !px-2.5 !py-0.5">
                      Assessment Completed
                    </Tag>
                  );
                } else {
                  buttonLabel = "Buy Retake / Subscribe Again";
                  buttonIcon = <RedoOutlined />;
                  planStatusTag = (
                    <Tag color="green" className="!rounded-full font-bold !m-0 !px-2.5 !py-0.5">
                      Active Plan
                    </Tag>
                  );
                }
              } else {
                buttonLabel = "Renew / Subscribe Again";
                planStatusTag = (
                  <Tag color="green" className="!rounded-full font-bold !m-0 !px-2.5 !py-0.5">
                    Active Plan
                  </Tag>
                );
              }
            }

            const isProcessingThis = processingPlanId === plan.id;

            return (
              <Col xs={24} sm={12} lg={6} key={plan.id}>
                <Card
                  className={`!h-full !rounded-2xl !transition-all !duration-300 shadow-sm hover:shadow-lg relative overflow-hidden flex flex-col ${
                    isSelected ? "!border-brand !border-2" : "!border-[#eedad4]"
                  }`}
                  bodyStyle={{ padding: "0", display: "flex", flexDirection: "column", flex: 1 }}
                >
                  {ribbonLabel ? (
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-[200px] w-[200px] overflow-hidden">
                      {/* First ribbon */}
                      <div
                        className={`absolute right-[-40px] top-[22px] w-[170px] rotate-45 whitespace-nowrap py-1.5 text-center text-[9px] font-black uppercase tracking-[0.14em] shadow-sm ${ribbonClass}`}
                      >
                        {ribbonLabel}
                      </div>
                      {/* Second ribbon (only if both flags true) */}
                      {plan.highestseller && plan.recommended && (
                        <div className="absolute right-[-40px] top-[50px] w-[170px] rotate-45 whitespace-nowrap py-1.5 text-center text-[9px] font-black uppercase tracking-[0.14em] shadow-sm bg-[#9a2119] text-white">
                          Recommended
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Header Area */}
                  <div className={`p-5 ${isSelected ? "bg-brand/5" : "bg-gray-50/50"}`}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="text-sm font-bold text-ink/40 uppercase tracking-widest">
                        {plan.name}
                      </div>
                      {planStatusTag}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-brand">₹{plan.price}</span>
                      <span className="text-muted text-[10px] font-medium">/{plan.validity}</span>
                    </div>

                    {plan.descriptionHtml ? (
                      <div
                        className="prose prose-sm max-w-none mt-3
                                   prose-headings:text-ink
                                   prose-p:text-ink/70
                                   prose-li:text-ink/70
                                   prose-a:text-brand
                                   prose-strong:text-ink
                                   prose-table:border prose-table:border-line
                                   prose-td:border prose-td:border-line prose-td:p-2
                                   prose-th:border prose-th:border-line prose-th:p-2
                                   prose-blockquote:border-l-brand
                                   [&_*]:!text-[12px]"
                        dangerouslySetInnerHTML={{ __html: plan.descriptionHtml }}
                      />
                    ) : null}
                  </div>

                  {/* Features Area */}
                  <div className="p-5 pt-0 mt-0 flex-grow">
                    <List
                      split={false}
                      dataSource={plan.modules.length ? plan.modules : ["No modules available"]}
                      renderItem={(item) => (
                        <List.Item className="!border-none !px-0 !py-1.5">
                          <div className="flex items-start gap-2">
                            <CheckOutlined className="text-brand text-[12px] mt-1 flex-shrink-0" />
                            <span className="text-[13px] text-ink/80 leading-snug">{item}</span>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>

                  {/* Footer Button - ALWAYS ENABLED AND CLICKABLE */}
                  <div className="p-5 pt-0 mt-auto">
                    <Button
                      block
                      type="primary"
                      loading={isProcessingThis}
                      icon={buttonIcon}
                      size="large"
                      className="!h-11 !rounded-xl !text-sm !font-bold transition-transform active:scale-95 shadow-md !bg-[#9a2119] hover:!bg-[#821811] !border-none"
                      onClick={() => handleSelectPlan(plan.id, plan)}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Compare Features table, shown below all plan cards */}
      <h2 className="text-2xl font-black text-ink leading-none mt-0 pt-0">Compare features</h2>
      <p className="text-muted text-sm mt-0 pt-0 leading-tight">
        Find the best option by comparing key features.
      </p>
      <div className="mt-4 overflow-x-auto rounded-[22px] border border-[#eedad4] bg-white shadow-sm">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <colgroup>
            <col className="w-[320px]" />
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-[320px] bg-white p-5 align-bottom shadow-[6px_0_8px_-6px_rgba(0,0,0,0.08)]">
                <div className="text-xl font-black text-ink">Features</div>
              </th>
              {comparisonPlans.map((plan) => (
                <th key={plan.name} className="bg-gray-50/50 p-5 text-center align-bottom">
                  <div className="text-sm font-black uppercase tracking-widest text-ink">{plan.name}</div>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black text-brand">{plan.price}</span>
                  </div>
                  {plan.priceNote ? (
                    <div className="text-muted text-[11px] font-medium italic">{plan.priceNote}</div>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? "bg-gray-50/40" : "bg-white"}>
                <td
                  className={`sticky left-0 z-10 p-4 text-[13px] font-medium text-ink/80 shadow-[6px_0_8px_-6px_rgba(0,0,0,0.08)] ${
                    i % 2 === 0 ? "bg-gray-50/40" : "bg-white"
                  }`}
                >
                  {row.feature}
                </td>
                {row.values.map((included, j) => (
                  <td key={j} className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {included ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                          <CheckOutlined className="text-[11px]" />
                        </span>
                      ) : (
                        <CloseOutlined className="text-[12px] text-brand" />
                      )}
                      {row.notes?.[j] ? (
                        <span className="text-muted text-[10px] italic">{row.notes[j]}</span>
                      ) : null}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-50/50">
              <td className="sticky left-0 z-10 bg-gray-50/50 p-4 text-[13px] font-black text-ink shadow-[6px_0_8px_-6px_rgba(0,0,0,0.08)]">
                Best For
              </td>
              {comparisonBestFor.map((text, j) => (
                <td key={j} className="p-4 text-center text-[12px] leading-snug text-ink/70">
                  {text}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </ModuleScreen>
  );
}