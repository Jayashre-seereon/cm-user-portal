import { useEffect, useMemo, useState } from "react";
import { Avatar, Alert, Button, Col, Form, Input, List, Modal, Row, Space, Tag, message } from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  EditOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ModuleScreen, PageHero, SectionCard } from "../../../components/ui";
import { getDashboard } from "../../../api/dashboardApi";
import { getApiErrorMessage } from "../../../api/authApi";
import { updateUserProfile } from "../../../api/userApi";
import { useAppState } from "../../../state/AppStateContext";
import { usePortalNavigation } from "../../portal/components/portalPageShared";
import { buildUsername, isValidDateInput, mapApiUserToProfile, splitFullName } from "../../../utils/auth";
import { useLocation } from "react-router-dom";

export default function ProfilePage() {
  const {
    bookings,
    hasActiveSubscription,
    onboarding,
    clearProfileEditRequest,
    profileEditRequestKey,
    setProfileIncomplete,
    savedCareers,
    saveUserProfile,
    subscriptionRecords,
    testHistory,
    userProfile,
  } = useAppState();

  const { navigate } = usePortalNavigation();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "";
  const [editOpen, setEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(false);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(userProfile);

  useEffect(() => {
    setForm(userProfile);
  }, [userProfile]);

  useEffect(() => {
    if (profileEditRequestKey > 0) {
      setEditOpen(true);
      clearProfileEditRequest();
    }
  }, [profileEditRequestKey]);

  useEffect(() => {
    if (editOpen) {
      loadDashboardProfile();
    }
  }, [editOpen]);

  const profileName = useMemo(() => userProfile.name || "Your profile", [userProfile.name]);
  const profileEmail = useMemo(() => userProfile.email || "No email added yet", [userProfile.email]);
  const dobError = form.dob && !isValidDateInput(form.dob) ? "Date of birth must be in YYYY-MM-DD format." : "";
  const canSaveProfile = !form.dob || isValidDateInput(form.dob);

  const scrollableCardClass = "h-[320px] overflow-y-auto scrollbar-hide";

  function buildEditForm(profile = userProfile) {
    return {
      name: profile.name || onboarding.name || "",
      email: profile.email || "",
      mobile: profile.mobile || "",
      address: profile.address || "",
      district: profile.district || "",
      city: profile.city || "",
      stateName: profile.stateName || "",
      country: profile.country || "India",
      dob: profile.dob || "",
      gender: profile.gender || "",
    };
  }

  async function loadDashboardProfile() {
    try {
      setIsLoadingProfileData(true);
      const response = await getDashboard();
      const dashboardProfile = response?.success ? mapApiUserToProfile(response?.data?.user) : null;
      setForm(buildEditForm(dashboardProfile || userProfile));
    } catch {
      setForm(buildEditForm(userProfile));
    } finally {
      setIsLoadingProfileData(false);
    }
  }

  async function openEditProfile() {
    setEditOpen(true);
  }

  async function handleProfileSave() {
    if (form.dob && !isValidDateInput(form.dob)) {
      setStatus({ type: "error", message: "Date of birth must be in YYYY-MM-DD format." });
      return;
    }

    const { firstName, lastName } = splitFullName(form.name);
    const payload = {
      firstName,
      lastName,
      username: buildUsername(form.name, form.email),
      email: form.email?.trim(),
      country: form.country?.trim(),
      state: form.stateName?.trim(),
      city: form.city?.trim(),
      district: form.district?.trim(),
      gender: form.gender,
      address: form.address?.trim(),
      dataOfBirth: form.dob ? new Date(form.dob).toISOString() : undefined,
    };

    try {
      setIsSavingProfile(true);
      setStatus(null);

      const response = await updateUserProfile(payload);
      const mappedProfile = mapApiUserToProfile(response?.data || response?.user || response);

      if (mappedProfile) {
        saveUserProfile({
          ...userProfile,
          ...mappedProfile,
          mobile: userProfile.mobile,
          password: userProfile.password,
          childName: userProfile.childName,
        });
      } else {
        saveUserProfile({
          ...userProfile,
          ...form,
        });
      }

      setEditOpen(false);
      setProfileIncomplete(false);
      message.success(response?.message || "Profile updated successfully");
      setStatus({
        type: "success",
        message: response?.message || "Profile updated successfully.",
      });

      if (returnTo) {
        navigate(returnTo, { replace: true, state: { profileCompleted: true } });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to update profile."),
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <ModuleScreen className="space-y-8">
      <PageHero backOnly onBack={() => navigate(-1)} />

      {/* Profile Header */}
      <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[#eedad4] bg-white p-6 shadow-soft md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
          <Avatar size={80} icon={<UserOutlined />} className="bg-brand/10 text-brand border-2 border-brand/20" />
          <div className="text-center md:text-left">
            <h1 className="m-0 text-2xl font-black text-ink">{profileName}</h1>
            <p className="m-0 text-muted">{profileEmail}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              <Tag color="gold" className="!m-0 !rounded-full !px-3 !font-bold">
                {hasActiveSubscription ? "Subscribed" : "Free tier"}
              </Tag>
              <Tag className="!m-0 !rounded-full !px-3 !font-bold">
                {bookings.length} bookings
              </Tag>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            icon={<EditOutlined />}
            onClick={openEditProfile}
            className="!h-11 !rounded-xl font-bold"
          >
            Edit Profile
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate("/app/settings")}
            className="!h-11 !rounded-xl font-bold"
          >
            Settings
          </Button>
        </div>
      </div>

      {status ? <Alert type={status.type} message={status.message} showIcon /> : null}

      {/* Equal Height Cards Row */}
      <Row gutter={[20, 20]} className="items-stretch">

        {/* Subscription Plan */}
        <Col xs={24} lg={8} className="flex flex-col">
          <SectionCard
            title={<Space><CreditCardOutlined className="text-brand" /> Subscription Plan</Space>}
            className="flex-1 flex flex-col"
          >
            <div className={scrollableCardClass}>
              {subscriptionRecords.length > 0 ? (
                <List
                  dataSource={subscriptionRecords}
                  className="w-full"
                  renderItem={(item) => (
                    <div className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-brand/10 p-3">
                          <CreditCardOutlined className="text-xl text-brand" />
                        </div>
                        <div>
                          <span className="block text-xs font-black uppercase tracking-[0.18em] text-brand">
                            {item.subscriptionName || item.planName}
                          </span>
                          <span className="text-sm font-bold text-ink">
                            {item.amount !== "" && item.amount != null ? `Rs ${item.amount}` : item.price}
                          </span>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="block text-xs font-bold uppercase text-muted">Validity</span>
                        <span className="font-bold text-ink">{item.validity || item.expiryDate}</span>
                      </div>
                      <Tag color="green" className="!m-0 !rounded-full !px-4 !font-bold uppercase">
                        {item.status || "Active"}
                      </Tag>
                    </div>
                  )}
                />
              ) : hasActiveSubscription ? (
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gray-50 p-6 md:flex-row md:items-center">
                  <p className="m-0 text-sm text-muted">Subscription data is loading.</p>
                </div>
              ) : (
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gray-50 p-6 md:flex-row md:items-center">
                  <p className="m-0 text-sm text-muted">You are currently on the Free Tier</p>
                  <Button
                    type="primary"
                    className="!rounded-xl font-bold"
                    onClick={() => navigate("/app/subscription")}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
        </Col>

        {/* Test History */}
        <Col xs={24} lg={8} className="flex flex-col">
          <SectionCard
            title={<Space><HistoryOutlined className="text-brand" /> Test History</Space>}
            className="flex-1 flex flex-col"
          >
            <div className={scrollableCardClass}>
              <List
                dataSource={testHistory}
                renderItem={(item) => (
                  <List.Item className="!items-start !px-0 !py-3">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-ink">{item.quizName || item.title}</div>
                      <div className="mt-1 text-xs text-muted">
                        {[
                          item.score ? `Score: ${item.score}` : "",
                          item.attemptedAt ? `Attempted: ${item.attemptedAt}` : item.subtitle,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </SectionCard>
        </Col>

        {/* Mentor Bookings */}
        <Col xs={24} lg={8} className="flex flex-col">
          <SectionCard
            title={<Space><CalendarOutlined className="text-brand" /> Mentor Bookings</Space>}
            className="flex-1 flex flex-col"
          >
            <div className={scrollableCardClass}>
              <List
                dataSource={bookings}
                renderItem={(item) => (
                  <List.Item className="!px-0 !py-3">
                    <div className="flex w-full flex-col gap-1">
                      <div className="text-sm font-bold text-ink">{item.mentorName}</div>
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-xs italic text-muted">{item.timeSlot || item.time}</span>
                        <span className="text-xs italic text-muted">
                          {item.mentorFee ? `Fee: Rs ${item.mentorFee}` : item.date}
                        </span>
                        <Tag className="!m-0 !text-[10px]">{item.status}</Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </SectionCard>
        </Col>

      </Row>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        footer={null}
        onCancel={() => {
          setEditOpen(false);
          setForm(buildEditForm(userProfile));
        }}
        title={<span className="text-xl font-black">Edit Profile</span>}
        width={880}
        className="profile-edit-modal [&_.ant-modal-content]:!rounded-[28px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!bg-white [&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!overflow-x-hidden [&_.ant-modal-header]:!m-0 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-[#efe2db] [&_.ant-modal-header]:!bg-white [&_.ant-modal-header]:!px-5 [&_.ant-modal-header]:!py-4 [&_.ant-modal-body]:!p-0 [&_.ant-modal-body]:!overflow-x-hidden [&_.ant-modal-wrap]:!bg-[rgba(17,12,10,0.28)]"
        centered
      >
        <div className="bg-white px-4 pb-4 pt-2 md:px-6">
          <div className="mx-auto flex max-h-[78vh] w-full flex-col gap-4 overflow-y-auto overflow-x-hidden pr-1 muted-scroll">
            <div className="rounded-[18px] border border-[#e6cfc4] bg-white px-4 py-2 text-[12px] leading-5 text-[#7a6d66] shadow-sm">
              Your saved profile details are prefilled here. Email, mobile number, and password are locked and cannot be edited.
            </div>

            {isLoadingProfileData ? (
              <div className="rounded-2xl bg-[#fdf0ed] px-4 py-3 text-sm font-semibold text-brand">
                Loading profile data...
              </div>
            ) : null}

            <Form layout="vertical" className="space-y-4" onFinish={handleProfileSave}>
              <div className="grid gap-4">
                {[
                  ["email", "Email Address", 2],
                  ["mobile", "Mobile Number", 2],
                  ["name", onboarding.userType === "parent" ? "Parent Name" : "Full Name", 2],
                  ["address", "Address", 2],
                  ["district", "District", 2],
                  ["city", "City", 2],
                  ["stateName", "State", 2],
                  ["country", "Country", 2],
                  ["dob", "Date of Birth", 2],
                ].map(([key, label]) => (
                  <Form.Item
                    label={
                      <span className="text-[12px] font-bold uppercase tracking-wide text-[#7a6d66]">
                        {label}
                      </span>
                    }
                    key={key}
                    className="!mb-0"
                  >
                    <Input
                      value={form[key] || ""}
                      disabled={key === "email" || key === "mobile"}
                      placeholder={`Enter ${String(label).toLowerCase()}`}
                      className="!h-12 !rounded-2xl !border-[#e1d6cf] !bg-white !px-4 !text-[14px]"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [key]: event.target.value }))
                      }
                      type={key === "dob" ? "date" : "text"}
                      autoComplete={key === "dob" ? "bday" : undefined}
                    />
                    {key === "email" || key === "mobile" ? (
                      <div className="mt-2 text-[12px] text-[#8a7f78]">Can&apos;t edit</div>
                    ) : null}
                    {key === "dob" && dobError ? (
                      <div className="mt-2 text-[12px] text-[#c62828]">{dobError}</div>
                    ) : null}
                  </Form.Item>
                ))}
              </div>

              <div className="rounded-[20px] border border-[#ead9d0] bg-white p-4">
                <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-[#7a6d66]">
                  Gender
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Male", "Female", "Other"].map((gender) => {
                    const active = form.gender === gender;
                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, gender }))}
                        className={`rounded-full border px-4 py-2 text-[12px] font-bold transition-colors ${
                          active
                            ? "border-brand bg-brand text-white"
                            : "border-[#e1d6cf] bg-white text-[#4d3c37] hover:bg-[#fcf7f4]"
                        }`}
                      >
                        {gender}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sticky bottom-0 -mx-4 border-t border-[#ead9d0] bg-[#fbf4ef]/95 px-4 pb-4 pt-4 backdrop-blur md:-mx-6 md:px-6">
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={isSavingProfile}
                  disabled={!canSaveProfile}
                  className="!h-12 !rounded-2xl !border-0 !bg-gradient-to-r !from-[#a61d33] !to-[#5b0f2c] !font-bold !shadow-lg !shadow-[#a61d33]/20"
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </ModuleScreen>
  );
}
