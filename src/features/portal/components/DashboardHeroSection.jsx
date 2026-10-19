import { Button } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { useAppState } from "../../../state/AppStateContext";

export function DashboardHeroSection({ onTestClick, userName }) {
    const { userProfile, onboarding } = useAppState();
    const resolvedUserName = userName || userProfile.name || onboarding.name || "Student";

    return (
        <section className="dashboard-hero-panel group relative overflow-hidden rounded-[24px] px-7 py-8 md:px-8 md:py-10">
            <div className="dashboard-hero-orb dashboard-hero-orb-top" />
            <div className="dashboard-hero-orb dashboard-hero-orb-bottom" />
            <div className="dashboard-hero-noise" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#ff9d6c]">
                        Home
                    </div>
                    <h1 className="display-font text-[2.15rem] font-bold leading-tight text-white md:text-[2.65rem]">
                        {`Welcome, ${resolvedUserName}`}
                    </h1>
                    <p className="mt-4 max-w-[34rem] text-sm font-medium leading-7 text-[#dcc5bc] md:text-base">
                        Answer quick questions to discover your personality type and ideal career direction.
                    </p>
                </div>

                <div className="flex justify-start md:justify-end md:self-end">
                    <Button
                        type="default"
                        size="large"
                        icon={<ExperimentOutlined />}
                        className="dashboard-hero-button !h-12 !rounded-[10px] !border-0 !bg-white !px-5 !font-semibold !text-[#321a15] sm:!min-w-[240px] md:!min-w-[260px]"
                       onClick={() => window.location.href = "/assessment/phycometrichalftest.html"}
                    >
                       Take The Free Personality Test 
                    </Button>
                </div>
            </div>
        </section>
    );
}