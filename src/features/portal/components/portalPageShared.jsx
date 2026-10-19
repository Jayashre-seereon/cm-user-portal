import { Button, Modal, Space, Typography } from "antd";
import { ArrowRightOutlined, LockOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Paragraph } = Typography;

export function usePortalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const goToDashboard = () => navigate("/app/dashboard");
  return { navigate, location, goToDashboard };
}

export function PremiumGate({ title, description, returnTo }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#f0e4e2] bg-white shadow-sm">
      <div className="brand-gradient px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-lg text-white">
            <LockOutlined />
          </div>
          <div>
            <div className="text-lg font-black text-white">{title}</div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Subscription Required</div>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        <p className="m-0 text-sm leading-7 text-[#6f6663]">{description}</p>
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`)}
            className="!h-11 !rounded-xl !bg-[#9a2119] !border-[#9a2119] !px-5 !font-semibold"
          >
            Unlock Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnlockRedirectModal({ open, title, itemLabel, description, onCancel, onConfirm }) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      title={
        <div className="flex items-center gap-2 text-[#1a0a09]">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fdf0ee] text-[#9a2119]">
            <LockOutlined />
          </span>
          <span className="text-lg font-black">{title}</span>
        </div>
      }
      className="[&_.ant-modal-content]:!rounded-[28px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!p-0 [&_.ant-modal-header]:!m-0 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-[#f0e4e2] [&_.ant-modal-header]:!px-6 [&_.ant-modal-header]:!py-5 [&_.ant-modal-body]:!px-6 [&_.ant-modal-body]:!py-6"
    >
      <Space direction="vertical" size="large" className="!w-full">
        <Paragraph className="!mb-0 !text-sm !leading-7 !text-[#6f6663]">
          {description} {itemLabel ? <strong className="text-[#1a0a09]">{itemLabel}</strong> : null}
        </Paragraph>
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onCancel} className="!rounded-xl !border-[#e7d8d2]">
            Cancel
          </Button>
          <Button type="primary" onClick={onConfirm} className="!rounded-xl !bg-[#9a2119] !border-[#9a2119] !font-semibold">
            Unlock Now
          </Button>
        </div>
      </Space>
    </Modal>
  );
}
