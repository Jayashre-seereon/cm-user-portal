import { useEffect, useMemo, useState } from "react";
import { Button, Divider, List, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import { ArrowRightOutlined, CheckCircleOutlined, LockOutlined } from "@ant-design/icons";
import { subscriptions as staticSubscriptions } from "../../../data/careermapData";
import { getPlans } from "../../../api/subscriptionApi";
import { ModuleScreen } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { usePortalNavigation } from "../../portal/components/portalPageShared";

const { Text } = Typography;

export default function PaymentSuccessPage() {
  const { activatePlan, activePlanId, refreshUserData, subscriptionRecords } = useAppState();
  const { navigate } = usePortalNavigation();
  const [params] = useSearchParams();
  const planId = params.get("planId");
  const returnTo = params.get("returnTo");
  const transactionId = params.get("transactionId");

  const [apiPlans, setApiPlans] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const plans = await getPlans();
        if (Array.isArray(plans)) setApiPlans(plans);
      } catch {}

      if (typeof refreshUserData === "function") {
        await refreshUserData();
      }
    }
    init();
  }, []);

  const plan = useMemo(() => {
    const foundApi = apiPlans.find((p) => String(p.id) === String(planId));
    if (foundApi) return foundApi;

    const foundRecord = (subscriptionRecords || []).find((r) => String(r.planId) === String(planId));
    if (foundRecord) return { name: foundRecord.planName || foundRecord.subscriptionName, price: foundRecord.price || foundRecord.amount };

    const foundStatic = staticSubscriptions.find((item) => String(item.id) === String(planId));
    if (foundStatic) return foundStatic;

    return { name: "Career Plan", price: "₹3,000" };
  }, [apiPlans, planId, subscriptionRecords]);
  const accessUntil = useMemo(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, []);

  useEffect(() => {
    if (plan?.id && activePlanId !== plan.id) {
      activatePlan(plan.id);
    }
  }, [activePlanId, activatePlan, plan?.id]);

  function resolveReturnPath(path) {
    if (!path) {
      return "/app/dashboard";
    }

    try {
      let decoded = path;
      while (decoded.includes("%")) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) {
          break;
        }
        decoded = next;
      }
      return decoded || "/app/dashboard";
    } catch {
      return path;
    }
  }

  const handleContinue = () => {
    const destination = resolveReturnPath(returnTo);
    navigate(destination);
  };

  return (
    <ModuleScreen maxWidthClass="max-w-5xl" className="flex min-h-[72vh] items-center justify-center py-10">
      <div className="w-full overflow-hidden rounded-2xl border border-[#eee2df] bg-white shadow-[0_16px_42px_rgba(41,24,20,0.07)]">
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-center bg-[#a6251d] px-7 py-10 text-white sm:px-10 md:px-12">
  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10">
    <CheckCircleOutlined className="text-2xl !text-white" />
  </div>
  <p className="mb-2 text-xs font-bold uppercase !text-white">Payment confirmed</p>
  <h1 className="m-0 text-3xl font-bold leading-tight !text-white sm:text-4xl">Thank you!</h1>
  <p className="mt-3 max-w-sm text-sm leading-6 !text-white">
    Your account is now upgraded to <strong className="!text-white">{plan.name}</strong>. You can continue using your new benefits right away.
  </p>
  <div className="mt-8 border-t border-white/20 pt-5 text-sm !text-white">
    A confirmation email has been sent to your registered address.
  </div>
</section>

          <section className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eee7e4] pb-5">
              <div>
                <h2 className="m-0 text-xl font-bold text-[#1a0a09]">Transaction details</h2>
                <p className="mb-0 mt-1 text-sm text-[#80736f]">Your subscription is ready to use.</p>
              </div>
              <span className="rounded-full border border-[#b8ddc6] bg-[#f0faf3] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#267343]">Confirmed</span>
            </div>

            <List
              split={false}
              className="!mt-4 !p-0"
              dataSource={[
                ["Order ID", transactionId || "TXN-CONFIRMED"],
                ["Selected plan", plan.name],
                ["Amount paid", plan.price],
                ["Access until", accessUntil],
              ]}
              renderItem={([label, value]) => (
                <List.Item className="!flex !items-baseline !justify-between !gap-4 !border-none !px-0 !py-3">
                  <span className="text-sm text-[#756965]">{label}</span>
                  <span className="max-w-[65%] break-all text-right text-sm font-semibold text-[#1a0a09]">{value}</span>
                </List.Item>
              )}
            />

            <Divider className="!my-2 !border-[#eee7e4]" />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#827672]">
              <span className="inline-flex items-center gap-2"><LockOutlined className="text-[#a6251d]" /> Secure payment</span>
              <span>Need help? <a href="mailto:support@careermap.in" className="font-semibold text-[#a6251d]">Contact support</a></span>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleContinue}
              className="!mt-7 !h-12 !rounded-lg !border-[#a6251d] !bg-[#a6251d] !px-6 !font-semibold hover:!border-[#861d17] hover:!bg-[#861d17]"
            >
              <span className="inline-flex items-center gap-2">Continue to your account <ArrowRightOutlined /></span>
            </Button>
          </section>
        </div>
      </div>
    </ModuleScreen>
  );
}
