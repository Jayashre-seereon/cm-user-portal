import { Typography } from "antd";
import { ModuleScreen, PageHero, SectionCard } from "../../../components/ui";
import { usePortalNavigation } from "../../portal/components/portalPageShared";

const { Paragraph } = Typography;

export default function AboutPage() {
  const { navigate } = usePortalNavigation();

  return (
    <ModuleScreen className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>About Portal</h1>
          <p className="mt-1">A quick overview of what this career guidance portal includes.</p>
        </div>
        <PageHero backOnly onBack={() => navigate(-1)} className="shrink-0" />
      </div>
      <SectionCard title="What's included">
        <Paragraph>
          This portal now reflects the mobile app's information architecture: dashboard-first navigation, career discovery, student profile details, notifications, subscriptions, settings, psychometric flows, mentor booking, scholarships, institutes, entrance exams, study abroad, and quizzes.
        </Paragraph>
        <Paragraph>
          The experience is adapted as a professional responsive website for desktop and tablet while keeping the same client-side flows, sample data, and premium gating logic from the mobile app.
        </Paragraph>
      </SectionCard>
    </ModuleScreen>
  );
}
