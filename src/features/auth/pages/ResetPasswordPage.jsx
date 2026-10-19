import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Space } from "antd";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getApiErrorMessage, resetPassword } from "../../../api/authApi";
import { isValidPassword } from "../../../utils/auth";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = params.token || searchParams.get("token") || searchParams.get("resetToken") || "";

  async function handleSubmit(values) {
    if (!token) {
      setStatus({
        type: "error",
        message: "Reset token is missing or invalid. Please open the link from your email again.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);

      const response = await resetPassword(token, values.newPassword, values.confirmPassword);
      form.resetFields();
      navigate("/login?userType=existing&mode=email", {
        replace: true,
        state: {
          passwordResetSuccess: response?.message || "Password reset successful.",
        },
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to reset password."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Reset Password" subtitle="Create a new password for your account." backTo="/login">
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {!token ? (
          <Alert
            type="error"
            showIcon
            message="Missing reset token"
            description="The reset link must include a token. Please use the link from your email or request a new one."
            style={{ borderRadius: "10px" }}
          />
        ) : null}

        <Form form={form} layout="vertical" className="cm-form-label" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password." },
              {
                validator: (_, value) =>
                  !value || isValidPassword(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Password must be at least 6 characters.")),
              },
            ]}
          >
            <Input.Password
              className="cm-input-field"
              prefix={<LockOutlined style={{ color: "#9a2119" }} />}
              iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#9a2119" /> : <EyeInvisibleOutlined />)}
              size="large"
              style={{ borderRadius: "10px" }}
              autoComplete="new-password"
              placeholder="Enter new password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Passwords do not match."));
                },
              }),
            ]}
          >
            <Input.Password
              className="cm-input-field"
              prefix={<LockOutlined style={{ color: "#9a2119" }} />}
              iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#9a2119" /> : <EyeInvisibleOutlined />)}
              size="large"
              style={{ borderRadius: "10px" }}
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={isSubmitting}
            disabled={!token}
            style={{ ...authPrimaryButtonStyle, width: "100%" }}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </Form>

        {status ? <Alert type={status.type} message={status.message} showIcon style={{ borderRadius: "10px" }} /> : null}
      </Space>
    </AuthShell>
  );
}
